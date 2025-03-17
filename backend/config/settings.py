from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr, validator
from typing import List, Optional, Dict, Any
import os
from functools import lru_cache
import json
from pathlib import Path

class DatabaseSettings(BaseSettings):
    """Database configuration with validation"""
    host: str = Field(..., description="Database host")
    port: int = Field(5432, description="Database port")
    database: str = Field(..., description="Database name")
    user: str = Field(..., description="Database user")
    password: SecretStr = Field(..., description="Database password")
    pool_size: int = Field(20, ge=5, le=100, description="Connection pool size")
    max_overflow: int = Field(30, ge=5, le=100, description="Maximum pool overflow")
    pool_timeout: int = Field(30, ge=1, le=300, description="Pool timeout in seconds")
    pool_recycle: int = Field(1800, ge=300, le=7200, description="Connection recycle time in seconds")
    
    @property
    def async_url(self) -> str:
        """Get async database URL"""
        return f"postgresql+asyncpg://{self.user}:{self.password.get_secret_value()}@{self.host}:{self.port}/{self.database}"

class CacheSettings(BaseSettings):
    """Cache configuration with validation"""
    redis_host: str = Field(..., description="Redis host")
    redis_port: int = Field(6379, description="Redis port")
    redis_password: Optional[SecretStr] = Field(None, description="Redis password")
    redis_db: int = Field(0, ge=0, le=15, description="Redis database number")
    default_ttl: int = Field(3600, ge=60, le=86400, description="Default cache TTL in seconds")
    max_size: int = Field(1000, ge=100, le=10000, description="Maximum cache size")
    compression_threshold: int = Field(1024, ge=100, le=1048576, description="Compression threshold in bytes")

class SecuritySettings(BaseSettings):
    """Security configuration with validation"""
    secret_key: SecretStr = Field(..., min_length=32, description="JWT secret key")
    algorithm: str = Field("HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(30, ge=5, le=1440, description="Access token expiration in minutes")
    refresh_token_expire_days: int = Field(7, ge=1, le=30, description="Refresh token expiration in days")
    allowed_origins: List[str] = Field(default_factory=list, description="Allowed CORS origins")
    rate_limit_requests: int = Field(100, ge=10, le=1000, description="Rate limit requests per minute")
    rate_limit_burst: int = Field(50, ge=5, le=100, description="Rate limit burst size")

class MonitoringSettings(BaseSettings):
    """Monitoring configuration with validation"""
    log_level: str = Field("INFO", description="Logging level")
    metrics_port: int = Field(9090, ge=1024, le=65535, description="Prometheus metrics port")
    sentry_dsn: Optional[SecretStr] = Field(None, description="Sentry DSN")
    enable_tracing: bool = Field(True, description="Enable OpenTelemetry tracing")
    trace_sample_rate: float = Field(0.1, ge=0.0, le=1.0, description="Trace sampling rate")

class AISettings(BaseSettings):
    """AI service configuration with validation"""
    openai_api_key: SecretStr = Field(..., description="OpenAI API key")
    anthropic_api_key: SecretStr = Field(..., description="Anthropic API key")
    model_name: str = Field("gpt-4", description="Default AI model")
    max_tokens: int = Field(2000, ge=100, le=8000, description="Maximum tokens per request")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="AI temperature setting")
    request_timeout: int = Field(30, ge=5, le=120, description="Request timeout in seconds")

class Settings(BaseSettings):
    """Main application settings with validation"""
    # Environment
    environment: str = Field("development", description="Application environment")
    debug: bool = Field(False, description="Debug mode")
    version: str = Field("1.0.0", description="Application version")
    
    # Service configurations
    database: DatabaseSettings
    cache: CacheSettings
    security: SecuritySettings
    monitoring: MonitoringSettings
    ai: AISettings
    
    # Additional settings
    api_prefix: str = Field("/api", description="API prefix")
    docs_url: str = Field("/docs", description="Swagger docs URL")
    redoc_url: str = Field("/redoc", description="ReDoc URL")
    
    # Cache settings
    REDIS_URL: str = Field("redis://localhost:6379/0", description="Redis URL")
    REDIS_HOST: str = Field("localhost", description="Redis host")
    REDIS_PORT: int = Field(6379, description="Redis port")
    REDIS_PASSWORD: Optional[str] = Field(None, description="Redis password")
    REDIS_MAX_CONNECTIONS: int = Field(10, ge=1, le=100, description="Redis maximum connections")
    BINARY_REDIS_URL: str = Field("redis://localhost:6379/1", description="Binary Redis URL")
    CACHE_MAX_MEMORY_ITEMS: int = Field(10000, ge=100, le=100000, description="Redis maximum memory items")
    LOCAL_CACHE_SIZE: int = Field(1000, ge=100, le=10000, description="Local cache size")
    LOCAL_CACHE_TTL: int = Field(300, ge=60, le=1800, description="Local cache TTL in seconds")
    
    # Database
    DATABASE_URL: str = Field("postgresql+asyncpg://user:password@localhost:5432/assignmentai", description="Database URL")
    DB_MIN_CONNECTIONS: int = Field(5, ge=1, le=100, description="Database minimum connections")
    DB_MAX_CONNECTIONS: int = Field(20, ge=5, le=100, description="Database maximum connections")
    
    # Security
    SECRET_KEY: str = Field("your-secret-key", description="JWT secret key")
    ALGORITHM: str = Field("HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(30, ge=5, le=1440, description="Access token expiration in minutes")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(default_factory=list, description="Allowed CORS origins")
    
    # Monitoring
    METRICS_PORT: int = Field(9090, ge=1024, le=65535, description="Prometheus metrics port")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment setting"""
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v
    
    def get_secrets(self) -> Dict[str, str]:
        """Get all secret values for secrets management"""
        secrets = {}
        for field_name, field_value in self.model_fields.items():
            if isinstance(field_value, SecretStr):
                secrets[field_name] = field_value.get_secret_value()
        return secrets
    
    def save_secrets(self, secrets_path: str):
        """Save secrets to a file (for development only)"""
        if self.environment == "production":
            raise ValueError("Cannot save secrets in production environment")
        
        secrets = self.get_secrets()
        with open(secrets_path, "w") as f:
            json.dump(secrets, f, indent=2)
    
    def load_secrets(self, secrets_path: str):
        """Load secrets from a file (for development only)"""
        if self.environment == "production":
            raise ValueError("Cannot load secrets from file in production environment")
        
        if not Path(secrets_path).exists():
            return
        
        with open(secrets_path, "r") as f:
            secrets = json.load(f)
            for key, value in secrets.items():
                if hasattr(self, key):
                    setattr(self, key, SecretStr(value))

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Initialize settings
settings = get_settings() 