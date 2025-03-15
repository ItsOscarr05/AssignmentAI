"""
Logging module for structured logging with context and correlation IDs.
"""

import logging
import json
import sys
import traceback
from datetime import datetime
from typing import Any, Dict, Optional
from functools import wraps
import uuid
from contextvars import ContextVar
from config import settings

# Context variables for request tracking
request_id = ContextVar('request_id', default=None)
correlation_id = ContextVar('correlation_id', default=None)
user_id = ContextVar('user_id', default=None)

class StructuredLogger(logging.Logger):
    """Custom logger that adds structured data to log records."""
    
    def _log(
        self,
        level: int,
        msg: str,
        args: tuple,
        exc_info: Optional[Exception] = None,
        extra: Optional[Dict[str, Any]] = None,
        stack_info: bool = False,
        **kwargs
    ):
        """Override _log to add structured data."""
        extra = extra or {}
        
        # Add context data
        extra.update({
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': request_id.get(),
            'correlation_id': correlation_id.get(),
            'user_id': user_id.get()
        })
        
        # Add exception info if present
        if exc_info:
            if isinstance(exc_info, BaseException):
                exc_info = (type(exc_info), exc_info, exc_info.__traceback__)
            elif not isinstance(exc_info, tuple):
                exc_info = sys.exc_info()
            
            if exc_info[0]:
                extra['error'] = {
                    'type': exc_info[0].__name__,
                    'message': str(exc_info[1]),
                    'traceback': traceback.format_exception(*exc_info)
                }
        
        super()._log(level, msg, args, exc_info, extra, stack_info)

class JsonFormatter(logging.Formatter):
    """Format logs as JSON."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format the log record as JSON."""
        # Get the standard fields
        data = {
            'timestamp': getattr(record, 'timestamp', datetime.utcnow().isoformat()),
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name
        }
        
        # Add extra fields
        if hasattr(record, 'request_id'):
            data['request_id'] = record.request_id
        if hasattr(record, 'correlation_id'):
            data['correlation_id'] = record.correlation_id
        if hasattr(record, 'user_id'):
            data['user_id'] = record.user_id
        if hasattr(record, 'error'):
            data['error'] = record.error
        
        # Add any additional fields from extra
        for key, value in record.__dict__.items():
            if key not in {
                'timestamp', 'level', 'message', 'logger',
                'request_id', 'correlation_id', 'user_id',
                'error', 'args', 'exc_info', 'exc_text',
                'msg', 'created', 'msecs', 'relativeCreated',
                'levelname', 'levelno', 'pathname', 'filename',
                'module', 'lineno', 'funcName', 'processName',
                'process', 'threadName', 'thread', 'name'
            }:
                data[key] = value
        
        return json.dumps(data)

def setup_logging():
    """Set up structured logging."""
    # Register custom logger
    logging.setLoggerClass(StructuredLogger)
    
    # Create handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JsonFormatter())
    
    if settings.LOG_FILE:
        file_handler = logging.FileHandler(settings.LOG_FILE)
        file_handler.setFormatter(JsonFormatter())
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(settings.LOG_LEVEL)
    root_logger.addHandler(console_handler)
    
    if settings.LOG_FILE:
        root_logger.addHandler(file_handler)

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(name)

def with_logging(func):
    """Decorator to add logging to a function."""
    logger = get_logger(func.__module__)
    
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        # Generate request ID if not present
        req_id = request_id.get() or str(uuid.uuid4())
        request_id.set(req_id)
        
        logger.info(f"Starting {func.__name__}", extra={
            'function': func.__name__,
            'args': args,
            'kwargs': kwargs
        })
        
        try:
            result = await func(*args, **kwargs)
            logger.info(f"Completed {func.__name__}", extra={
                'function': func.__name__,
                'result': result
            })
            return result
        except Exception as e:
            logger.error(
                f"Error in {func.__name__}",
                exc_info=e,
                extra={'function': func.__name__}
            )
            raise
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs):
        # Generate request ID if not present
        req_id = request_id.get() or str(uuid.uuid4())
        request_id.set(req_id)
        
        logger.info(f"Starting {func.__name__}", extra={
            'function': func.__name__,
            'args': args,
            'kwargs': kwargs
        })
        
        try:
            result = func(*args, **kwargs)
            logger.info(f"Completed {func.__name__}", extra={
                'function': func.__name__,
                'result': result
            })
            return result
        except Exception as e:
            logger.error(
                f"Error in {func.__name__}",
                exc_info=e,
                extra={'function': func.__name__}
            )
            raise
    
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper 