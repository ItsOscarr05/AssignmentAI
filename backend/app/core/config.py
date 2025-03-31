from typing import List, Optional, Union, Any, Dict
from pydantic import AnyHttpUrl, EmailStr, validator, PostgresDsn
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
    BACKEND_URL: str = "http://localhost:8000"
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # Database
    DATABASE_URL: str = None
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "assignmentai")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None
    
    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_SPECIAL: bool = True
    PASSWORD_REQUIRE_NUMBERS: bool = True
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_TIMEOUT_MINUTES: int = 15
    
    # SSL/TLS settings
    SSL_ENABLED: bool = True
    SSL_KEYFILE: Optional[str] = None
    SSL_CERTFILE: Optional[str] = None
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # CORS Configuration
    CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000"]
    CORS_HEADERS: List[str] = ["*"]
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Email Configuration
    SMTP_USERNAME: EmailStr = "your-email@gmail.com"
    SMTP_PASSWORD: str = "your-app-specific-password"
    SMTP_FROM_EMAIL: EmailStr = "your-email@gmail.com"
    
    # AI settings
    AI_MODEL_VERSION: str = "1.0.0"
    AI_MAX_TOKENS: int = 2000
    AI_TEMPERATURE: float = 0.7
    AI_TOP_P: float = 0.9
    AI_FREQUENCY_PENALTY: float = 0.0
    AI_PRESENCE_PENALTY: float = 0.0
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60
    AI_RATE_LIMIT_REQUESTS: int = 10
    AI_RATE_LIMIT_PERIOD: int = 60
    
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
    
    # File upload settings
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: list = ["pdf", "doc", "docx", "txt"]
    
    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_SSL: bool = False
    REDIS_SSL_CERT_REQS: Optional[str] = None
    
    # OpenAI
    OPENAI_API_KEY: str = None
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 2000
    
    # Sentry Configuration
    SENTRY_DSN: Optional[str] = None
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0
    
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
    BACKUP_DIR: str = "backups"
    MAX_BACKUPS: int = 10
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_SCHEDULE: str = "0 0 * * *"  # Daily at midnight
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings() 