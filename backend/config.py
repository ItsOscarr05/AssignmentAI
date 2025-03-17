from typing import List, Dict, Any, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "AssignmentAI"
    VERSION: str = "2.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    REQUEST_TIMEOUT: int = 30
    
    # Database settings
    DATABASE_URL: str
    DB_POOL_MIN_SIZE: int = 10
    DB_POOL_MAX_SIZE: int = 100
    DB_COMMAND_TIMEOUT: int = 60
    READ_REPLICA_URLS: List[str] = []
    SHARD_URLS: Dict[str, str] = {}
    DB_MAX_RETRIES: int = 3
    DB_RETRY_DELAY: int = 1
    
    # Cache settings
    REDIS_URL: str
    CACHE_TTL: int = 3600
    CACHE_PREFIX: str = "assignmentai"
    MEMORY_CACHE_SIZE: int = 1000
    CACHE_WARM_INTERVAL: int = 1800
    CACHE_COHERENCY_CHECK_INTERVAL: int = 5
    CACHE_PREDICTION_THRESHOLD: float = 0.8
    
    # Security settings
    SECRET_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 30  # minutes
    API_KEY_EXPIRATION: int = 30  # days
    RATE_LIMIT_MAX_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # OAuth2.0 settings
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    OAUTH_CALLBACK_URL: str
    OAUTH_SUCCESS_URL: str
    OAUTH_ERROR_URL: str
    
    # Security threat detection
    THREAT_INTELLIGENCE_API: str
    MAX_FAILED_ATTEMPTS: int = 5
    BLOCK_DURATION: int = 3600  # seconds
    SUSPICIOUS_IP_THRESHOLD: int = 100
    SECURITY_EVENT_RETENTION_DAYS: int = 30
    
    # Monitoring settings
    TELEMETRY_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    METRICS_PORT: int = 9090
    TRACE_SAMPLE_RATE: float = 0.1
    HEALTH_CHECK_INTERVAL: int = 60
    MONITORING_API: str
    ALERT_WEBHOOK_URL: str
    PERFORMANCE_THRESHOLD_CPU: float = 80.0
    PERFORMANCE_THRESHOLD_MEMORY: float = 85.0
    
    # Resource management settings
    MIN_WORKERS: int = 1
    MAX_WORKERS: int = 10
    CPU_THRESHOLD_HIGH: float = 80.0
    CPU_THRESHOLD_LOW: float = 20.0
    MEMORY_THRESHOLD_HIGH: float = 85.0
    MEMORY_THRESHOLD_LOW: float = 30.0
    SCALING_COOLDOWN: int = 300  # seconds
    
    # Multi-region settings
    REGIONS: List[str] = ["us-east-1", "us-west-2", "eu-west-1"]
    DEFAULT_REGION: str = "us-east-1"
    REGION_WEIGHTS: Dict[str, float] = {
        "us-east-1": 1.0,
        "us-west-2": 0.8,
        "eu-west-1": 0.7
    }
    CROSS_REGION_LATENCY_THRESHOLD: float = 200.0  # ms
    
    # Cost optimization settings
    COST_OPTIMIZATION_ENABLED: bool = True
    DAILY_COST_BUDGET: float = 1000.0
    COST_ALERT_THRESHOLD: float = 0.8
    COST_OPTIMIZATION_INTERVAL: int = 300  # seconds
    INSTANCE_COST_PER_HOUR: Dict[str, float] = {
        "t3.micro": 0.0104,
        "t3.small": 0.0208,
        "t3.medium": 0.0416
    }
    
    # Task processing settings
    TASK_QUEUE_URL: str
    MAX_TASK_RETRIES: int = 3
    TASK_TIMEOUT: int = 300
    BATCH_SIZE: int = 100
    TASK_PRIORITY_LEVELS: Dict[str, int] = {
        "high": 1,
        "medium": 2,
        "low": 3
    }
    
    # Storage settings
    STORAGE_BACKEND: str = "s3"  # or "local"
    S3_BUCKET: Optional[str] = None
    S3_PREFIX: str = "assignments"
    LOCAL_STORAGE_PATH: Path = Path("storage")
    
    # Machine learning settings
    ML_MODEL_UPDATE_INTERVAL: int = 3600  # seconds
    ML_MIN_TRAINING_SAMPLES: int = 1000
    ML_PREDICTION_HORIZON: int = 24  # hours
    ML_FEATURE_COLUMNS: List[str] = [
        "cpu_percent",
        "memory_percent",
        "disk_usage_percent"
    ]
    
    # API settings
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"
    DOCS_URL: str = "/api/docs"
    REDOC_URL: str = "/api/redoc"
    
    # External service URLs
    DEPLOYMENT_API: str
    WORKER_API: str
    MONITORING_API: str
    
    # Feature flags
    ENABLE_GRAPHQL: bool = False
    ENABLE_WEBSOCKETS: bool = False
    ENABLE_GRPC: bool = False
    ENABLE_COST_OPTIMIZATION: bool = True
    ENABLE_ML_PREDICTIONS: bool = True
    ENABLE_THREAT_DETECTION: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def database_config(self) -> Dict[str, Any]:
        """Get database configuration"""
        return {
            "min_size": self.DB_POOL_MIN_SIZE,
            "max_size": self.DB_POOL_MAX_SIZE,
            "command_timeout": self.DB_COMMAND_TIMEOUT,
            "read_replicas": self.READ_REPLICA_URLS,
            "shards": self.SHARD_URLS,
            "max_retries": self.DB_MAX_RETRIES,
            "retry_delay": self.DB_RETRY_DELAY
        }

    @property
    def cache_config(self) -> Dict[str, Any]:
        """Get cache configuration"""
        return {
            "ttl": self.CACHE_TTL,
            "prefix": self.CACHE_PREFIX,
            "memory_size": self.MEMORY_CACHE_SIZE,
            "warm_interval": self.CACHE_WARM_INTERVAL,
            "coherency_interval": self.CACHE_COHERENCY_CHECK_INTERVAL,
            "prediction_threshold": self.CACHE_PREDICTION_THRESHOLD
        }

    @property
    def security_config(self) -> Dict[str, Any]:
        """Get security configuration"""
        return {
            "jwt_secret": self.JWT_SECRET,
            "jwt_algorithm": self.JWT_ALGORITHM,
            "jwt_expiration": self.JWT_EXPIRATION,
            "api_key_expiration": self.API_KEY_EXPIRATION,
            "rate_limit": {
                "max_requests": self.RATE_LIMIT_MAX_REQUESTS,
                "window": self.RATE_LIMIT_WINDOW
            },
            "oauth": {
                "google": {
                    "client_id": self.GOOGLE_CLIENT_ID,
                    "client_secret": self.GOOGLE_CLIENT_SECRET
                },
                "github": {
                    "client_id": self.GITHUB_CLIENT_ID,
                    "client_secret": self.GITHUB_CLIENT_SECRET
                },
                "callback_url": self.OAUTH_CALLBACK_URL
            },
            "threat_detection": {
                "max_failed_attempts": self.MAX_FAILED_ATTEMPTS,
                "block_duration": self.BLOCK_DURATION,
                "suspicious_threshold": self.SUSPICIOUS_IP_THRESHOLD
            }
        }

    @property
    def monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring configuration"""
        return {
            "enabled": self.TELEMETRY_ENABLED,
            "log_level": self.LOG_LEVEL,
            "metrics_port": self.METRICS_PORT,
            "trace_sample_rate": self.TRACE_SAMPLE_RATE,
            "health_check_interval": self.HEALTH_CHECK_INTERVAL,
            "alert_webhook": self.ALERT_WEBHOOK_URL,
            "thresholds": {
                "cpu": self.PERFORMANCE_THRESHOLD_CPU,
                "memory": self.PERFORMANCE_THRESHOLD_MEMORY
            }
        }

    @property
    def resource_config(self) -> Dict[str, Any]:
        """Get resource management configuration"""
        return {
            "workers": {
                "min": self.MIN_WORKERS,
                "max": self.MAX_WORKERS
            },
            "thresholds": {
                "cpu": {
                    "high": self.CPU_THRESHOLD_HIGH,
                    "low": self.CPU_THRESHOLD_LOW
                },
                "memory": {
                    "high": self.MEMORY_THRESHOLD_HIGH,
                    "low": self.MEMORY_THRESHOLD_LOW
                }
            },
            "scaling_cooldown": self.SCALING_COOLDOWN,
            "regions": {
                "list": self.REGIONS,
                "default": self.DEFAULT_REGION,
                "weights": self.REGION_WEIGHTS,
                "latency_threshold": self.CROSS_REGION_LATENCY_THRESHOLD
            }
        }

    @property
    def cost_config(self) -> Dict[str, Any]:
        """Get cost optimization configuration"""
        return {
            "enabled": self.COST_OPTIMIZATION_ENABLED,
            "daily_budget": self.DAILY_COST_BUDGET,
            "alert_threshold": self.COST_ALERT_THRESHOLD,
            "check_interval": self.COST_OPTIMIZATION_INTERVAL,
            "instance_costs": self.INSTANCE_COST_PER_HOUR
        }

    @property
    def ml_config(self) -> Dict[str, Any]:
        """Get machine learning configuration"""
        return {
            "update_interval": self.ML_MODEL_UPDATE_INTERVAL,
            "min_samples": self.ML_MIN_TRAINING_SAMPLES,
            "prediction_horizon": self.ML_PREDICTION_HORIZON,
            "feature_columns": self.ML_FEATURE_COLUMNS
        }

    @property
    def storage_config(self) -> Dict[str, Any]:
        """Get storage configuration"""
        return {
            "backend": self.STORAGE_BACKEND,
            "s3": {
                "bucket": self.S3_BUCKET,
                "prefix": self.S3_PREFIX
            },
            "local": {
                "path": str(self.LOCAL_STORAGE_PATH)
            }
        }

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

# Global settings instance
settings = get_settings()