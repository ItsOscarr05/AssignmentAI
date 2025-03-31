import logging
import logging.handlers
import json
import os
from datetime import datetime
from typing import Any, Dict, Optional
import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration
from app.core.config import settings

class LoggingService:
    def __init__(self):
        # Create logs directory if it doesn't exist
        os.makedirs(settings.LOGS_DIR, exist_ok=True)
        
        # Configure logging
        self.logger = logging.getLogger("app")
        self.logger.setLevel(logging.INFO)
        
        # Create formatters
        self.json_formatter = logging.Formatter(
            '%(asctime)s %(levelname)s %(name)s %(message)s'
        )
        
        # Create handlers
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(settings.LOGS_DIR, "app.log"),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(self.json_formatter)
        self.logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(self.json_formatter)
        self.logger.addHandler(console_handler)
        
        # Configure Sentry
        if settings.SENTRY_DSN:
            sentry_logging = LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR
            )
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                environment=settings.ENVIRONMENT,
                integrations=[sentry_logging]
            )
    
    def _format_log_message(
        self,
        level: str,
        message: str,
        extra: Optional[Dict[str, Any]] = None
    ) -> str:
        """Format log message as JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            "environment": settings.ENVIRONMENT,
            "service": "assignment-ai"
        }
        
        if extra:
            log_data.update(extra)
        
        return json.dumps(log_data)
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log info message"""
        self.logger.info(
            self._format_log_message("INFO", message, extra)
        )
    
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log error message"""
        self.logger.error(
            self._format_log_message("ERROR", message, extra)
        )
        if settings.SENTRY_DSN:
            sentry_sdk.capture_message(message, extra=extra)
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log warning message"""
        self.logger.warning(
            self._format_log_message("WARNING", message, extra)
        )
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log debug message"""
        self.logger.debug(
            self._format_log_message("DEBUG", message, extra)
        )
    
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log critical message"""
        self.logger.critical(
            self._format_log_message("CRITICAL", message, extra)
        )
        if settings.SENTRY_DSN:
            sentry_sdk.capture_message(message, level="fatal", extra=extra)
    
    def exception(self, message: str, exc_info: bool = True, extra: Optional[Dict[str, Any]] = None):
        """Log exception with traceback"""
        self.logger.exception(
            self._format_log_message("ERROR", message, extra),
            exc_info=exc_info
        )
        if settings.SENTRY_DSN:
            sentry_sdk.capture_exception(extra=extra)
    
    def request(self, request_id: str, method: str, path: str, duration: float, status: int):
        """Log HTTP request"""
        self.info(
            f"HTTP Request: {method} {path}",
            extra={
                "request_id": request_id,
                "method": method,
                "path": path,
                "duration": duration,
                "status": status
            }
        )
    
    def db_query(self, query: str, duration: float, params: Optional[Dict[str, Any]] = None):
        """Log database query"""
        self.debug(
            f"Database Query: {query}",
            extra={
                "query": query,
                "duration": duration,
                "params": params
            }
        )
    
    def cache_operation(self, operation: str, key: str, hit: bool, duration: float):
        """Log cache operation"""
        self.debug(
            f"Cache {operation}: {key}",
            extra={
                "operation": operation,
                "key": key,
                "hit": hit,
                "duration": duration
            }
        )
    
    def ai_request(self, operation: str, duration: float, tokens: Optional[int] = None):
        """Log AI service request"""
        self.info(
            f"AI Request: {operation}",
            extra={
                "operation": operation,
                "duration": duration,
                "tokens": tokens
            }
        )
    
    def user_action(self, user_id: int, action: str, details: Optional[Dict[str, Any]] = None):
        """Log user action"""
        self.info(
            f"User Action: {action}",
            extra={
                "user_id": user_id,
                "action": action,
                "details": details
            }
        )

# Create global logging service instance
logging_service = LoggingService() 