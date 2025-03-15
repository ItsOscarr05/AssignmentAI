import logging
import logging.handlers
import os
from typing import Dict, Any
from datetime import datetime

def setup_logging(log_dir: str = "logs", log_level: str = "INFO") -> None:
    """
    Set up logging configuration for the application.

    Args:
        log_dir: Directory to store log files
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Create logs directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )

    # File handler for all logs
    all_logs_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, "all.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    all_logs_handler.setFormatter(file_formatter)
    all_logs_handler.setLevel(logging.DEBUG)
    root_logger.addHandler(all_logs_handler)

    # File handler for errors only
    error_logs_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, "error.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    error_logs_handler.setFormatter(file_formatter)
    error_logs_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_logs_handler)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(getattr(logging, log_level.upper()))
    root_logger.addHandler(console_handler)

    # Suppress third-party library logs
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name.

    Args:
        name: Name of the logger

    Returns:
        Logger instance
    """
    return logging.getLogger(name)

def log_error(logger: logging.Logger, error: Exception, context: Dict[str, Any] = None) -> None:
    """
    Log an error with context.

    Args:
        logger: Logger instance
        error: Exception to log
        context: Optional dictionary of context information
    """
    error_msg = f"Error: {str(error)}"
    if context:
        error_msg += f" Context: {context}"
    logger.error(error_msg, exc_info=True)

def log_warning(logger: logging.Logger, message: str, context: Dict[str, Any] = None) -> None:
    """
    Log a warning with context.

    Args:
        logger: Logger instance
        message: Warning message
        context: Optional dictionary of context information
    """
    warning_msg = f"Warning: {message}"
    if context:
        warning_msg += f" Context: {context}"
    logger.warning(warning_msg)

def log_info(logger: logging.Logger, message: str, context: Dict[str, Any] = None) -> None:
    """
    Log an info message with context.

    Args:
        logger: Logger instance
        message: Info message
        context: Optional dictionary of context information
    """
    info_msg = f"Info: {message}"
    if context:
        info_msg += f" Context: {context}"
    logger.info(info_msg)

def log_debug(logger: logging.Logger, message: str, context: Dict[str, Any] = None) -> None:
    """
    Log a debug message with context.

    Args:
        logger: Logger instance
        message: Debug message
        context: Optional dictionary of context information
    """
    debug_msg = f"Debug: {message}"
    if context:
        debug_msg += f" Context: {context}"
    logger.debug(debug_msg) 