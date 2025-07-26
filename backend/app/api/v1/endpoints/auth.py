from datetime import timedelta, datetime
from typing import Any, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import EmailStr, ValidationError
import secrets
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
import uuid
import traceback

from app import crud, schemas, models
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, UserResponse, UserUpdate
from app.schemas.auth import UserLogin, LoginRequest, RegisterRequest, PasswordResetRequest, PasswordResetConfirm, TwoFactorSetup, TwoFactorVerify, TwoFactorBackup, PasswordCheck, TokenWith2FA
from app.schemas.auth import Token
from app.schemas.token import TokenPayload
from app.core.security import get_password_hash, verify_password, create_access_token, verify_token
from app.services import auth_service
from app.services.email_service import email_service
from app.services.security_monitoring import security_monitoring
from app.core.rate_limit import get_rate_limiter
from app.database import get_db
from app.services.session_service import session_service, get_session_service
from app.core.rate_limit import rate_limit_middleware
from app.middleware.security import SecurityHeadersMiddleware
from app.services.session_service import SessionService
from app.models.session import UserSession
from app.services.two_factor import TwoFactorAuthService
from app.models.security import SecurityAlert

# Import get_current_user from deps
from app.core.deps import get_current_user

# Store the first backup code for test simulation
first_backup_code: Optional[str] = None
used_backup_codes = set()

# --- 2FA IMPLEMENTATION ---
import pyotp
import qrcode
import base64
from io import BytesIO

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

@router.get("/csrf-token")
async def get_csrf_token():
    """Generate and return a CSRF token"""
    csrf_token = secrets.token_urlsafe(32)
    return {"csrf_token": csrf_token}

@router.post("/login")
async def login(
    request: Request,
    db: Session = Depends(get_db),
):
    # Debug: Let's see what we're actually receiving
    print(f"DEBUG: Request method: {request.method}")
    print(f"DEBUG: Request headers: {dict(request.headers)}")
    
    # Get raw body
    body = await request.body()
    print(f"DEBUG: Raw body: {body}")
    
    # Try to parse form data manually
    try:
        form_data = await request.form()
        print(f"DEBUG: Form data: {form_data}")
    except Exception as e:
        print(f"DEBUG: Error parsing form: {e}")
        form_data = {}
    
    # Extract values
    username = form_data.get("username", "")
    password = form_data.get("password", "")
    grant_type = form_data.get("grant_type", "")
    
    print(f"DEBUG: username={username}, password={'*'*len(password) if password else 'None'}, grant_type={grant_type}")
    try:
        # Check rate limiting
        from app.core.rate_limit import get_rate_limiter
        rate_limiter = get_rate_limiter(app=request.app)
        client_id = request.client.host
        # Try to find user by email
        user = db.query(User).filter(User.email == form_data.username).first()
        # Check if rate limit exceeded
        if rate_limiter.is_rate_limited(client_id, "/api/v1/auth/login"):
            alert = SecurityAlert(
                user_id=user.id if user else None,
                alert_type="rate_limit_exceeded",
                description=f"Rate limit exceeded for IP: {client_id}",
                severity="medium",
                alert_metadata={"ip_address": client_id, "username": form_data.username}
            )
            db.add(alert)
            db.commit()
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded"
            )
        
        if not user:
            # Log failed login attempt
            from app.services.security_monitoring import security_monitoring
            from app.services.audit_service import audit_service
            from app.models.security import AuditLog
            
            # Create security alert
            alert = SecurityAlert(
                user_id=None,  # No user found
                alert_type="failed_login",
                description=f"Failed login attempt for email: {form_data.username}",
                severity="high",
                alert_metadata={"ip_address": client_id, "username": form_data.username}
            )
            db.add(alert)
            
            # Create audit log
            audit_log = AuditLog(
                user_id=None,
                action="login_attempt",
                details={"success": False, "reason": "user_not_found", "ip_address": client_id},
                ip_address=client_id
            )
            db.add(audit_log)
            db.commit()
            
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )
        
        if not verify_password(form_data.password, str(user.hashed_password)):
            # Log failed login attempt
            from app.models.security import AuditLog
            
            alert = SecurityAlert(
                user_id=user.id,
                alert_type="failed_login",
                description=f"Failed login attempt for user: {user.email}",
                severity="high",
                alert_metadata={"ip_address": client_id, "username": form_data.username}
            )
            db.add(alert)
            
            # Create audit log
            audit_log = AuditLog(
                user_id=user.id,
                action="login_attempt",
                details={"success": False, "reason": "invalid_password", "ip_address": client_id},
                ip_address=client_id
            )
            db.add(audit_log)
            db.commit()
            
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=400,
                detail="Inactive user"
            )
        
        # Check if 2FA is enabled
        global user_2fa_enabled
        if 'user_2fa_enabled' not in globals():
            user_2fa_enabled = {}
        
        if user_2fa_enabled.get(user.id, False):
            # Return temporary token for 2FA verification
            temp_token_expires = timedelta(minutes=5)  # Short-lived token for 2FA
            temp_token = create_access_token(
                subject=user.id, expires_delta=temp_token_expires
            )
            return {
                "access_token": temp_token,
                "token_type": "bearer",
                "expires_in": 300,  # 5 minutes in seconds
                "requires_2fa": True
            }
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "requires_2fa": False,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.name or "",
                "firstName": user.name.split(" ")[0] if user.name else ""
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print('LOGIN ERROR:', e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Logout user and revoke current session"""
    token = request.headers.get("Authorization", "").split(" ")[1]
    payload = verify_token(token)
    if payload and "session_id" in payload:
        await session_service.revoke_session(current_user.id, payload["session_id"])
    return {"message": "Successfully logged out"}

@router.post("/logout-all")
async def logout_all(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout from all devices
    """
    # Invalidate all sessions for the user
    session_service = get_session_service(db)
    await session_service.invalidate_all_sessions(current_user.id)
    return {"message": "Logged out from all devices"}

@router.get("/sessions")
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all active sessions for the user
    """
    session_service = get_session_service(db)
    sessions = await session_service.get_user_sessions(current_user.id)
    return sessions

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a specific session
    """
    session_service = get_session_service(db)
    await session_service.revoke_session(current_user.id, session_id)
    return {"message": "Session revoked successfully"}

@router.get("/sessions/{session_id}/analytics")
async def get_session_analytics(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific session"""
    # Verify session belongs to user
    if not any(session.get("id") == session_id for session in current_user.sessions):
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    session_service = get_session_service(db)
    analytics = await session_service.get_session_analytics(current_user.id)
    if not analytics:
        raise HTTPException(
            status_code=404,
            detail="Session analytics not found"
        )
    
    return analytics

@router.get("/sessions/analytics")
async def get_user_session_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for all sessions of current user"""
    session_service = get_session_service(db)
    return await session_service.get_session_analytics(current_user.id)

@router.post("/sessions/{session_id}/activity")
async def track_session_activity(
    session_id: str,
    activity: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track activity for a specific session"""
    # Verify session belongs to user
    if not any(session.get("id") == session_id for session in current_user.sessions):
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    # For now, just return success - session activity tracking can be implemented later
    return {"status": "success"}

@router.post("/test-token", response_model=schemas.User)
def test_token(current_user: models.User = Depends(get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user

@router.post("/register", status_code=201)
def register(
    *,
    user_in: dict = Body(...),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create new user.
    """
    try:
        print(f"Registration request received: {user_in}")
        
        # Extract fields from the request
        email = user_in.get("email")
        password = user_in.get("password")
        full_name = user_in.get("full_name")
        
        print(f"Extracted fields - email: {email}, full_name: {full_name}, password_length: {len(password) if password else 0}")
        
        if not email or not password or not full_name:
            raise HTTPException(
                status_code=400,
                detail="Email, password, and full_name are required"
            )
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        print("Creating new user...")
        
        # Create new user
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            name=full_name,
            updated_at=datetime.utcnow()
        )
        
        print(f"User object created: {user}")
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"User saved successfully with ID: {user.id}")
        
        return {"message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Registration error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

@router.get("/me")
def read_users_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.name,
        "role": "user",  # Default role for now
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified
    }

@router.get("/verify-email")
async def verify_email(
    token: str,
    db: Session = Depends(get_db),
):
    """
    Verify user's email address
    """
    try:
        payload = verify_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(
                status_code=400,
                detail="Invalid verification token"
            )
        
        user_id = payload["sub"]
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        if bool(user.is_verified):
            raise HTTPException(
                status_code=400,
                detail="Email already verified"
            )
        
        # Update user verification status using SQLAlchemy
        db.query(User).filter(User.id == user.id).update({"is_verified": True})
        db.commit()
        
        return {"message": "Email verified successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification token"
        )

@router.post("/resend-verification")
async def resend_verification(
    request: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Resend email verification link
    """
    email = request.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )
    
    user = crud.user.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    if bool(user.is_verified):
        raise HTTPException(
            status_code=400,
            detail="Email already verified"
        )
    
    # Generate verification token with user ID
    verification_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(hours=24)
    )
    
    # Send verification email
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    await auth_service.send_verification_email(str(user.email), verification_link)
    
    return {"message": "Verification email sent"}

@router.post("/forgot-password")
async def forgot_password(
    request: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Send password reset email
    """
    try:
        email = request.get("email")
        if not email:
            raise HTTPException(
                status_code=400,
                detail="Email is required"
            )
        
        user = crud.user.get_user_by_email(db, email=email)
        if not user:
            # Don't reveal if user exists or not
            return {"message": "If the email exists, a password reset link has been sent"}
        
        # Generate password reset token with user ID
        reset_token = create_access_token(
            subject=user.id,
            expires_delta=timedelta(hours=1)
        )
        
        # Send password reset email
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        await auth_service.send_password_reset_email(str(user.email), reset_link)
        
        return {"message": "If the email exists, a password reset link has been sent"}
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Forgot password error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

@router.post("/reset-password")
async def reset_password(
    request: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Reset password using token
    """
    try:
        token = request.get("token")
        new_password = request.get("new_password")
        
        if not token or not new_password:
            raise HTTPException(
                status_code=400,
                detail="Token and new_password are required"
            )
        
        payload = verify_token(token)
        if not payload or "sub" not in payload or payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )
        
        user_id = payload["sub"]
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Update password using SQLAlchemy
        hashed_password = get_password_hash(new_password)
        db.query(User).filter(User.id == user.id).update({"hashed_password": hashed_password})
        db.commit()
        
        return {"message": "Password reset successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/change-password")
async def change_password(
    password_data: dict,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user's password"""
    current_password = password_data.get("current_password")
    new_password = password_data.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current password and new password are required")
    
    if not verify_password(current_password, str(current_user.hashed_password)):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    from app.core.security import get_password_hash
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Audit log
    from app.models.security import AuditLog
    log = AuditLog(
        user_id=current_user.id,
        action="change_password",
        resource_type="user",
        resource_id=str(current_user.id),
        details={"success": True, "ip_address": request.client.host},
        ip_address=request.client.host
    )
    db.add(log)
    db.commit()
    
    return {"message": "Password changed successfully"}

# --- 2FA IMPLEMENTATION ---
import pyotp
import qrcode
import base64
from io import BytesIO

@router.post("/2fa/setup")
def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Setup 2FA for user"""
    # Generate a new secret
    secret = pyotp.random_base32()
    
    # Create TOTP object
    totp = pyotp.TOTP(secret)
    
    # Generate QR code
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="AssignmentAI"
    )
    
    # Create QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qrcode.make(provisioning_uri)
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Store secret temporarily (in production, store in user model)
    # For now, we'll store it in a global variable for testing
    global user_2fa_secrets
    if 'user_2fa_secrets' not in globals():
        user_2fa_secrets = {}
    user_2fa_secrets[current_user.id] = secret
    
    # Generate a setup ID for tracking
    setup_id = str(uuid.uuid4())
    
    return {
        "setup_id": setup_id,
        "qr_code": f"data:image/png;base64,{qr_code_base64}",
        "secret": secret
    }

@router.post("/2fa/verify")
def verify_2fa_setup(
    code: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify 2FA setup with a code"""
    global user_2fa_secrets
    if 'user_2fa_secrets' not in globals():
        user_2fa_secrets = {}
    
    secret = user_2fa_secrets.get(current_user.id)
    if not secret:
        raise HTTPException(status_code=400, detail="2FA not set up")
    
    totp = pyotp.TOTP(secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
    
    # Generate backup codes
    backup_codes = [str(uuid.uuid4())[:8].upper() for _ in range(8)]
    
    # Store backup codes (in production, store in user model)
    global user_backup_codes
    if 'user_backup_codes' not in globals():
        user_backup_codes = {}
    user_backup_codes[current_user.id] = backup_codes
    
    # Mark 2FA as enabled (in production, update user model)
    global user_2fa_enabled
    if 'user_2fa_enabled' not in globals():
        user_2fa_enabled = {}
    user_2fa_enabled[current_user.id] = True
    
    return {"backup_codes": backup_codes}

@router.post("/2fa/recover")
def recover_2fa(
    backup_code: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recover 2FA using backup code or generate new setup"""
    global user_backup_codes
    if 'user_backup_codes' not in globals():
        user_backup_codes = {}
    
    # If backup code is provided, validate it
    if backup_code:
        backup_codes = user_backup_codes.get(current_user.id, [])
        if backup_code not in backup_codes:
            raise HTTPException(status_code=400, detail="Invalid backup code")
        
        # Remove used backup code
        backup_codes.remove(backup_code)
        user_backup_codes[current_user.id] = backup_codes
    
    # Generate new setup
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="AssignmentAI"
    )
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qrcode.make(provisioning_uri)
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    global user_2fa_secrets
    if 'user_2fa_secrets' not in globals():
        user_2fa_secrets = {}
    user_2fa_secrets[current_user.id] = secret
    
    return {
        "setup_id": 1,
        "qr_code": f"data:image/png;base64,{qr_code_base64}",
        "secret": secret
    }

@router.post("/2fa/regenerate-backup-codes")
def regenerate_backup_codes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate backup codes"""
    global user_backup_codes
    if 'user_backup_codes' not in globals():
        user_backup_codes = {}
    
    backup_codes = [str(uuid.uuid4())[:8].upper() for _ in range(8)]
    user_backup_codes[current_user.id] = backup_codes
    
    return {"backup_codes": backup_codes}

@router.post("/verify-2fa")
async def verify_2fa_code(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify 2FA code during login"""
    if request.headers.get("content-type", "").startswith("application/json"):
        data = await request.json()
    else:
        data = await request.form()
    
    code = data.get("code")
    is_backup_code = data.get("is_backup_code", False)
    
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    
    global user_2fa_enabled, user_2fa_secrets, user_backup_codes
    if 'user_2fa_enabled' not in globals():
        user_2fa_enabled = {}
    if 'user_2fa_secrets' not in globals():
        user_2fa_secrets = {}
    if 'user_backup_codes' not in globals():
        user_backup_codes = {}
    
    if not user_2fa_enabled.get(current_user.id, False):
        raise HTTPException(status_code=400, detail="2FA not enabled")
    
    if is_backup_code:
        backup_codes = user_backup_codes.get(current_user.id, [])
        if code not in backup_codes:
            raise HTTPException(status_code=401, detail="Invalid or used backup code")
        
        # Remove used backup code
        backup_codes.remove(code)
        user_backup_codes[current_user.id] = backup_codes
        return {"success": True}
    else:
        secret = user_2fa_secrets.get(current_user.id)
        if not secret:
            raise HTTPException(status_code=400, detail="2FA not set up")
        
        totp = pyotp.TOTP(secret)
        if not totp.verify(code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")
        
        return {"success": True} 
