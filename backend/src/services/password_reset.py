from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.src.models.user import User
from backend.src.services.auth import get_password_hash
import pyotp
import redis
import os
from dotenv import load_dotenv

load_dotenv()

# Redis configuration
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

# Password reset token configuration
RESET_TOKEN_EXPIRE_MINUTES = 30
TOTP_SECRET = os.getenv("TOTP_SECRET", "your-totp-secret-here")

def generate_reset_token(email: str) -> str:
    """Generate a time-based one-time password for password reset"""
    totp = pyotp.TOTP(TOTP_SECRET)
    token = totp.now()
    
    # Store token in Redis with expiration
    redis_client.setex(
        f"password_reset:{email}",
        timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
        token
    )
    
    return token

def verify_reset_token(email: str, token: str) -> bool:
    """Verify the password reset token"""
    stored_token = redis_client.get(f"password_reset:{email}")
    if not stored_token:
        return False
    
    return stored_token == token

def reset_password(db: Session, email: str, token: str, new_password: str) -> User:
    """Reset user's password after token verification"""
    # Verify token
    if not verify_reset_token(email, token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Get user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    
    # Delete used token
    redis_client.delete(f"password_reset:{email}")
    
    return user 