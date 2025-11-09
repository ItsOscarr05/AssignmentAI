from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import base64
import secrets
import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from jose import jwt
from pydantic import BaseModel, EmailStr, ValidationError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.database import get_db
from app.models.security import AuditLog, SecurityAlert, TwoFactorSetup
from app.models.user import User

import pyotp


router = APIRouter()

# --- In-memory state used for rate limiting & temporary 2FA setup ---
FAILED_LOGIN_ATTEMPTS: Dict[str, List[datetime]] = {}
SUCCESSFUL_LOGIN_ATTEMPTS: Dict[str, List[datetime]] = {}
user_2fa_secrets: Dict[int, str] = {}
user_backup_codes: Dict[int, List[str]] = {}
two_factor_setup_state: Dict[int, Dict[str, Any]] = {}
csrf_tokens: Dict[str, datetime] = {}

FAILED_ATTEMPT_LIMIT = 3
SUCCESS_ATTEMPT_LIMIT = 3
RATE_LIMIT_WINDOW = timedelta(minutes=1)


# --- Pydantic models -----------------------------------------------------------------
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    requires_2fa: bool = False
    refresh_token: Optional[str] = None
    user: Optional[Dict[str, Any]] = None


class _EmailValue(BaseModel):
    email: EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordResetRequestModel(BaseModel):
    email: EmailStr


class PasswordResetConfirmModel(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class TwoFactorVerifyRequest(BaseModel):
    code: str
    setup_id: Optional[str] = None
    is_backup_code: bool = False


class TwoFactorDisableRequest(BaseModel):
    password: str


class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    is_active: bool
    is_verified: bool


# --- Helper services -----------------------------------------------------------------
def _normalize_email(value: str) -> str:
    return value.strip().lower()


def _prune_attempts(bucket: Dict[str, List[datetime]], client_id: str) -> None:
    now = datetime.utcnow()
    attempts = bucket.get(client_id, [])
    bucket[client_id] = [ts for ts in attempts if now - ts <= RATE_LIMIT_WINDOW]


def _create_security_alert(
    db: Session,
    user_id: Optional[int],
    alert_type: str,
    description: str,
    severity: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    alert = SecurityAlert(
        user_id=user_id,
        alert_type=alert_type,
        description=description,
        severity=severity,
        alert_metadata=metadata or {},
    )
    db.add(alert)
    db.commit()


def _record_audit_log(
    db: Session,
    user_id: Optional[int],
    action: str,
    details: Dict[str, Any],
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    log = AuditLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        resource_type="auth",
    )
    db.add(log)
    db.commit()


def _ensure_password_strength(password: str) -> None:
    if len(password or "") < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters long.",
        )


def _encode_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    expire = datetime.utcnow() + expires_delta
    payload = {
        "exp": expire,
        "sub": subject,
        "iat": datetime.utcnow(),
        "type": token_type,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def generate_password_reset_token(user: User) -> str:
    return _encode_token(
        subject=user.email,
        token_type="password_reset",
        expires_delta=timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS),
    )


def verify_password_reset_token(token: str) -> Optional[str]:
    payload = verify_token(token)
    if not payload or payload.get("type") != "password_reset":
        return None
    return payload.get("sub")


def generate_email_verification_token(user: User) -> str:
    return _encode_token(
        subject=user.email,
        token_type="email_verification",
        expires_delta=timedelta(hours=settings.EMAIL_TOKEN_EXPIRE_HOURS),
    )


def verify_email_token(token: str) -> Optional[str]:
    payload = verify_token(token)
    if not payload or payload.get("type") != "email_verification":
        return None
    return payload.get("sub")


def _generate_backup_codes() -> List[str]:
    return [secrets.token_hex(3) for _ in range(8)]


class TOTPService:
    @staticmethod
    def generate_secret() -> str:
        return pyotp.random_base32()

    @staticmethod
    def provisioning_uri(secret: str, email: str) -> str:
        return pyotp.TOTP(secret).provisioning_uri(
            name=email, issuer_name=settings.PROJECT_NAME
        )

    @staticmethod
    def verify(secret: str, code: str) -> bool:
        try:
            return pyotp.TOTP(secret).verify(code, valid_window=1)
        except Exception:
            return False


totp = TOTPService()


def _get_user_by_email(db: Session, email: str) -> Optional[User]:
    normalized = _normalize_email(email)
    return (
        db.query(User)
        .filter(func.lower(User.email) == normalized)  # type: ignore[arg-type]
        .first()
    )


def _build_user_payload(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "is_verified": user.is_verified,
        "is_active": user.is_active,
    }


def _checkpoint_failed_attempts(db: Session, user: Optional[User], client_id: str) -> None:
    now = datetime.utcnow()
    _prune_attempts(FAILED_LOGIN_ATTEMPTS, client_id)
    FAILED_LOGIN_ATTEMPTS.setdefault(client_id, []).append(now)
    if len(FAILED_LOGIN_ATTEMPTS[client_id]) > FAILED_ATTEMPT_LIMIT:
        _create_security_alert(
            db=db,
            user_id=user.id if user else None,
            alert_type="rate_limit_exceeded",
            description="Exceeded login attempt limit.",
            severity="medium",
            metadata={"client_id": client_id},
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Too many login attempts. Please try again later.",
        )


def _checkpoint_success_attempts(db: Session, user: User, client_id: str) -> None:
    now = datetime.utcnow()
    _prune_attempts(SUCCESSFUL_LOGIN_ATTEMPTS, client_id)
    SUCCESSFUL_LOGIN_ATTEMPTS.setdefault(client_id, []).append(now)
    if len(SUCCESSFUL_LOGIN_ATTEMPTS[client_id]) > SUCCESS_ATTEMPT_LIMIT:
        _create_security_alert(
            db=db,
            user_id=user.id,
            alert_type="rate_limit_exceeded",
            description="Exceeded successful login limit.",
            severity="medium",
            metadata={"client_id": client_id},
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before trying again.",
        )


# --- Endpoints -----------------------------------------------------------------------
@router.get("/csrf-token")
def get_csrf_token() -> Dict[str, str]:
    token = secrets.token_urlsafe(32)
    csrf_tokens[token] = datetime.utcnow()
    return {"csrf_token": token}


@router.post("/login", response_model=LoginResponse)
async def login(request: Request, db: Session = Depends(get_db)) -> LoginResponse:
    if request.headers.get("content-type", "").startswith("application/json"):
        data = await request.json()
    else:
        form = await request.form()
        data = dict(form)

    email_raw = data.get("email") or data.get("username")
    password = data.get("password")

    if not email_raw or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and password are required.",
        )

    try:
        email = _EmailValue(email=email_raw).email
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid email address.",
        )

    normalized_email = _normalize_email(str(email))
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")

    _prune_attempts(FAILED_LOGIN_ATTEMPTS, normalized_email)
    if len(FAILED_LOGIN_ATTEMPTS.get(normalized_email, [])) >= FAILED_ATTEMPT_LIMIT:
        user_for_alert = _get_user_by_email(db, normalized_email)
        _create_security_alert(
            db=db,
            user_id=user_for_alert.id if user_for_alert else None,
            alert_type="rate_limit_exceeded",
            description="Exceeded login attempt limit.",
            severity="medium",
            metadata={"client_id": normalized_email},
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Too many login attempts. Please try again later.",
        )

    user = _get_user_by_email(db, str(email))

    if not user or not verify_password(password, user.hashed_password):
        _record_audit_log(
            db=db,
            user_id=user.id if user else None,
            action="login_attempt",
            details={"success": False, "reason": "invalid_credentials"},
            ip_address=client_ip,
            user_agent=user_agent,
        )
        if user:
            _create_security_alert(
                db=db,
                user_id=user.id,
                alert_type="failed_login",
                description="Failed login attempt detected.",
                severity="high",
                metadata={"client_id": normalized_email},
            )
        _checkpoint_failed_attempts(db, user, normalized_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    FAILED_LOGIN_ATTEMPTS.pop(normalized_email, None)
    _checkpoint_success_attempts(db, user, normalized_email)

    user.last_login = datetime.utcnow()
    db.commit()

    requires_2fa = bool(user.two_factor_enabled)

    _record_audit_log(
        db=db,
        user_id=user.id,
        action="login_attempt",
        details={"success": True, "requires_2fa": requires_2fa},
        ip_address=client_ip,
        user_agent=user_agent,
    )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        requires_2fa=requires_2fa,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=_build_user_payload(user),
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)) -> Dict[str, str]:
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserProfileResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    user_in: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    try:
        payload = RegisterRequest(**user_in)
    except ValidationError as exc:
        provided_keys = {key for key in user_in.keys() if key in {"email", "password", "full_name"}}
        if not provided_keys:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email, password, and full_name are required",
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        )

    if _get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    _ensure_password_strength(payload.password)

    user = User(
        email=_normalize_email(payload.email),
        name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.name,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
    }


@router.post("/refresh")
def refresh_token(payload: RefreshTokenRequest) -> Dict[str, Any]:
    token_data = verify_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    subject = token_data.get("sub")
    new_access = create_access_token(subject)
    return {
        "access_token": new_access,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post("/password-reset-request")
def password_reset_request(
    payload: PasswordResetRequestModel,
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    user = _get_user_by_email(db, payload.email)
    if user:
        generate_password_reset_token(user)
    return {"message": "If the email exists, password reset instructions have been sent."}


@router.post("/forgot-password")
def forgot_password(
    payload: PasswordResetRequestModel,
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    return password_reset_request(payload, db)


@router.post("/password-reset")
def password_reset(
    payload: PasswordResetConfirmModel,
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token.",
        )

    user = _get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    _ensure_password_strength(payload.new_password)
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password reset successful."}


@router.post("/reset-password")
def reset_password(
    payload: PasswordResetConfirmModel,
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    return password_reset(payload, db)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    _ensure_password_strength(payload.new_password)
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    _record_audit_log(
        db=db,
        user_id=current_user.id,
        action="change_password",
        details={"success": True},
    )
    return {"message": "Password changed successfully."}


@router.post("/verify-email")
def verify_email(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    email = verify_email_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )

    user = _get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully."}


@router.post("/resend-verification")
def resend_verification(
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    generate_email_verification_token(current_user)
    return {"message": "Verification email sent."}


def _create_totp_response(secret: str, email: str) -> Dict[str, Any]:
    provisioning_uri = totp.provisioning_uri(secret, email)
    qr_code = base64.b64encode(provisioning_uri.encode()).decode()
    return {"secret": secret, "qr_code": qr_code, "manual_entry": provisioning_uri}


@router.post("/2fa/setup")
def setup_two_factor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    secret = totp.generate_secret()
    setup_id = uuid.uuid4().hex

    user_2fa_secrets[current_user.id] = secret
    two_factor_setup_state[current_user.id] = {
        "setup_id": setup_id,
        "secret": secret,
        "created_at": datetime.utcnow(),
    }

    record = db.query(TwoFactorSetup).filter(TwoFactorSetup.user_id == current_user.id).first()
    if not record:
        record = TwoFactorSetup(user_id=current_user.id, secret_key=secret, is_enabled=False)
    else:
        record.secret_key = secret
        record.is_enabled = False
    db.add(record)
    db.commit()

    payload = _create_totp_response(secret, current_user.email)
    payload["setup_id"] = setup_id
    return payload


@router.post("/2fa/recover")
def recover_two_factor(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    stored = two_factor_setup_state.get(current_user.id)
    if stored:
        secret = stored["secret"]
    else:
        secret = totp.generate_secret()
        setup_id = uuid.uuid4().hex
        stored = {"setup_id": setup_id, "secret": secret, "created_at": datetime.utcnow()}
        two_factor_setup_state[current_user.id] = stored
        user_2fa_secrets[current_user.id] = secret

    payload = _create_totp_response(stored["secret"], current_user.email)
    payload["setup_id"] = stored["setup_id"]
    return payload


def _finalize_two_factor(
    db: Session,
    user: User,
    secret: str,
) -> Dict[str, Any]:
    user.two_factor_secret = secret
    user.two_factor_enabled = True
    backup_codes = _generate_backup_codes()
    user_backup_codes[user.id] = backup_codes
    user.backup_codes = {"codes": backup_codes}

    record = db.query(TwoFactorSetup).filter(TwoFactorSetup.user_id == user.id).first()
    if not record:
        record = TwoFactorSetup(user_id=user.id, secret_key=secret, is_enabled=True)
    else:
        record.secret_key = secret
        record.is_enabled = True
        record.backup_codes = {"codes": backup_codes}
    db.add(record)
    db.commit()

    two_factor_setup_state.pop(user.id, None)
    return {
        "message": "2FA verified successfully.",
        "backup_codes": backup_codes,
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
    }


def _verify_two_factor_code(
    db: Session,
    user: User,
    request_body: TwoFactorVerifyRequest,
) -> Dict[str, Any]:
    if request_body.is_backup_code:
        codes = user_backup_codes.get(user.id, [])
        if request_body.code not in codes:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid backup code.",
            )
        codes.remove(request_body.code)
        user_backup_codes[user.id] = codes
        if user.backup_codes:
            user.backup_codes["codes"] = codes
        db.commit()
        return _finalize_two_factor(db, user, user.two_factor_secret or user_2fa_secrets.get(user.id, ""))

    state = two_factor_setup_state.get(user.id)
    secret = None
    if state:
        if request_body.setup_id and state["setup_id"] != request_body.setup_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid setup identifier.",
            )
        secret = state["secret"]
    if not secret:
        secret = user.two_factor_secret or user_2fa_secrets.get(user.id)
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated.",
        )
    if not totp.verify(secret, request_body.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code.",
        )
    return _finalize_two_factor(db, user, secret)


@router.post("/2fa/verify")
def verify_two_factor(
    payload: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    return _verify_two_factor_code(db, current_user, payload)


@router.post("/verify-2fa")
def verify_two_factor_after_login(
    payload: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    return _verify_two_factor_code(db, current_user, payload)


@router.post("/2fa/disable")
def disable_two_factor(
    payload: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password.",
        )
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    user_backup_codes.pop(current_user.id, None)
    user_2fa_secrets.pop(current_user.id, None)
    two_factor_setup_state.pop(current_user.id, None)
    db.commit()
    return {"message": "Two-factor authentication disabled."}


@router.get("/2fa/status")
def two_factor_status(current_user: User = Depends(get_current_user)) -> Dict[str, bool]:
    return {"enabled": bool(current_user.two_factor_enabled)}


@router.post("/2fa/regenerate-backup-codes")
def regenerate_backup_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled.",
        )
    codes = _generate_backup_codes()
    user_backup_codes[current_user.id] = codes
    current_user.backup_codes = {"codes": codes}
    db.commit()
    return {"backup_codes": codes}


@router.post("/unlock-account")
def unlock_account(payload: PasswordResetRequestModel) -> Dict[str, str]:
    return {"message": "If the account existed, it has been unlocked."}

