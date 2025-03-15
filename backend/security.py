"""
Security module for AssignmentAI.
"""

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, List, Union
from pydantic import BaseModel
from config import settings
import logging
import secrets
import base64
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

def create_encryption_key() -> str:
    """Generate a secure random key for encryption."""
    return base64.b64encode(secrets.token_bytes(32)).decode()

def encrypt_data(data: Union[str, bytes], key: str) -> str:
    """
    Encrypt data using Fernet symmetric encryption.
    
    Args:
        data: The data to encrypt (string or bytes)
        key: Base64-encoded 32-byte key
    
    Returns:
        str: Base64-encoded encrypted data
    """
    if isinstance(data, str):
        data = data.encode()
    
    # Ensure the key is properly formatted for Fernet
    if len(base64.b64decode(key)) != 32:
        raise ValueError("Invalid key length. Must be 32 bytes when decoded.")
    
    f = Fernet(key.encode())
    encrypted = f.encrypt(data)
    return base64.b64encode(encrypted).decode()

def decrypt_data(encrypted_data: Union[str, bytes], key: str) -> str:
    """
    Decrypt data using Fernet symmetric encryption.
    
    Args:
        encrypted_data: The encrypted data (base64-encoded string or bytes)
        key: Base64-encoded 32-byte key
    
    Returns:
        str: Decrypted data as string
    """
    if isinstance(encrypted_data, str):
        encrypted_data = base64.b64decode(encrypted_data)
    
    # Ensure the key is properly formatted for Fernet
    if len(base64.b64decode(key)) != 32:
        raise ValueError("Invalid key length. Must be 32 bytes when decoded.")
    
    f = Fernet(key.encode())
    decrypted = f.decrypt(encrypted_data)
    return decrypted.decode()

class SecurityConfig(BaseModel):
    """Security configuration settings."""
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    password_min_length: int = 8
    max_login_attempts: int = 5
    lockout_duration_minutes: int = 30

class SecurityManager:
    """Manages security operations and authentication."""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self._failed_attempts = {}
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash."""
        if len(password) < self.config.password_min_length:
            raise ValueError(f"Password must be at least {self.config.password_min_length} characters long")
        return self.pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a new JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.config.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.config.secret_key, algorithm=self.config.algorithm)
    
    def create_refresh_token(self, data: dict) -> str:
        """Create a new JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.config.refresh_token_expire_days)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.config.secret_key, algorithm=self.config.algorithm)
    
    def decode_token(self, token: str) -> dict:
        """Decode and verify a JWT token."""
        try:
            payload = jwt.decode(token, self.config.secret_key, algorithms=[self.config.algorithm])
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def record_failed_attempt(self, username: str):
        """Record a failed login attempt."""
        if username not in self._failed_attempts:
            self._failed_attempts[username] = []
        self._failed_attempts[username].append(datetime.utcnow())
        self._cleanup_failed_attempts(username)
    
    def is_account_locked(self, username: str) -> bool:
        """Check if an account is locked due to too many failed attempts."""
        if username not in self._failed_attempts:
            return False
        
        self._cleanup_failed_attempts(username)
        return len(self._failed_attempts[username]) >= self.config.max_login_attempts
    
    def _cleanup_failed_attempts(self, username: str):
        """Clean up old failed attempts."""
        if username not in self._failed_attempts:
            return
            
        cutoff = datetime.utcnow() - timedelta(minutes=self.config.lockout_duration_minutes)
        self._failed_attempts[username] = [
            attempt for attempt in self._failed_attempts[username]
            if attempt > cutoff
        ]
        if not self._failed_attempts[username]:
            del self._failed_attempts[username]

# Initialize security configuration
security_config = SecurityConfig(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
)

# Initialize security manager
security_manager = SecurityManager(security_config)

# Use the security manager's methods for the existing functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return security_manager.verify_password(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return security_manager.get_password_hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    return security_manager.create_access_token(data, expires_delta)

# Security configurations
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    scopes: List[str] = []

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    roles: List[str] = []

class UserInDB(User):
    hashed_password: str

# Security utilities
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, scopes=payload.get("scopes", []))
    except JWTError:
        raise credentials_exception
    
    # TODO: Replace with actual database lookup
    user = get_user(username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Role-based access control
def has_required_scope(required_scope: str, token: str = Depends(oauth2_scheme)) -> bool:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_scopes = payload.get("scopes", [])
        return required_scope in token_scopes
    except JWTError:
        return False

def check_permissions(required_roles: List[str]):
    async def role_checker(current_user: User = Depends(get_current_active_user)):
        if not any(role in current_user.roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have the required permissions"
            )
        return current_user
    return role_checker

# Security headers middleware
async def security_headers_middleware(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# Mock user database - Replace with actual database implementation
def get_user(username: str) -> Optional[UserInDB]:
    # TODO: Replace with actual database lookup
    if username == "admin":
        return UserInDB(
            username="admin",
            email="admin@example.com",
            full_name="Admin User",
            disabled=False,
            roles=["admin"],
            hashed_password=get_password_hash("admin")
        )
    return None

# Authentication utilities
async def authenticate_user(username: str, password: str) -> Optional[User]:
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user 