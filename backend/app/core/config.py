from typing import List, Optional, Union, Any, Dict
from pydantic import AnyHttpUrl, EmailStr, validator, PostgresDsn, field_validator, ConfigDict
from pydantic_settings import BaseSettings
import os
import secrets
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AssignmentAI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DESCRIPTION: str = "AI-powered educational platform for teachers and students"
    
    # Server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000
    DEBUG: bool = False
    BACKEND_URL: str = os.getenv("BACKEND_URL", "https://api.assignmentai.com")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")  # development, staging, production
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_FREE: str = os.getenv("STRIPE_PRICE_FREE", "price_free")
    STRIPE_PRICE_PLUS: str = os.getenv("STRIPE_PRICE_PLUS", "price_plus")
    STRIPE_PRICE_PRO: str = os.getenv("STRIPE_PRICE_PRO", "price_pro")
    STRIPE_PRICE_MAX: str = os.getenv("STRIPE_PRICE_MAX", "price_max")
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_NAME: str = "assignmentai"
    SQLALCHEMY_DATABASE_URI: str = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Override database URI for testing
    @property
    def database_uri(self) -> str:
        if os.getenv("TESTING") == "true":
            return "sqlite:///./test.db"
        # Check for DATABASE_URL environment variable first
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            return database_url
        # For development without DATABASE_URL, use SQLite
        if not database_url and os.getenv("ENVIRONMENT", "development") == "development":
            return "sqlite:///./assignmentai.db"
        # Use environment variables if available, otherwise use defaults
        db_host = os.getenv("DB_HOST", self.DB_HOST)
        db_port = os.getenv("DB_PORT", str(self.DB_PORT))
        db_user = os.getenv("DB_USER", self.DB_USER)
        db_password = os.getenv("DB_PASSWORD", self.DB_PASSWORD)
        db_name = os.getenv("DB_NAME", self.DB_NAME)
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    SSL_ENABLED: bool = True
    SSL_CERTFILE: Optional[str] = None
    SSL_KEYFILE: Optional[str] = None
    BACKUP_DIR: str = "backups"
    
    # Email Settings
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@assignmentai.com"
    SMTP_FROM_NAME: str = "AssignmentAI"
    SMTP_STARTTLS: bool = True
    SMTP_SSL_ENABLED: bool = True
    SMTP_SSL_CERTFILE: Optional[str] = None
    SMTP_SSL_KEYFILE: Optional[str] = None
    EMAIL_TOKEN_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1
    
    # File Upload Settings
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB (for middleware compatibility)
    UPLOAD_DIR: str = "uploads"
    ALLOWED_FILE_TYPES: List[str] = [
        # Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        # Spreadsheets
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        # Presentations
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        # Images
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        # Code files
        "text/plain",
        "text/x-python",
        "text/javascript",
        "text/html",
        "text/css",
        # Archives
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
        # Audio
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        # Video
        "video/mp4",
        "video/webm",
        "video/ogg",
        # Other
        "application/json",
        "text/csv",
        "application/xml"
    ]
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Password Security
    PASSWORD_MIN_LENGTH: int = int(os.getenv("PASSWORD_MIN_LENGTH", "12"))
    PASSWORD_REQUIRE_SPECIAL_CHARS: bool = os.getenv("PASSWORD_REQUIRE_SPECIAL_CHARS", "true").lower() == "true"
    PASSWORD_REQUIRE_NUMBERS: bool = os.getenv("PASSWORD_REQUIRE_NUMBERS", "true").lower() == "true"
    PASSWORD_REQUIRE_UPPERCASE: bool = os.getenv("PASSWORD_REQUIRE_UPPERCASE", "true").lower() == "true"
    PASSWORD_REQUIRE_LOWERCASE: bool = os.getenv("PASSWORD_REQUIRE_LOWERCASE", "true").lower() == "true"
    PASSWORD_HISTORY_SIZE: int = int(os.getenv("PASSWORD_HISTORY_SIZE", "5"))  # Number of previous passwords to remember
    PASSWORD_REUSE_DAYS: int = int(os.getenv("PASSWORD_REUSE_DAYS", "365"))  # Days before a password can be reused
    HAVEIBEENPWNED_API_KEY: str = os.getenv("HAVEIBEENPWNED_API_KEY", "")  # API key for HaveIBeenPwned service
    
    # Authentication Security
    MAX_LOGIN_ATTEMPTS: int = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
    LOGIN_TIMEOUT_MINUTES: int = int(os.getenv("LOGIN_TIMEOUT_MINUTES", "15"))
    SESSION_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_TIMEOUT_MINUTES", "30"))
    ENABLE_2FA: bool = os.getenv("ENABLE_2FA", "false").lower() == "true"
    ENABLE_EMAIL_VERIFICATION: bool = os.getenv("ENABLE_EMAIL_VERIFICATION", "true").lower() == "true"
    REQUIRE_EMAIL_VERIFICATION: bool = os.getenv("REQUIRE_EMAIL_VERIFICATION", "false").lower() == "true"
    
    # Session Management Settings
    SESSION_EXPIRE_DAYS: int = int(os.getenv("SESSION_EXPIRE_DAYS", "30"))
    SESSION_CLEANUP_INTERVAL_HOURS: int = int(os.getenv("SESSION_CLEANUP_INTERVAL_HOURS", "24"))
    MAX_CONCURRENT_SESSIONS: int = int(os.getenv("MAX_CONCURRENT_SESSIONS", "10"))
    SESSION_ACTIVITY_TIMEOUT_MINUTES: int = int(os.getenv("SESSION_ACTIVITY_TIMEOUT_MINUTES", "30"))
    ENABLE_PASSWORD_RESET: bool = os.getenv("ENABLE_PASSWORD_RESET", "true").lower() == "true"
    ENABLE_SOCIAL_LOGIN: bool = os.getenv("ENABLE_SOCIAL_LOGIN", "false").lower() == "true"
    
    # SSL/TLS settings (duplicate removed)
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://assignmentai.com")
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "https://assignmentai.com",
        "https://www.assignmentai.com",
        "http://localhost:3000"  # Keep localhost for development
    ]
    CORS_HEADERS: List[str] = [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ]
    CORS_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_EXPOSE_HEADERS: List[str] = [
        "Content-Range",
        "X-Content-Range",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset"
    ]
    CORS_MAX_AGE: int = 86400  # 24 hours
    CORS_CREDENTIALS: bool = True
    CORS_PREFLIGHT_MAX_AGE: int = 86400  # 24 hours
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Email Configuration (duplicate removed)
    
    # OAuth Provider Settings
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID: Optional[str] = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: Optional[str] = os.getenv("GITHUB_CLIENT_SECRET")
    FACEBOOK_CLIENT_ID: Optional[str] = os.getenv("FACEBOOK_CLIENT_ID")
    FACEBOOK_CLIENT_SECRET: Optional[str] = os.getenv("FACEBOOK_CLIENT_SECRET")
    APPLE_CLIENT_ID: Optional[str] = os.getenv("APPLE_CLIENT_ID")
    APPLE_CLIENT_SECRET: Optional[str] = os.getenv("APPLE_CLIENT_SECRET")
    
    # AI settings
    AI_MODEL_VERSION: str = "1.0.0"
    AI_MAX_TOKENS: int = 2000
    AI_TEMPERATURE: float = 0.7
    AI_TOP_P: float = 0.9
    AI_FREQUENCY_PENALTY: float = 0.0
    AI_PRESENCE_PENALTY: float = 0.0
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100  # requests per minute
    RATE_LIMIT_PERIOD: int = 1  # minutes
    AUTH_RATE_LIMIT_REQUESTS: int = int(os.getenv("AUTH_RATE_LIMIT_REQUESTS", "5"))
    AUTH_RATE_LIMIT_PERIOD: int = int(os.getenv("AUTH_RATE_LIMIT_PERIOD", "60"))
    # Login security (duplicate removed)
    MAX_2FA_ATTEMPTS: int = 3  # maximum 2FA attempts before backoff
    INITIAL_2FA_BACKOFF_MINUTES: int = 1  # initial backoff period in minutes
    MAX_2FA_BACKOFF_MINUTES: int = 16  # maximum backoff period in minutes
    
    # Cache settings
    CACHE_TTL: int = 3600  # 1 hour
    AI_CACHE_TTL: int = 3600  # 1 hour
    CACHE_ENABLED: bool = True
    QUERY_OPTIMIZATION_ENABLED: bool = True
    SLOW_QUERY_THRESHOLD: float = 1.0  # seconds
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800  # 30 minutes
    DB_POOL_PRE_PING: bool = True
    SQL_DEBUG: bool = False
    
    # File upload settings (duplicate removed)
    ALLOWED_EXTENSIONS: set = {
        "pdf", "doc", "docx", "txt", "rtf", "odt",
        "jpg", "jpeg", "png", "gif",
        "zip", "rar", "7z",
        "mp3", "mp4", "wav", "avi",
        "py", "java", "cpp", "c", "js", "html", "css"
    }
    
    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_SSL: bool = False
    REDIS_SSL_CERT_REQS: Optional[str] = None
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4.1-nano"  # Default model (overridden by subscription)
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 2000
    
    # Monitoring Settings
    METRICS_PORT: int = 9090
    PROMETHEUS_MULTIPROC_DIR: str = "/tmp"
    ENABLE_METRICS: bool = True
    
    # Logging Settings
    LOGS_DIR: str = "logs"
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE_MAX_BYTES: int = 10 * 1024 * 1024  # 10MB
    LOG_FILE_BACKUP_COUNT: int = 5
    
    # Alerting Settings
    ALERT_EMAIL: Optional[str] = None
    ALERT_SLACK_WEBHOOK: Optional[str] = None
    ALERT_THRESHOLDS: Dict[str, float] = {
        "cpu_usage": 80.0,  # CPU usage percentage
        "memory_usage": 85.0,  # Memory usage percentage
        "disk_usage": 90.0,  # Disk usage percentage
        "error_rate": 5.0,  # Error rate percentage
        "response_time": 2.0,  # Response time in seconds
    }
    
    # Backup Settings
    MAX_BACKUPS: int = 10
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_SCHEDULE: str = "0 0 * * *"  # Daily at midnight
    

    
    # CORS Security (using CORS_ORIGINS instead)
    
    # Session Management
    MAX_CONCURRENT_SESSIONS: int = int(os.getenv("MAX_CONCURRENT_SESSIONS", "5"))  # Maximum number of concurrent sessions per user
    REMEMBER_ME_DAYS: int = int(os.getenv("REMEMBER_ME_DAYS", "30"))  # Remember me duration in days
    
    # Audit Logging
    AUDIT_LOG_ENABLED: bool = os.getenv("AUDIT_LOG_ENABLED", "true").lower() == "true"
    AUDIT_LOG_RETENTION_DAYS: int = int(os.getenv("AUDIT_LOG_RETENTION_DAYS", "90"))  # Days to keep audit logs
    AUDIT_LOG_ROTATION_SIZE: int = int(os.getenv("AUDIT_LOG_ROTATION_SIZE", "100"))  # MB before rotating audit logs
    
    # Security Headers
    SECURITY_HEADERS: Dict[str, str] = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-site"
    }
    
    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Rate Limiting Settings
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    model_config = ConfigDict(
        env_file=".env",
        extra="allow"
    )

settings = Settings() 