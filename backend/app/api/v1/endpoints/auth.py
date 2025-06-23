from datetime import timedelta, datetime
from typing import Any, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import EmailStr, ValidationError

from app import crud, schemas, models
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema, UserResponse, UserUpdate
from app.schemas.auth import UserLogin, LoginRequest, RegisterRequest, PasswordResetRequest, PasswordResetConfirm, TwoFactorSetup, TwoFactorVerify, TwoFactorBackup, PasswordCheck
from app.schemas.token import Token, TokenPayload
from app.core.security import get_password_hash, verify_password, create_access_token, verify_token
from app.services import auth_service
from app.services.email_service import email_service
from app.services.security_monitoring import security_monitoring
from app.core.rate_limit import rate_limiter
from app.database import get_db
from app.services.session_service import session_service, get_session_service
from app.core.rate_limit import rate_limit_middleware
from app.middleware.security import SecurityHeadersMiddleware
from app.services.session_service import SessionService
from app.models.session import UserSession
from app.services.two_factor import TwoFactorAuthService

# Import get_current_user from deps
from app.core.deps import get_current_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    login_data: LoginRequest,
):
    user = crud.user.get_by_email(login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        # Check rate limiting for login attempts
        client_id = request.client.host if request.client else "unknown"
        rate_limiter.check_login_attempts(client_id, login_data.email)
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    # Reset login attempts on successful login
    client_id = request.client.host if request.client else "unknown"
    rate_limiter.reset_client_limits(client_id)

    # Check if 2FA is required
    if user.two_factor_enabled:
        if not login_data.code:
            raise HTTPException(
                status_code=401,
                detail="2FA code required"
            )
        
        # Check rate limiting for 2FA attempts
        rate_limiter.check_2fa_attempts(client_id, login_data.email)
        
        if not TwoFactorAuthService.verify_2fa(user, login_data.code):
            raise HTTPException(
                status_code=401,
                detail="Invalid 2FA code"
            )
        
        # Reset 2FA attempts on successful verification
        rate_limiter.reset_2fa_attempts(client_id, login_data.email)

    # Create session
    session_id = session_service.create_session(
        user,
        request.client.host,
        request.headers.get("user-agent", ""),
        login_data.remember_me
    )

    access_token = create_access_token(data={"sub": user.email, "session_id": session_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Logout user and revoke current session"""
    token = request.headers.get("Authorization", "").split(" ")[1]
    payload = verify_token(token)
    if payload and "session_id" in payload:
        session_service.revoke_session(payload["session_id"])
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
    current_user: User = Depends(get_current_user)
):
    """Get analytics for a specific session"""
    # Verify session belongs to user
    if not any(session.get("id") == session_id for session in current_user.sessions):
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    analytics = session_service.get_session_analytics(session_id)
    if not analytics:
        raise HTTPException(
            status_code=404,
            detail="Session analytics not found"
        )
    
    return analytics

@router.get("/sessions/analytics")
async def get_user_session_analytics(
    current_user: User = Depends(get_current_user)
):
    """Get analytics for all sessions of current user"""
    return session_service.get_user_session_analytics(current_user.id)

@router.post("/sessions/{session_id}/activity")
async def track_session_activity(
    session_id: str,
    activity: dict,
    current_user: User = Depends(get_current_user)
):
    """Track activity for a specific session"""
    # Verify session belongs to user
    if not any(session.get("id") == session_id for session in current_user.sessions):
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    session_service.track_session_activity(
        session_id,
        activity.get("type"),
        activity.get("details")
    )
    
    return {"status": "success"}

@router.post("/test-token", response_model=schemas.User)
def test_token(current_user: models.User = Depends(get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user

@router.post("/register", response_model=UserSchema)
def register(
    *,
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = crud.user.get_by_email(user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    crud.user.create(user)
    return user

@router.get("/me", response_model=UserSchema)
def read_users_me(
    token: str = Depends(oauth2_scheme),
):
    user = auth_service.get_current_user(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.get("/oauth/{provider}/authorize")
async def oauth_authorize(provider: str):
    """
    Redirect to OAuth provider's authorization page
    """
    config = oauth_config.get_provider_config(provider)
    client = OAuth2Session(
        client_id=config["client_id"],
        client_secret=config["client_secret"],
        scope=config["scope"],
        redirect_uri=f"{settings.FRONTEND_URL}/oauth/callback/{provider}",
    )
    authorization_url, state = client.create_authorization_url(config["authorize_url"])
    return {"authorization_url": authorization_url, "state": state}

@router.post("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
):
    """
    Handle OAuth callback and create/update user
    """
    config = oauth_config.get_provider_config(provider)
    client = OAuth2Session(
        client_id=config["client_id"],
        client_secret=config["client_secret"],
        scope=config["scope"],
        redirect_uri=f"{settings.FRONTEND_URL}/oauth/callback/{provider}",
    )
    
    try:
        token = await client.fetch_token(
            config["token_url"],
            code=code,
            state=state,
        )
        user_info = await oauth_config.get_user_info(provider, token["access_token"])
        
        # Create or update user
        user = crud.user.get_by_email(user_info["email"])
        if not user:
            user = crud.user.create({
                "email": user_info["email"],
                "full_name": user_info["name"],
                "oauth_provider": provider,
                "oauth_id": user_info.get("id"),
            })
        
        # Store OAuth tokens
        user.oauth_access_token = token["access_token"]
        user.oauth_refresh_token = token.get("refresh_token")
        user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600))
        crud.user.update(user)
        
        # Create session
        session_id = session_service.create_session(
            user,
            request.client.host,
            request.headers.get("user-agent", ""),
        )
        
        # Create access and refresh tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "session_id": session_id}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id), "session_id": session_id}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {str(e)}",
        )

@router.post("/refresh-token")
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """
    Refresh access token using refresh token
    """
    try:
        # Verify refresh token
        payload = verify_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        user_id = payload.get("sub")
        session_id = payload.get("session_id")
        
        # Get user and verify session
        user = crud.user.get(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        # Verify session is still valid
        if not session_service.validate_session(session_id, request.client.host, request.headers.get("user-agent", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired",
            )
        
        # Create new access token
        access_token = create_access_token(
            data={"sub": str(user.id), "session_id": session_id}
        )
        
        # Create new refresh token (rotate refresh token)
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id), "session_id": session_id}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

@router.post("/2fa/setup", response_model=TwoFactorSetup)
async def setup_2fa(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is already enabled"
        )
    
    qr_code, secret = TwoFactorAuthService.setup_2fa(current_user)
    return {"qr_code": qr_code, "secret": secret}

@router.post("/2fa/confirm", response_model=TwoFactorVerify)
async def confirm_2fa(
    request: Request,
    code: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is already enabled"
        )
    
    # Check rate limiting for 2FA setup
    client_id = request.client.host if request.client else "unknown"
    rate_limiter.check_2fa_attempts(client_id, current_user.email)
    
    if not TwoFactorAuthService.confirm_2fa(current_user, code):
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code"
        )
    
    # Reset 2FA attempts on successful confirmation
    rate_limiter.reset_2fa_attempts(client_id, current_user.email)
    
    backup_codes = TwoFactorAuthService.generate_backup_codes(current_user)
    return {"backup_codes": backup_codes}

@router.post("/2fa/verify", response_model=Token)
async def verify_2fa(
    request: Request,
    code: str,
    current_user: User = Depends(get_current_user)
):
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is not enabled"
        )
    
    # Check rate limiting for 2FA verification
    client_id = request.client.host if request.client else "unknown"
    rate_limiter.check_2fa_attempts(client_id, current_user.email)
    
    if not TwoFactorAuthService.verify_2fa(current_user, code):
        raise HTTPException(
            status_code=401,
            detail="Invalid verification code"
        )
    
    # Reset 2FA attempts on successful verification
    rate_limiter.reset_2fa_attempts(client_id, current_user.email)
    
    access_token = create_access_token(data={"sub": current_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/2fa/backup", response_model=Token)
async def verify_backup_code(
    request: Request,
    code: str,
    current_user: User = Depends(get_current_user)
):
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is not enabled"
        )
    
    # Check rate limiting for backup code attempts
    client_id = request.client.host if request.client else "unknown"
    rate_limiter.check_2fa_attempts(client_id, current_user.email)
    
    if not TwoFactorAuthService.verify_backup_code(current_user, code):
        raise HTTPException(
            status_code=401,
            detail="Invalid backup code"
        )
    
    # Reset 2FA attempts on successful backup code verification
    rate_limiter.reset_2fa_attempts(client_id, current_user.email)
    
    access_token = create_access_token(data={"sub": current_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/2fa/disable")
async def disable_2fa(
    request: Request,
    code: str,
    current_user: User = Depends(get_current_user)
):
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is not enabled"
        )
    
    # Check rate limiting for 2FA verification
    client_id = request.client.host if request.client else "unknown"
    rate_limiter.check_2fa_attempts(client_id, current_user.email)
    
    if not TwoFactorAuthService.verify_2fa(current_user, code):
        raise HTTPException(
            status_code=401,
            detail="Invalid verification code"
        )
    
    # Reset 2FA attempts on successful verification
    rate_limiter.reset_2fa_attempts(client_id, current_user.email)
    
    TwoFactorAuthService.disable_2fa(current_user)
    return {"message": "2FA disabled successfully"}

@router.post("/2fa/backup-codes", response_model=TwoFactorVerify)
async def generate_backup_codes(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is not enabled"
        )
    
    backup_codes = TwoFactorAuthService.generate_backup_codes(current_user)
    return {"backup_codes": backup_codes}

@router.post("/check-password", response_model=PasswordCheck)
async def check_password(password: str):
    """
    Check password strength and if it has been exposed in data breaches
    """
    # Check password strength
    is_valid, message = password_service.check_password_strength(password)
    strength_score = password_service.calculate_password_strength_score(password)
    
    # Check for password breaches
    is_safe, breach_message = await password_service.check_password_breach(password)
    
    return {
        "is_valid": is_valid,
        "strength_score": strength_score,
        "message": message,
        "is_safe": is_safe,
        "breach_message": breach_message
    }

@router.post("/verify-email")
async def verify_email(
    token: str,
):
    """
    Verify user's email address
    """
    try:
        payload = verify_token(token)
        if not payload or "email" not in payload:
            raise HTTPException(
                status_code=400,
                detail="Invalid verification token"
            )
        
        user = crud.user.get_by_email(payload["email"])
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        if user.is_verified:
            raise HTTPException(
                status_code=400,
                detail="Email already verified"
            )
        
        user.is_verified = True
        # TODO: Save updated user to MongoDB/Beanie
        
        return {"message": "Email verified successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/resend-verification")
async def resend_verification(
    email: str,
):
    """
    Resend email verification link
    """
    user = crud.user.get_by_email(email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    if user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Email already verified"
        )
    
    # Generate verification token
    verification_token = create_access_token(
        data={"email": user.email},
        expires_delta=timedelta(hours=24)
    )
    
    # Send verification email
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    await auth_service.send_verification_email(user.email, verification_link)
    
    return {"message": "Verification email sent"}

@router.post("/forgot-password")
async def forgot_password(
    email: str,
):
    """
    Send password reset email
    """
    user = crud.user.get_by_email(email)
    if not user:
        # Don't reveal if user exists or not
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate password reset token
    reset_token = create_access_token(
        data={"email": user.email, "type": "password_reset"},
        expires_delta=timedelta(hours=1)
    )
    
    # Send password reset email
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    await auth_service.send_password_reset_email(user.email, reset_link)
    
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
):
    """
    Reset password using token
    """
    try:
        payload = verify_token(token)
        if not payload or "email" not in payload or payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset token"
            )
        
        user = crud.user.get_by_email(payload["email"])
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        # TODO: Save updated user to database
        
        return {"message": "Password reset successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user)
):
    """
    Change password for authenticated user
    """
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(new_password)
    # TODO: Save updated user to database
    
    return {"message": "Password changed successfully"} 
