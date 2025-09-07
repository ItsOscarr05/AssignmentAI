from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_token
from app.database import SessionLocal, get_db
from app.models.user import User
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        print(f"🔐 AUTH: Token received: {token[:20]}..." if token else "🔐 AUTH: No token provided")
        
        # Check if this is a mock token (allow in both development and production for testing)
        if token == "mock-access-token-for-development":
            print("🔐 AUTH: Using mock token for development")
            try:
                # Create a mock user for development
                mock_user = User(
                    id=1,  # Use integer ID
                    email="dev@example.com",
                    name="Development User",
                    hashed_password="mock-password",  # Required field
                    is_active=True,
                    is_verified=True,
                    is_superuser=False
                )
                print(f"🔐 AUTH: Mock user created: {mock_user.email}")
                return mock_user
            except Exception as e:
                print(f"🔐 AUTH: Error creating mock user: {e}")
                raise
        
        payload = verify_token(token)
        if payload is None:
            print("🔐 AUTH: Token validation failed - invalid token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenPayload(**payload)
        print(f"🔐 AUTH: Token validated successfully for subject: {token_data.sub}")
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not getattr(current_user, 'is_superuser', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user 