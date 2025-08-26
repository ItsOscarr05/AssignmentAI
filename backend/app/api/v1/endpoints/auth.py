from datetime import timedelta, datetime
from typing import Any, Optional, Dict
from fastapi import APIRouter, Body, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
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
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, verify_token
import logging

logger = logging.getLogger(__name__)
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
# Simple device fingerprinting fallback
class SimpleDeviceFingerprintService:
    def generate_device_fingerprint(self, user_agent: str, ip_address: str, additional_data: Dict = None) -> str:
        """Generate a simple device fingerprint"""
        import hashlib
        import json
        from datetime import datetime
        
        fingerprint_data = {
            "user_agent": user_agent,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if additional_data:
            fingerprint_data.update(additional_data)
        
        fingerprint_string = json.dumps(fingerprint_data, sort_keys=True)
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()
    
    def analyze_device_risk(self, device_fingerprint: str, user: User, ip_address: str, user_agent: str) -> Dict:
        """Simple device risk analysis"""
        risk_score = 0
        risk_factors = []
        
        # Basic risk assessment
        if not ip_address.startswith("192.168.") and not ip_address.startswith("10."):
            risk_score += 10
            risk_factors.append("External IP address")
        
        if not user_agent or user_agent == "Mozilla/5.0":
            risk_score += 20
            risk_factors.append("Generic user agent")
        
        risk_level = "HIGH" if risk_score >= 30 else "MEDIUM" if risk_score >= 15 else "LOW"
        
        return {
            "device_fingerprint": device_fingerprint,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendations": ["Monitor for suspicious activity"] if risk_score > 0 else ["Normal risk level"]
        }

# Use the simple service as fallback
device_fingerprint_service = SimpleDeviceFingerprintService()

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
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

@router.get("/csrf-token")
async def get_csrf_token():
    """Generate and return a CSRF token"""
    csrf_token = secrets.token_urlsafe(32)
    return {"csrf_token": csrf_token}

@router.post("/login", response_model=TokenWith2FA)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    
    This endpoint implements secure login with:
    - Rate limiting (5 attempts per 15 minutes)
    - Account lockout after multiple failed attempts
    - Comprehensive audit logging
    - 2FA support
    - Session management
    """
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    logger.info(f"Login attempt: email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
    try:
        # Check rate limiting
        rate_limiter = get_rate_limiter(request.app)
        if rate_limiter.is_rate_limited(client_ip, "/api/v1/auth/login"):
            logger.warning(f"Rate limit exceeded: email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
            # Log rate limit exceeded
            from app.models.security import AuditLog
            audit_log = AuditLog(
                user_id=None,
                action="rate_limit_exceeded",
                details={
                    "ip_address": client_ip,
                    "user_agent": user_agent,
                    "endpoint": "/api/v1/auth/login"
                },
                ip_address=client_ip
            )
            db.add(audit_log)
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later."
            )
        
        # Find user by email
        user = db.query(User).filter(User.email == login_data.email).first()
        
        # Log login attempt (even for non-existent users to prevent user enumeration)
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=user.id if user else None,
            action="login_attempt",
            details={
                "success": False,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "email": login_data.email
            },
            ip_address=client_ip
        )
        db.add(audit_log)
        
        # Check if user exists
        if not user:
            logger.warning(f"Login failed: user not found, email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if user is active
        if not user.is_active:
            logger.warning(f"Login failed: account deactivated, email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )
        
        # Check if user is verified (optional - can be configured)
        if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
            logger.warning(f"Login failed: email not verified, email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please verify your email before logging in"
            )
        
        # Verify password
        if not verify_password(login_data.password, str(user.hashed_password)):
            logger.warning(f"Login failed: invalid password, email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
            # Update audit log with failure reason
            audit_log.details["reason"] = "invalid_password"
            db.commit()
            
            # Track failed login attempt with security monitoring
            from app.core.security import is_account_locked, track_login_attempt, get_lockout_remaining_time
            track_login_attempt(db, user, False)
            
            # Track IP-based security monitoring
            security_monitoring.track_failed_login_attempts(db, user, client_ip)
            
            if is_account_locked(user):
                remaining_time = get_lockout_remaining_time(user)
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"Account temporarily locked due to multiple failed attempts. Try again in {remaining_time // 60} minutes."
                )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if 2FA is enabled for this user
        # For now, we'll use a simple flag - in production, this should be stored in the user model
        user_2fa_enabled = getattr(user, 'two_factor_enabled', False)
        
        if user_2fa_enabled:
            logger.info(f"Login requires 2FA: email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
            # Return temporary token for 2FA verification
            temp_token_expires = timedelta(minutes=5)  # Short-lived token for 2FA
            temp_token = create_access_token(
                subject=user.id, expires_delta=temp_token_expires
            )
            
            # Update audit log for successful initial authentication
            audit_log.details["success"] = True
            audit_log.details["requires_2fa"] = True
            db.commit()
            
            return {
                "access_token": temp_token,
                "token_type": "bearer",
                "expires_in": 300,  # 5 minutes in seconds
                "requires_2fa": True
            }
        
        # Generate device fingerprint and analyze risk
        try:
            device_fingerprint = device_fingerprint_service.generate_device_fingerprint(
                user_agent=user_agent,
                ip_address=client_ip,
                additional_data={
                    "email": user.email,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Analyze device risk
            device_risk_analysis = device_fingerprint_service.analyze_device_risk(
                device_fingerprint, user, client_ip, user_agent
            )
            
            # Log device analysis if high risk
            if device_risk_analysis["risk_level"] in ["HIGH", "MEDIUM"]:
                logger.warning(f"Device risk detected for user {user.email}: {device_risk_analysis}")
                audit_log.details["device_risk"] = device_risk_analysis
        except Exception as e:
            logger.warning(f"Device fingerprinting failed: {e}")
            device_fingerprint = None
            device_risk_analysis = None
        
        # Create session with device fingerprint
        session_service = get_session_service(db)
        device_info = {
            "ip_address": client_ip,
            "user_agent": user_agent,
            "device_fingerprint": device_fingerprint
        }
        session_id = await session_service.create_session(
            user_id=user.id,
            device_info=device_info
        )
        
        # Create access token with session ID
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires, session_id=session_id
        )
        
        # Create refresh token
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            subject=user.id, expires_delta=refresh_token_expires
        )
        
        # Log successful login
        audit_log.details["success"] = True
        audit_log.details["session_id"] = str(session_id)
        audit_log.details["requires_2fa"] = False
        db.commit()
        
        # Track successful login attempt
        from app.core.security import track_login_attempt
        track_login_attempt(db, user, True)
        
        # Track IP-based security monitoring for successful login
        security_monitoring.track_successful_login(user, client_ip, user_agent)
        
        # Analyze login patterns for suspicious activity
        ip_analysis = security_monitoring.analyze_login_patterns(client_ip, user_agent)
        if ip_analysis["risk_score"] > 50:
            logger.warning(f"High-risk login detected: {ip_analysis}")
        
        logger.info(f"Login successful: user_id={user.id}, email={login_data.email}, ip={client_ip}, user_agent={user_agent}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "requires_2fa": False,
            "refresh_token": refresh_token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name or "",
                "is_verified": user.is_verified,
                "is_active": user.is_active
            }
        }
        
    except HTTPException as he:
        logger.error(f"Login HTTPException: email={login_data.email}, ip={client_ip}, user_agent={user_agent}, detail={he.detail}")
        raise
    except Exception as e:
        logger.error(f"Login error: email={login_data.email}, ip={client_ip}, user_agent={user_agent}, error={str(e)}")
        traceback.print_exc()
        
        # Update audit log with error
        if 'audit_log' in locals():
            audit_log.details["error"] = str(e)
            db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )



@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user and revoke current session"""
    try:
        token = request.headers.get("Authorization", "").split(" ")[1]
        payload = verify_token(token)
        
        # Get session service
        session_service = get_session_service(db)
        
        # Revoke session if session_id is in token
        if payload and "session_id" in payload:
            session_id = payload["session_id"]
            await session_service.revoke_session(current_user.id, session_id)
            logger.info(f"Revoked session {session_id} for user {current_user.id}")
        else:
            # If no session_id in token, try to revoke by device info
            # This handles cases where the token doesn't have session_id
            device_info = {
                "ip_address": request.client.host if request.client else "unknown",
                "user_agent": request.headers.get("user-agent", ""),
                "device_fingerprint": "logout_device"  # Fallback fingerprint
            }
            
            success = await session_service.revoke_current_session_by_device(current_user.id, device_info)
            if success:
                logger.info(f"Revoked current session by device for user {current_user.id}")
            else:
                # Last resort: try to find and revoke the most recent active session
                active_sessions = await session_service.get_user_sessions(current_user.id)
                if active_sessions:
                    most_recent_session = active_sessions[0]
                    await session_service.revoke_session(current_user.id, most_recent_session["id"])
                    logger.info(f"Revoked most recent session {most_recent_session['id']} for user {current_user.id}")
        
        # Log logout event
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="logout",
            details={
                "ip_address": request.client.host,
                "user_agent": request.headers.get("user-agent", ""),
                "session_id": payload.get("session_id") if payload else None
            },
            ip_address=request.client.host
        )
        db.add(audit_log)
        db.commit()
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during logout"
        )

@router.post("/logout-all")
async def logout_all(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout from all devices (revoke all sessions)
    """
    try:
        session_service = get_session_service(db)
        
        # Get current sessions before revoking
        sessions = await session_service.get_user_sessions(current_user.id)
        
        # Revoke all sessions
        success = await session_service.invalidate_all_sessions(current_user.id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to logout from all devices"
            )
        
        # Log logout from all devices
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="logout_all_devices",
            details={
                "sessions_revoked": len(sessions),
                "ip_address": request.client.host if request.client else "N/A",
                "user_agent": request.headers.get("user-agent", "N/A")
            },
            ip_address=request.client.host if request.client else "N/A"
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "Logged out from all devices",
            "sessions_revoked": len(sessions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging out from all devices for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error logging out from all devices"
        )

@router.get("/sessions")
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all active sessions for the user with enhanced device information
    """
    try:
        session_service = get_session_service(db)
        sessions = await session_service.get_user_sessions(current_user.id)
        
        # Add current session identification
        current_session_id = None
        # In a real implementation, you'd get this from the JWT token
        # For now, we'll mark the most recent session as current
        
        for session in sessions:
            if current_session_id is None:
                session["is_current"] = True
                current_session_id = session["id"]
            else:
                session["is_current"] = False
        
        return {
            "sessions": sessions,
            "total_sessions": len(sessions),
            "current_session_id": current_session_id
        }
        
    except Exception as e:
        logger.error(f"Error getting sessions for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving sessions"
        )

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a specific session
    """
    try:
        session_service = get_session_service(db)
        
        # Check if session exists and belongs to user
        session = await session_service.validate_session(session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Revoke the session
        success = await session_service.revoke_session(current_user.id, session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to revoke session"
            )
        
        # Log session revocation
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="session_revoked",
            details={
                "session_id": session_id,
                "device_info": session.device_info
            },
            ip_address="N/A"  # Would be available in request context
        )
        db.add(audit_log)
        db.commit()
        
        return {"message": "Session revoked successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking session {session_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error revoking session"
        )

@router.get("/sessions/{session_id}/analytics")
async def get_session_analytics(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific session"""
    try:
        session_service = get_session_service(db)
        
        # Verify session exists and belongs to user
        session = await session_service.validate_session(session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Get analytics for the specific session
        analytics = session_service.get_session_analytics_by_id(session_id)
        if not analytics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session analytics not found"
            )
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving session analytics"
        )

@router.get("/sessions/analytics")
async def get_user_session_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics for all sessions of current user"""
    try:
        session_service = get_session_service(db)
        analytics = await session_service.get_session_analytics(current_user.id)
        
        return {
            "user_id": current_user.id,
            "total_sessions": analytics.get("total_sessions", 0),
            "active_sessions": analytics.get("active_sessions", 0),
            "session_analytics": analytics.get("session_analytics", []),
            "summary": {
                "total_duration": analytics.get("total_duration", 0),
                "average_session_duration": analytics.get("average_session_duration", 0),
                "most_active_device": analytics.get("most_active_device", "Unknown")
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting session analytics for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving session analytics"
        )

@router.post("/sessions/{session_id}/activity")
async def track_session_activity(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track activity for a specific session"""
    try:
        # Parse activity data
        if request.headers.get("content-type", "").startswith("application/json"):
            activity_data = await request.json()
        else:
            activity_data = await request.form()
        
        session_service = get_session_service(db)
        
        # Verify session exists and belongs to user
        session = await session_service.validate_session(session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Track the activity
        activity_type = activity_data.get("activity_type", "unknown")
        details = activity_data.get("details", {})
        
        session_service.track_session_activity(
            session_id=session_id,
            activity_type=activity_type,
            details=details
        )
        
        return {
            "message": "Activity tracked successfully",
            "session_id": session_id,
            "activity_type": activity_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking activity for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error tracking session activity"
        )

@router.post("/sessions/cleanup")
async def cleanup_expired_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clean up expired sessions for the current user"""
    try:
        session_service = get_session_service(db)
        
        # Clean up expired sessions
        cleaned_count = await session_service.cleanup_expired_sessions()
        
        return {
            "message": "Session cleanup completed",
            "sessions_cleaned": cleaned_count
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up sessions for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error cleaning up sessions"
        )

@router.get("/sessions/status")
async def get_session_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current session status and statistics"""
    try:
        session_service = get_session_service(db)
        
        # Get active sessions
        sessions = await session_service.get_user_sessions(current_user.id)
        
        # Calculate statistics
        total_sessions = len(sessions)
        active_sessions = len([s for s in sessions if s.get("is_active", True)])
        
        # Get session analytics
        analytics = await session_service.get_session_analytics(current_user.id)
        
        return {
            "user_id": current_user.id,
            "session_stats": {
                "total_sessions": total_sessions,
                "active_sessions": active_sessions,
                "expired_sessions": total_sessions - active_sessions
            },
            "analytics_summary": {
                "total_duration": analytics.get("total_duration", 0),
                "average_session_duration": analytics.get("average_session_duration", 0),
                "most_active_device": analytics.get("most_active_device", "Unknown")
            },
            "last_activity": analytics.get("last_activity", None)
        }
        
    except Exception as e:
        logger.error(f"Error getting session status for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving session status"
        )

# @router.post("/test-token", response_model=schemas.User)
# def test_token(current_user: models.User = Depends(get_current_user)) -> Any:
#     """
#     Test access token
#     """
#     return current_user

@router.post("/register", status_code=201)
def register(
    *,
    user_in: dict = Body(...),
    db: Session = Depends(get_db),
    request: Request = None  # Add request to get IP and user agent
) -> Any:
    """
    Create new user.
    """
    try:
        client_ip = request.client.host if request else "N/A"
        user_agent = request.headers.get("user-agent", "N/A") if request else "N/A"
        logger.info(f"Registration request received from {client_ip} - {user_in}")
        from app.models.security import AuditLog
        # Extract fields from the request
        email = user_in.get("email")
        password = user_in.get("password")
        full_name = user_in.get("full_name")
        if not email or not password or not full_name:
            logger.warning(f"Registration failed (missing fields) from {client_ip} - email: {email}, full_name: {full_name}")
            audit_log = AuditLog(
                user_id=None,
                action="registration_attempt",
                details={
                    "success": False,
                    "reason": "missing_fields",
                    "ip_address": client_ip,
                    "user_agent": user_agent,
                    "email": email,
                },
                ip_address=client_ip,
                user_agent=user_agent
            )
            db.add(audit_log)
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Email, password, and full_name are required"
            )
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            logger.warning(f"Registration failed (email exists) from {client_ip} - email: {email}")
            audit_log = AuditLog(
                user_id=existing_user.id,
                action="registration_attempt",
                details={
                    "success": False,
                    "reason": "email_exists",
                    "ip_address": client_ip,
                    "user_agent": user_agent,
                    "email": email,
                },
                ip_address=client_ip,
                user_agent=user_agent
            )
            db.add(audit_log)
            db.commit()
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        # Create new user
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            name=full_name,
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User registered successfully: {user.id} from {client_ip} - email: {email}")
        audit_log = AuditLog(
            user_id=user.id,
            action="registration_attempt",
            details={
                "success": True,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "email": email,
            },
            ip_address=client_ip,
            user_agent=user_agent
        )
        db.add(audit_log)
        db.commit()
        return {"message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        # Log error to audit log if possible
        try:
            audit_log = AuditLog(
                user_id=None,
                action="registration_attempt",
                details={
                    "success": False,
                    "reason": str(e),
                    "ip_address": client_ip if 'client_ip' in locals() else "N/A",
                    "user_agent": user_agent if 'user_agent' in locals() else "N/A",
                    "email": user_in.get("email") if 'user_in' in locals() else None,
                },
                ip_address=client_ip if 'client_ip' in locals() else "N/A",
                user_agent=user_agent if 'user_agent' in locals() else "N/A"
            )
            db.add(audit_log)
            db.commit()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

@router.get("/me")
def read_users_me(
    current_user: User = Depends(get_current_user),
):
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.name,
        "role": "user",  # Default role for now
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat() if hasattr(current_user, 'created_at') else None,
        "updated_at": current_user.updated_at.isoformat() if hasattr(current_user, 'updated_at') else None
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

# @router.post("/change-password")
# async def change_password(
#     password_data: dict,
#     request: Request,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Change user's password"""
#     current_password = password_data.get("current_password")
#     new_password = password_data.get("new_password")
#     
#     if not current_password or not new_password:
#         raise HTTPException(status_code=400, detail="Current password and new password are required")
#     
#     if not verify_password(current_password, str(current_user.hashed_password)):
#         raise HTTPException(status_code=400, detail="Current password is incorrect")
#     
#     # Update password
#     from app.core.security import get_password_hash
#     current_user.hashed_password = get_password_hash(new_password)
#     db.commit()
#     
#     # Audit log
#     from app.models.security import AuditLog
#     log = AuditLog(
#         user_id=current_user.id,
#         action="change_password",
#         resource_type="user",
#         resource_id=str(current_user.id),
#         details={"success": True, "ip_address": request.client.host},
#         ip_address=request.client.host
#     )
#     db.add(log)
#     db.commit()
#     
#     return {"message": "Password changed successfully"}

# --- 2FA IMPLEMENTATION ---
import pyotp
import qrcode
import base64
from io import BytesIO

@router.post("/2fa/setup")
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Setup 2FA for user"""
    try:
        # Check if 2FA is already enabled
        if current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is already enabled for this account"
            )
        
        # Setup 2FA using the service
        secret, qr_code = TwoFactorAuthService.setup_2fa(db, current_user)
        
        # Log 2FA setup attempt
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="2fa_setup_initiated",
            details={
                "ip_address": "N/A",  # Would be available in request context
                "user_agent": "N/A"
            },
            ip_address="N/A"
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "2FA setup initiated",
            "qr_code": f"data:image/png;base64,{qr_code}",
            "secret": secret,  # In production, you might want to hide this
            "manual_entry": f"otpauth://totp/{settings.PROJECT_NAME}:{current_user.email}?secret={secret}&issuer={settings.PROJECT_NAME}"
        }
        
    except Exception as e:
        logger.error(f"2FA setup error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error setting up 2FA"
        )

@router.post("/2fa/verify")
async def verify_2fa_setup(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify 2FA setup with a code and enable 2FA"""
    try:
        # Parse request data
        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
        else:
            data = await request.form()
        
        code = data.get("code")
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA code is required"
            )
        
        # Check if 2FA is already enabled
        if current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is already enabled for this account"
            )
        
        # Verify the code and enable 2FA
        if not TwoFactorAuthService.confirm_2fa(db, current_user, code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA code"
            )
        
        # Generate backup codes
        backup_codes = TwoFactorAuthService.generate_backup_codes(db, current_user)
        
        # Log successful 2FA setup
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="2fa_setup_completed",
            details={
                "ip_address": request.client.host if request.client else "N/A",
                "user_agent": request.headers.get("user-agent", "N/A")
            },
            ip_address=request.client.host if request.client else "N/A"
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "2FA has been successfully enabled",
            "backup_codes": backup_codes,
            "warning": "Store these backup codes in a safe place. You won't be able to see them again."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA verification error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying 2FA setup"
        )

@router.post("/2fa/recover")
async def recover_2fa(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recover 2FA using backup code or generate new setup"""
    try:
        # Parse request data
        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
        else:
            data = await request.form()
        
        backup_code = data.get("backup_code")
        
        # If backup code is provided, validate it
        if backup_code:
            if not TwoFactorAuthService.verify_backup_code(db, current_user, backup_code):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or used backup code"
                )
            
            # Log successful backup code usage
            from app.models.security import AuditLog
            audit_log = AuditLog(
                user_id=current_user.id,
                action="2fa_backup_code_used",
                details={
                    "ip_address": request.client.host if request.client else "N/A",
                    "user_agent": request.headers.get("user-agent", "N/A")
                },
                ip_address=request.client.host if request.client else "N/A"
            )
            db.add(audit_log)
            db.commit()
            
            return {
                "message": "Backup code verified successfully",
                "2fa_disabled": True
            }
        
        # If no backup code provided, generate new setup
        if not current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not enabled for this account"
            )
        
        # Disable current 2FA and generate new setup
        TwoFactorAuthService.disable_2fa(db, current_user)
        secret, qr_code = TwoFactorAuthService.setup_2fa(db, current_user)
        
        # Log 2FA recovery attempt
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="2fa_recovery_initiated",
            details={
                "ip_address": request.client.host if request.client else "N/A",
                "user_agent": request.headers.get("user-agent", "N/A")
            },
            ip_address=request.client.host if request.client else "N/A"
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "2FA recovery initiated",
            "qr_code": f"data:image/png;base64,{qr_code}",
            "secret": secret,
            "manual_entry": f"otpauth://totp/{settings.PROJECT_NAME}:{current_user.email}?secret={secret}&issuer={settings.PROJECT_NAME}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA recovery error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during 2FA recovery"
        )

@router.post("/2fa/regenerate-backup-codes")
async def regenerate_backup_codes(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate backup codes for 2FA"""
    try:
        # Check if 2FA is enabled
        if not current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not enabled for this account"
            )
        
        # Regenerate backup codes
        backup_codes = TwoFactorAuthService.generate_backup_codes(db, current_user)
        
        # Log backup codes regeneration
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="2fa_backup_codes_regenerated",
            details={
                "ip_address": request.client.host if request.client else "N/A",
                "user_agent": request.headers.get("user-agent", "N/A")
            },
            ip_address=request.client.host if request.client else "N/A"
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "Backup codes regenerated successfully",
            "backup_codes": backup_codes,
            "warning": "Store these new backup codes in a safe place. The old backup codes are no longer valid."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Backup codes regeneration error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error regenerating backup codes"
        )

@router.post("/verify-2fa")
async def verify_2fa_code(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify 2FA code during login"""
    try:
        # Parse request data
        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
        else:
            data = await request.form()
        
        code = data.get("code")
        is_backup_code = data.get("is_backup_code", False)
        
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA code is required"
            )
        
        # Check if 2FA is enabled
        if not current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not enabled for this account"
            )
        
        # Verify the code
        if is_backup_code:
            if not TwoFactorAuthService.verify_backup_code(db, current_user, code):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or used backup code"
                )
        else:
            if not TwoFactorAuthService.verify_2fa(db, current_user, code):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid 2FA code"
                )
        
        # Create session after successful 2FA verification
        session_service = get_session_service(db)
        session = await session_service.create_session(
            user_id=current_user.id,
            ip_address=request.client.host if request.client else "N/A",
            user_agent=request.headers.get("user-agent", "N/A")
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=current_user.id, expires_delta=access_token_expires
        )
        
        # Create refresh token
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            subject=current_user.id, expires_delta=refresh_token_expires
        )
        
        # Log successful 2FA verification
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="2fa_verification_successful",
            details={
                "ip_address": request.client.host if request.client else "N/A",
                "user_agent": request.headers.get("user-agent", "N/A"),
                "used_backup_code": is_backup_code,
                "session_id": str(session.id)
            },
            ip_address=request.client.host if request.client else "N/A"
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "2FA verification successful",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_token": refresh_token,
            "user": {
                "id": str(current_user.id),
                "email": current_user.email,
                "name": current_user.name or "",
                "is_verified": current_user.is_verified,
                "is_active": current_user.is_active
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA verification error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during 2FA verification"
        )

@router.get("/2fa/status")
async def get_2fa_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get 2FA status for the current user"""
    try:
        return {
            "enabled": current_user.two_factor_enabled,
            "has_backup_codes": bool(current_user.backup_codes and len(current_user.backup_codes) > 0),
            "backup_codes_remaining": len(current_user.backup_codes) if current_user.backup_codes else 0
        }
    except Exception as e:
        logger.error(f"Error getting 2FA status for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving 2FA status"
        )

@router.post("/2fa/disable")
async def disable_2fa(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA for the current user"""
    try:
        # Check if 2FA is enabled
        if not current_user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not enabled for this account"
            )
        
        # Parse request data for password confirmation
        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
        else:
            data = await request.form()
        
        password = data.get("password")
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required to disable 2FA"
            )
        
        # Verify password
        if not verify_password(password, str(current_user.hashed_password)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
        
        # Disable 2FA
        TwoFactorAuthService.disable_2fa(db, current_user)
        
        # Log 2FA disable
        from app.models.security import AuditLog
        audit_log = AuditLog(
            user_id=current_user.id,
            action="2fa_disabled",
            details={
                "ip_address": request.client.host if request.client else "N/A",
                "user_agent": request.headers.get("user-agent", "N/A")
            },
            ip_address=request.client.host if request.client else "N/A"
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "message": "2FA has been successfully disabled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disabling 2FA for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error disabling 2FA"
        ) 
