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

# Import get_current_user from deps
from app.core.deps import get_current_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

@router.post("/login", response_model=Token)
def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    try:
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )
        
        if not verify_password(login_data.password, str(user.hashed_password)):
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )

        # Create access token with user ID as subject
        access_token = create_access_token(subject=user.id)
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Login error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
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

@router.post("/register", response_model=UserSchema)
def register(
    *,
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Create new user.
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="The user with this email already exists in the system.",
            )
        
        # Create new user
        hashed_password = get_password_hash(user_in.password)
        user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            name=user_in.name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        print(f"Registration error: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        raise

@router.get("/me", response_model=UserSchema)
def read_users_me(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.post("/verify-email")
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
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/resend-verification")
async def resend_verification(
    email: str,
    db: Session = Depends(get_db),
):
    """
    Resend email verification link
    """
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
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change password for authenticated user
    """
    if not verify_password(current_password, str(current_user.hashed_password)):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )
    
    # Update password using SQLAlchemy
    hashed_password = get_password_hash(new_password)
    db.query(User).filter(User.id == current_user.id).update({"hashed_password": hashed_password})
    db.commit()
    
    return {"message": "Password changed successfully"} 
