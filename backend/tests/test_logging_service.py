import pytest
import asyncio
from unittest.mock import patch, MagicMock
from app.services.logging_service import LoggingService
from datetime import datetime

@pytest.fixture
def logging_service():
    return LoggingService()

def test_info_logging(logging_service):
    """Test info logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.info("Test info message", {"key": "value"})
        mock_logger.info.assert_called_once_with("Test info message", extra={"key": "value"})

def test_error_logging(logging_service):
    """Test error logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.error("Test error message", {"error_code": 500})
        mock_logger.error.assert_called_once_with("Test error message", extra={"error_code": 500})

def test_warning_logging(logging_service):
    """Test warning logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.warning("Test warning message", {"warning_type": "deprecation"})
        mock_logger.warning.assert_called_once_with("Test warning message", extra={"warning_type": "deprecation"})

def test_debug_logging(logging_service):
    """Test debug logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.debug("Test debug message", {"debug_info": "details"})
        mock_logger.debug.assert_called_once_with("Test debug message", extra={"debug_info": "details"})

def test_critical_logging(logging_service):
    """Test critical logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.critical("Test critical message", {"critical_error": "system_failure"})
        mock_logger.critical.assert_called_once_with("Test critical message", extra={"critical_error": "system_failure"})

def test_exception_logging(logging_service):
    """Test exception logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.exception("Test exception message", {"exception_type": "ValueError"})
        mock_logger.exception.assert_called_once_with("Test exception message", extra={"exception_type": "ValueError"})

def test_request_logging(logging_service):
    """Test HTTP request logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.request("req123", "GET", "/api/v1/users", 150.5, 200)
        mock_logger.info.assert_called_once_with(
            "HTTP Request: GET /api/v1/users",
            extra={
                "request_id": "req123",
                "method": "GET",
                "path": "/api/v1/users",
                "duration": 150.5,
                "status": 200
            }
        )

def test_db_query_logging(logging_service):
    """Test database query logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.db_query("SELECT * FROM users", 25.3, {"user_id": 1})
        mock_logger.debug.assert_called_once_with(
            "Database Query: SELECT * FROM users",
            extra={
                "query": "SELECT * FROM users",
                "duration": 25.3,
                "params": {"user_id": 1}
            }
        )

def test_cache_operation_logging(logging_service):
    """Test cache operation logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.cache_operation("GET", "user:123", True, 5.2)
        mock_logger.debug.assert_called_once_with(
            "Cache GET: user:123",
            extra={
                "operation": "GET",
                "key": "user:123",
                "hit": True,
                "duration": 5.2
            }
        )

def test_ai_request_logging(logging_service):
    """Test AI request logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.ai_request("generate_text", 2000.5, 150)
        mock_logger.info.assert_called_once_with(
            "AI Request: generate_text",
            extra={
                "operation": "generate_text",
                "duration": 2000.5,
                "tokens": 150
            }
        )

def test_user_action_logging(logging_service):
    """Test user action logging"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.user_action(123, "login", {"ip": "192.168.1.1"})
        mock_logger.info.assert_called_once_with(
            "User Action: login",
            extra={
                "user_id": 123,
                "action": "login",
                "details": {"ip": "192.168.1.1"}
            }
        )

def test_logging_without_extra(logging_service):
    """Test logging without extra parameters"""
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.info("Simple message")
        mock_logger.info.assert_called_once_with("Simple message", extra=None)

def test_logging_service_initialization(logging_service):
    """Test LoggingService initialization"""
    assert hasattr(logging_service, 'info')
    assert hasattr(logging_service, 'error')
    assert hasattr(logging_service, 'warning')
    assert hasattr(logging_service, 'debug')
    assert hasattr(logging_service, 'critical')
    assert hasattr(logging_service, 'exception')
    assert hasattr(logging_service, 'request')
    assert hasattr(logging_service, 'db_query')
    assert hasattr(logging_service, 'cache_operation')
    assert hasattr(logging_service, 'ai_request')
    assert hasattr(logging_service, 'user_action')

def test_global_logging_service():
    """Test the global logging service instance"""
    from app.services.logging_service import logging_service
    
    assert logging_service is not None
    assert isinstance(logging_service, LoggingService)
    
    # Test basic functionality
    with patch('app.services.logging_service.logger') as mock_logger:
        logging_service.info("Test message")
        mock_logger.info.assert_called_once_with("Test message", extra=None) 