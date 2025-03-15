import logging
from typing import Dict, List, Any, Set, Optional
from pathlib import Path
import json
import yaml
import re
import os
import datetime
import psutil
import socket
import ssl
from urllib.parse import urlparse
from .settings import settings
from .secrets import secrets_manager

logger = logging.getLogger(__name__)

class ConfigValidationError(Exception):
    """Custom exception for configuration validation errors"""
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(message)

class ConfigValidator:
    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self._environment_limits = {
            "development": {
                "rate_limit_requests": (10, 100),
                "pool_size": (5, 20),
                "max_overflow": (5, 30),
                "default_ttl": (60, 3600)
            },
            "staging": {
                "rate_limit_requests": (50, 500),
                "pool_size": (10, 50),
                "max_overflow": (10, 50),
                "default_ttl": (300, 7200)
            },
            "production": {
                "rate_limit_requests": (100, 1000),
                "pool_size": (20, 100),
                "max_overflow": (20, 100),
                "default_ttl": (600, 86400)
            }
        }
        
        # Performance thresholds
        self._performance_thresholds = {
            "min_cpu_count": 2,
            "min_memory_gb": 4,
            "min_disk_gb": 10,
            "max_latency_ms": 100
        }
    
    def validate_all(self) -> bool:
        """Run all validation checks"""
        checks = [
            self.validate_environment,
            self.validate_secrets,
            self.validate_paths,
            self.validate_connections,
            self.validate_permissions,
            self.validate_conflicts,
            self.validate_urls,
            self.validate_cryptography,
            self.validate_environment_limits,
            self.validate_resources,
            self.validate_environment_variables,
            self.validate_performance,
            self.validate_security
        ]
        
        for check in checks:
            try:
                check()
            except ConfigValidationError as e:
                self.errors.append(f"Validation failed for {e.field or 'unknown'}: {e.message}")
            except Exception as e:
                self.errors.append(f"Unexpected validation error: {str(e)}")
                logger.exception("Unexpected validation error")
        
        return len(self.errors) == 0
    
    def validate_environment(self):
        """Validate environment configuration"""
        # Check environment variables
        required_vars = {
            'DATABASE_URL',
            'REDIS_URL',
            'JWT_SECRET_KEY',
            'OPENAI_API_KEY'
        }
        
        missing_vars = required_vars - set(settings.model_fields.keys())
        if missing_vars:
            raise ConfigValidationError(f"Missing required environment variables: {missing_vars}")
        
        # Validate environment-specific settings
        if settings.environment == "production":
            if settings.debug:
                self.warnings.append("Debug mode is enabled in production")
            
            if not settings.allowed_origins:
                raise ConfigValidationError("No allowed origins configured for production")
            
            if not settings.monitoring.sentry_dsn:
                self.warnings.append("Sentry DSN not configured in production")
    
    def validate_secrets(self):
        """Validate secrets configuration"""
        try:
            # Check AWS Secrets Manager access
            secrets = secrets_manager.get_secret()
            
            # Validate required secrets
            required_secrets = {
                'database_password',
                'jwt_secret_key',
                'openai_api_key',
                'anthropic_api_key'
            }
            
            missing_secrets = required_secrets - set(secrets.keys())
            if missing_secrets:
                raise ConfigValidationError(f"Missing required secrets: {missing_secrets}")
            
            # Validate secret formats and strengths
            for key, value in secrets.items():
                if key.endswith('_key'):
                    if len(value) < 32:
                        self.warnings.append(f"Secret {key} may be too short (minimum 32 characters)")
                    if not re.search(r'[A-Z]', value):
                        self.warnings.append(f"Secret {key} should contain uppercase letters")
                    if not re.search(r'[a-z]', value):
                        self.warnings.append(f"Secret {key} should contain lowercase letters")
                    if not re.search(r'[0-9]', value):
                        self.warnings.append(f"Secret {key} should contain numbers")
                    if not re.search(r'[^A-Za-z0-9]', value):
                        self.warnings.append(f"Secret {key} should contain special characters")
                
        except Exception as e:
            raise ConfigValidationError(f"Failed to validate secrets: {str(e)}")
    
    def validate_paths(self):
        """Validate file paths and permissions"""
        required_paths = [
            Path("logs"),
            Path("data"),
            Path("temp"),
            Path("config")
        ]
        
        for path in required_paths:
            if not path.exists():
                try:
                    path.mkdir(parents=True, exist_ok=True)
                except Exception as e:
                    raise ConfigValidationError(f"Failed to create required path {path}: {str(e)}")
            
            if not os.access(path, os.W_OK):
                raise ConfigValidationError(f"No write permission for path {path}")
            
            # Check for proper ownership in production
            if settings.environment == "production":
                try:
                    stat = path.stat()
                    if stat.st_uid == 0:  # root user
                        self.warnings.append(f"Path {path} is owned by root user")
                except Exception as e:
                    logger.warning(f"Could not check ownership of {path}: {str(e)}")
    
    def validate_connections(self):
        """Validate database and cache connections"""
        # Database connection check
        try:
            from database import check_database_health
            if not check_database_health():
                raise ConfigValidationError("Database connection failed")
        except Exception as e:
            raise ConfigValidationError(f"Database connection check failed: {str(e)}")
        
        # Redis connection check
        try:
            from cache import check_cache_health
            if not check_cache_health():
                raise ConfigValidationError("Cache connection failed")
        except Exception as e:
            raise ConfigValidationError(f"Cache connection check failed: {str(e)}")
    
    def validate_permissions(self):
        """Validate file and directory permissions"""
        sensitive_files = [
            Path(".env"),
            Path("secrets.json"),
            Path("config/secrets.yaml")
        ]
        
        for file in sensitive_files:
            if file.exists():
                if file.stat().st_mode & 0o777 > 0o600:
                    raise ConfigValidationError(f"Sensitive file {file} has too permissive permissions")
                
                # Check for proper ownership in production
                if settings.environment == "production":
                    try:
                        stat = file.stat()
                        if stat.st_uid == 0:  # root user
                            self.warnings.append(f"Sensitive file {file} is owned by root user")
                    except Exception as e:
                        logger.warning(f"Could not check ownership of {file}: {str(e)}")
    
    def validate_conflicts(self):
        """Validate for conflicting settings"""
        # Check for conflicting rate limits
        if settings.security.rate_limit_burst > settings.security.rate_limit_requests:
            raise ConfigValidationError(
                "Rate limit burst size cannot be greater than rate limit requests",
                "security.rate_limit_burst"
            )
        
        # Check for conflicting pool settings
        if settings.database.max_overflow < settings.database.pool_size:
            raise ConfigValidationError(
                "Max overflow cannot be less than pool size",
                "database.max_overflow"
            )
        
        # Check for conflicting cache settings
        if settings.cache.compression_threshold > settings.cache.max_size * 1024:
            raise ConfigValidationError(
                "Compression threshold cannot be greater than max size",
                "cache.compression_threshold"
            )
    
    def validate_urls(self):
        """Validate URL formats and security"""
        # Validate allowed origins
        for origin in settings.security.allowed_origins:
            try:
                parsed = urlparse(origin)
                if not parsed.scheme in ('http', 'https'):
                    raise ConfigValidationError(
                        f"Invalid URL scheme in allowed origin: {origin}",
                        "security.allowed_origins"
                    )
                if not parsed.netloc:
                    raise ConfigValidationError(
                        f"Invalid URL format in allowed origin: {origin}",
                        "security.allowed_origins"
                    )
            except Exception as e:
                raise ConfigValidationError(
                    f"Invalid URL in allowed origins: {origin}",
                    "security.allowed_origins"
                )
        
        # Validate database URL
        try:
            parsed = urlparse(settings.database.async_url)
            if not parsed.scheme.startswith('postgresql'):
                raise ConfigValidationError(
                    "Invalid database URL scheme",
                    "database.async_url"
                )
        except Exception as e:
            raise ConfigValidationError(
                f"Invalid database URL: {str(e)}",
                "database.async_url"
            )
    
    def validate_cryptography(self):
        """Validate cryptographic settings"""
        # Check JWT settings
        if len(settings.security.secret_key.get_secret_value()) < 32:
            raise ConfigValidationError(
                "JWT secret key must be at least 32 characters long",
                "security.secret_key"
            )
        
        if settings.security.algorithm not in ('HS256', 'HS384', 'HS512'):
            raise ConfigValidationError(
                "Unsupported JWT algorithm",
                "security.algorithm"
            )
        
        # Check token expiration times
        if settings.security.access_token_expire_minutes < 5:
            raise ConfigValidationError(
                "Access token expiration time too short",
                "security.access_token_expire_minutes"
            )
        
        if settings.security.refresh_token_expire_days < 1:
            raise ConfigValidationError(
                "Refresh token expiration time too short",
                "security.refresh_token_expire_days"
            )
    
    def validate_environment_limits(self):
        """Validate environment-specific limits"""
        env_limits = self._environment_limits.get(settings.environment, {})
        
        for setting, (min_val, max_val) in env_limits.items():
            current_val = getattr(settings, setting, None)
            if current_val is not None:
                if not min_val <= current_val <= max_val:
                    raise ConfigValidationError(
                        f"Value {current_val} for {setting} is outside allowed range [{min_val}, {max_val}] for {settings.environment} environment",
                        setting
                    )
    
    def validate_resources(self):
        """Validate system resources"""
        # Check CPU
        cpu_count = psutil.cpu_count()
        if cpu_count < self._performance_thresholds["min_cpu_count"]:
            raise ConfigValidationError(
                f"Insufficient CPU cores: {cpu_count} < {self._performance_thresholds['min_cpu_count']}",
                "system.cpu"
            )
        
        # Check memory
        memory = psutil.virtual_memory()
        memory_gb = memory.total / (1024**3)
        if memory_gb < self._performance_thresholds["min_memory_gb"]:
            raise ConfigValidationError(
                f"Insufficient memory: {memory_gb:.1f}GB < {self._performance_thresholds['min_memory_gb']}GB",
                "system.memory"
            )
        
        # Check disk space
        disk = psutil.disk_usage('/')
        disk_gb = disk.free / (1024**3)
        if disk_gb < self._performance_thresholds["min_disk_gb"]:
            raise ConfigValidationError(
                f"Insufficient disk space: {disk_gb:.1f}GB < {self._performance_thresholds['min_disk_gb']}GB",
                "system.disk"
            )
        
        # Check port availability
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('', settings.monitoring.metrics_port))
            sock.close()
        except socket.error:
            raise ConfigValidationError(
                f"Port {settings.monitoring.metrics_port} is already in use",
                "monitoring.metrics_port"
            )
    
    def validate_environment_variables(self):
        """Validate environment variable types and formats"""
        # Validate email format
        if hasattr(settings, 'admin_email'):
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, settings.admin_email):
                raise ConfigValidationError(
                    f"Invalid email format: {settings.admin_email}",
                    "admin_email"
                )
        
        # Validate IP addresses
        if hasattr(settings, 'allowed_ips'):
            ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
            for ip in settings.allowed_ips:
                if not re.match(ip_pattern, ip):
                    raise ConfigValidationError(
                        f"Invalid IP address format: {ip}",
                        "allowed_ips"
                    )
        
        # Validate numeric ranges
        if hasattr(settings, 'max_upload_size'):
            if not isinstance(settings.max_upload_size, (int, float)) or settings.max_upload_size <= 0:
                raise ConfigValidationError(
                    "max_upload_size must be a positive number",
                    "max_upload_size"
                )
    
    def validate_performance(self):
        """Validate performance-critical settings"""
        # Validate timeouts
        if settings.database.pool_timeout < 1:
            raise ConfigValidationError(
                "Database pool timeout must be at least 1 second",
                "database.pool_timeout"
            )
        
        if settings.database.pool_recycle < 300:
            raise ConfigValidationError(
                "Database connection recycle time must be at least 300 seconds",
                "database.pool_recycle"
            )
        
        # Validate concurrent operation limits
        if settings.security.rate_limit_requests < 10:
            raise ConfigValidationError(
                "Rate limit requests must be at least 10",
                "security.rate_limit_requests"
            )
        
        # Validate cache settings
        if settings.cache.max_size < 100:
            raise ConfigValidationError(
                "Cache max size must be at least 100",
                "cache.max_size"
            )
    
    def validate_security(self):
        """Validate security settings"""
        # Check TLS configuration
        try:
            context = ssl.create_default_context()
            if not context.minimum_version == ssl.TLSVersion.TLSv1_3:
                raise ConfigValidationError(
                    "TLS 1.3 is not enabled",
                    "security.tls"
                )
        except Exception as e:
            raise ConfigValidationError(
                f"Failed to validate TLS configuration: {str(e)}",
                "security.tls"
            )
        
        # Check quantum-safe cryptography
        if settings.environment == "production":
            if not hasattr(settings.security, 'quantum_safe') or not settings.security.quantum_safe:
                self.warnings.append("Quantum-safe cryptography not enabled in production")
        
        # Check key rotation policy
        if settings.environment == "production":
            if not hasattr(settings.security, 'key_rotation_days') or settings.security.key_rotation_days > 90:
                raise ConfigValidationError(
                    "Key rotation period must be 90 days or less in production",
                    "security.key_rotation_days"
                )
        
        # Check for secure defaults
        if settings.environment == "production":
            if settings.debug:
                raise ConfigValidationError(
                    "Debug mode cannot be enabled in production",
                    "debug"
                )
            
            if not settings.security.allowed_origins:
                raise ConfigValidationError(
                    "Allowed origins must be configured in production",
                    "security.allowed_origins"
                )
            
            if not settings.monitoring.sentry_dsn:
                raise ConfigValidationError(
                    "Sentry DSN must be configured in production",
                    "monitoring.sentry_dsn"
                )
    
    def get_report(self) -> Dict[str, Any]:
        """Get validation report"""
        return {
            "valid": len(self.errors) == 0,
            "errors": self.errors,
            "warnings": self.warnings,
            "environment": settings.environment,
            "version": settings.version,
            "validation_timestamp": datetime.datetime.utcnow().isoformat(),
            "system_info": {
                "cpu_count": psutil.cpu_count(),
                "memory_gb": psutil.virtual_memory().total / (1024**3),
                "disk_gb": psutil.disk_usage('/').free / (1024**3)
            }
        }

def validate_config() -> Dict[str, Any]:
    """Run configuration validation and return report"""
    validator = ConfigValidator()
    validator.validate_all()
    return validator.get_report()

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Run validation
    report = validate_config()
    
    # Print report
    print("\nConfiguration Validation Report:")
    print(f"Environment: {report['environment']}")
    print(f"Version: {report['version']}")
    print(f"Valid: {report['valid']}")
    print(f"Validation Time: {report['validation_timestamp']}")
    
    if report['errors']:
        print("\nErrors:")
        for error in report['errors']:
            print(f"- {error}")
    
    if report['warnings']:
        print("\nWarnings:")
        for warning in report['warnings']:
            print(f"- {warning}")
    
    # Exit with appropriate status code
    exit(0 if report['valid'] else 1) 