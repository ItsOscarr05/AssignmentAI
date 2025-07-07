from pydantic_settings import BaseSettings
import os
from typing import Optional
from pydantic import ConfigDict

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AssignmentAI"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./app.db" if not os.getenv("ENVIRONMENT") == "production"
        else "postgresql://postgres:postgres@localhost/assignmentai"
    )
    
    # Email
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "test@example.com")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "test_password")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "test@example.com")
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.example.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # File Storage
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB
    
    # Testing
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"
    
    model_config = ConfigDict(case_sensitive=True)

settings = Settings() 