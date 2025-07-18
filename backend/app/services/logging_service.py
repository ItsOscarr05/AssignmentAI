import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

from app.core.config import settings

# Safe fallback for LOG_FORMAT
DEFAULT_LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
log_format = getattr(settings, 'LOG_FORMAT', DEFAULT_LOG_FORMAT)
if log_format == 'json':
    # To enable real JSON logging, install python-json-logger and use:
    # from pythonjsonlogger import jsonlogger
    # handler = logging.StreamHandler()
    # handler.setFormatter(jsonlogger.JsonFormatter())
    # logging.getLogger().addHandler(handler)
    # For now, fallback to default format to avoid errors
    log_format = DEFAULT_LOG_FORMAT

# Safe fallback for LOG_LEVEL
log_level_str = getattr(settings, 'LOG_LEVEL', 'INFO')
try:
    log_level = getattr(logging, log_level_str.upper())
except (AttributeError, TypeError):
    log_level = logging.INFO

# Ensure logs directory exists
logs_dir = getattr(settings, 'LOGS_DIR', 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=log_level,
    format=log_format,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            os.path.join(logs_dir, f"app_{datetime.now().strftime('%Y%m%d')}.log")
        )
    ]
)

logger = logging.getLogger(__name__)

class LoggingService:
    @staticmethod
    def info(message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log an info message."""
        logger.info(message, extra=extra)

    @staticmethod
    def error(message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log an error message."""
        logger.error(message, extra=extra)

    @staticmethod
    def warning(message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log a warning message."""
        logger.warning(message, extra=extra)

    @staticmethod
    def debug(message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log a debug message."""
        logger.debug(message, extra=extra)

    @staticmethod
    def critical(message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log a critical message."""
        logger.critical(message, extra=extra)

    @staticmethod
    def exception(message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Log an exception with traceback."""
        logger.exception(message, extra=extra)

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