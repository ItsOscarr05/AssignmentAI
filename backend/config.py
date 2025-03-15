from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional, List
import secrets

class Settings(BaseSettings):
    # Server settings
    PORT: str = Field(default="5000")
    NODE_ENV: str = Field(default="development")
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    API_WORKERS: int = Field(default=4)
    
    # Application settings
    APP_NAME: str = Field(default="AssignmentAI")
    APP_VERSION: str = Field(default="1.0.0")
    DEBUG: bool = Field(default=True)
    API_PREFIX: str = Field(default="/api/v1")
    
    # Security settings
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = Field(default="HS256")
    ALGORITHM: str = Field(default="HS256")  # Legacy support
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)  # Legacy support
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    JWT_SECRET: str = Field(default="your_jwt_secret_key")
    JWT_REFRESH_SECRET: str = Field(default="your_jwt_refresh_secret_key")
    JWT_EXPIRES_IN: str = Field(default="1h")
    JWT_REFRESH_EXPIRES_IN: str = Field(default="7d")
    PASSWORD_MIN_LENGTH: int = Field(default=8)
    MAX_LOGIN_ATTEMPTS: int = Field(default=5)
    LOCKOUT_DURATION_MINUTES: int = Field(default=30)
    CORS_ORIGINS: List[str] = Field(default=["*"])
    ALLOWED_ORIGINS: List[str] = Field(default=["http://localhost:3000"])  # Legacy support
    CORS_CREDENTIALS: bool = Field(default=True)
    
    # Rate limiting
    RATE_LIMIT_MAX_REQUESTS: int = Field(default=100)
    RATE_LIMIT_WINDOW: int = Field(default=60)
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=3600)  # 1 hour
    
    # Database settings
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./assignmentai.db")
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=5432)
    DB_USER: str = Field(default="postgres")
    DB_PASSWORD: str = Field(default="postgres")
    DB_NAME: str = Field(default="assignmentai")
    DB_POOL_SIZE: int = Field(default=5)
    DB_MAX_OVERFLOW: int = Field(default=10)
    DB_POOL_TIMEOUT: int = Field(default=30)
    DB_ECHO_SQL: bool = Field(default=False)
    
    # Cache settings
    REDIS_URL: Optional[str] = Field(default=None)
    REDIS_HOST: str = Field(default="localhost")
    REDIS_PORT: int = Field(default=6379)
    REDIS_PASSWORD: Optional[str] = Field(default=None)
    CACHE_TTL_SECONDS: int = Field(default=3600)
    
    # File storage settings
    UPLOAD_DIR: str = Field(default="uploads")
    MAX_UPLOAD_SIZE: int = Field(default=10 * 1024 * 1024)  # 10MB
    MAX_FILE_SIZE: int = Field(default=5 * 1024 * 1024)  # 5MB
    ALLOWED_EXTENSIONS: List[str] = Field(default=["pdf", "doc", "docx", "txt"])
    
    # Logging settings
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    LOG_FILE: Optional[str] = Field(default="app.log")
    
    # Email settings
    SMTP_HOST: Optional[str] = Field(default=None)
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: Optional[str] = Field(default=None)
    SMTP_PASSWORD: Optional[str] = Field(default=None)
    EMAIL_FROM: Optional[str] = Field(default=None)
    
    # AI Model Settings
    MODEL_CACHE_SIZE: int = Field(default=1024 * 1024 * 1024)  # 1GB
    MODEL_TIMEOUT: int = Field(default=30)  # seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

def get_settings() -> Settings:
    return Settings()

settings = get_settings()