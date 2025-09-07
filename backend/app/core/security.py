from datetime import datetime, timedelta
from typing import Any, Union, Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
import re
from app.core.config import settings
from app.models.user import User
from sqlalchemy.orm import Session

# Configure password hashing with better defaults
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Increased rounds for better security
    bcrypt__ident="2b"  # Use the more secure 2b identifier
)

def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password against security requirements.
    Returns (is_valid, error_message)
    """
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"
    
    if settings.PASSWORD_REQUIRE_SPECIAL_CHARS and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    
    if settings.PASSWORD_REQUIRE_NUMBERS and not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    
    if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    
    if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    
    return True, ""

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt with increased rounds.
    """
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    Create a JWT access token with expiration.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """
    Create a JWT refresh token with longer expiration.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """
    Verify a JWT token and return its payload.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.
    Handles exp as int/float (timestamp) or datetime.
    """
    payload = verify_token(token)
    if not payload:
        return True
    exp = payload.get("exp")
    if not exp:
        return True
    # Handle both int/float (timestamp) and datetime
    if isinstance(exp, (int, float)):
        exp_dt = datetime.fromtimestamp(exp)
    elif isinstance(exp, str):
        try:
            exp_dt = datetime.fromtimestamp(float(exp))
        except Exception:
            return True
    elif isinstance(exp, datetime):
        exp_dt = exp
    else:
        return True
    return exp_dt < datetime.utcnow()

def check_password_history(db: Session, user: User, new_password: str) -> bool:
    """Check if the new password was used recently"""
    if not user.password_history:
        return True
    
    password_history = user.password_history
    new_hash = get_password_hash(new_password)
    
    # Check against last N passwords
    for old_hash in password_history[-settings.PASSWORD_HISTORY_SIZE:]:
        if verify_password(new_password, old_hash):
            return False
    return True

def update_password_history(db: Session, user: User, new_password: str) -> None:
    """Update password history"""
    new_hash = get_password_hash(new_password)
    if not user.password_history:
        user.password_history = []
    
    user.password_history.append(new_hash)
    # Keep only last N passwords
    if len(user.password_history) > settings.PASSWORD_HISTORY_SIZE:
        user.password_history = user.password_history[-settings.PASSWORD_HISTORY_SIZE:]
    
    user.last_password_change = datetime.utcnow()
    db.commit()

def track_login_attempt(db: Session, user: User, success: bool) -> None:
    """Track login attempts and handle account locking with progressive delays"""
    import logging
    logger = logging.getLogger(__name__)
    
    if success:
        # Reset on successful login
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login = datetime.utcnow()
        logger.info(f"Successful login for user {user.email}")
    else:
        user.failed_login_attempts += 1
        
        # Progressive lockout: longer delays for repeated failures
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            # Calculate progressive delay: 15min, 30min, 1hr, 2hr, 4hr, 8hr, 24hr
            delay_minutes = min(15 * (2 ** (user.failed_login_attempts - settings.MAX_LOGIN_ATTEMPTS)), 1440)
            user.account_locked_until = datetime.utcnow() + timedelta(minutes=delay_minutes)
            
            logger.warning(
                f"Account locked for user {user.email} after {user.failed_login_attempts} failed attempts. "
                f"Locked until {user.account_locked_until}"
            )
        else:
            logger.warning(
                f"Failed login attempt {user.failed_login_attempts}/{settings.MAX_LOGIN_ATTEMPTS} for user {user.email}"
            )
    
    db.commit()

def is_account_locked(user: User) -> bool:
    """Check if account is locked and return lockout information"""
    if not user.account_locked_until:
        return False
    
    if datetime.utcnow() > user.account_locked_until:
        # Lockout expired, reset
        user.account_locked_until = None
        user.failed_login_attempts = 0
        # Note: db.commit() should be called by the calling function
        return False
    
    return True

def get_lockout_remaining_time(user: User) -> Optional[int]:
    """Get remaining lockout time in seconds"""
    if not user.account_locked_until:
        return None
    
    remaining = user.account_locked_until - datetime.utcnow()
    if remaining.total_seconds() <= 0:
        return None
    
    return int(remaining.total_seconds()) 