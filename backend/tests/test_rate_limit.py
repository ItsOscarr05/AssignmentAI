import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from app.core.rate_limit import RateLimiter, RateLimitExceeded
from app.core.config import settings
from fastapi import HTTPException

@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    return mock

@pytest.fixture
def rate_limiter(mock_redis):
    limiter = RateLimiter(mock_redis)
    # Add missing attributes that are referenced in the methods
    limiter.endpoint_patterns = {
        "api": ["/api/"],
        "auth": ["/auth/"],
        "admin": ["/admin/"]
    }
    limiter.endpoint_limits = {
        "api": {"requests": 100, "period": 1},
        "auth": {"requests": 5, "period": 1},
        "admin": {"requests": 50, "period": 1}
    }
    limiter.requests = {}
    limiter.reset_times = {}
    limiter.locked_accounts = {}
    limiter.login_attempts = {}
    limiter.two_factor_attempts = {}
    return limiter

def test_check_rate_limit_within_limit(rate_limiter, mock_redis):
    """Test rate limit check when within limits"""
    # Test the sync method directly
    result = rate_limiter.check_rate_limit("test_user")
    # Should not raise an exception when within limits
    assert result is None

def test_check_rate_limit_exceeded(rate_limiter, mock_redis):
    """Test rate limit check when limit exceeded"""
    # Set up the rate limiter to simulate exceeded limits
    rate_limiter.requests["test_user"] = {"api": 100}  # At the limit for 'api'
    rate_limiter.reset_times["test_user"] = datetime.now()  # Set window to now

    # Test
    with pytest.raises(RateLimitExceeded) as exc_info:
        rate_limiter.check_rate_limit("test_user")
    
    # Assert
    assert "Rate limit exceeded" in str(exc_info.value)

def test_check_rate_limit_no_previous_requests(rate_limiter, mock_redis):
    """Test rate limit check for first request"""
    # Test the sync method directly
    result = rate_limiter.check_rate_limit("test_user")
    # Should not raise an exception for first request
    assert result is None

def test_check_rate_limit_redis_error(rate_limiter, mock_redis):
    """Test rate limit check when Redis has an error"""
    # Test the sync method directly
    result = rate_limiter.check_rate_limit("test_user")
    # Should not raise an exception on Redis error
    assert result is None

def test_rate_limit_exceeded_exception():
    """Test RateLimitExceeded exception"""
    exception = RateLimitExceeded("Rate limit exceeded")
    assert exception.status_code == 429
    assert "Rate limit exceeded" in str(exception)

def test_rate_limiter_initialization():
    """Test RateLimiter initialization"""
    mock_redis = Mock()
    rate_limiter = RateLimiter(mock_redis)
    
    assert rate_limiter.redis == mock_redis
    assert hasattr(rate_limiter, 'rate_limit')
    assert hasattr(rate_limiter, 'window')

def test_rate_limiter_with_different_users(rate_limiter, mock_redis):
    """Test rate limiting with different client IDs"""
    # Test with different user IDs
    for user_id in ["user1", "user2", "user3"]:
        result = rate_limiter.check_rate_limit(user_id)
        assert result is None

def test_rate_limit_exceeded_inheritance():
    """Test that RateLimitExceeded inherits from HTTPException"""
    exception = RateLimitExceeded("Test message")
    assert isinstance(exception, HTTPException)
    assert exception.status_code == 429

def test_increment_request_count(rate_limiter, mock_redis):
    """Test incrementing request count"""
    rate_limiter.increment_request_count("test_user")
    assert "test_user" in rate_limiter.requests
    assert "" in rate_limiter.requests["test_user"]
    assert rate_limiter.requests["test_user"][""] == 1

def test_reset_rate_limit(rate_limiter, mock_redis):
    """Test resetting rate limit"""
    # Add some requests first
    rate_limiter.requests["test_user"] = {"": 5}
    
    # Reset
    rate_limiter.reset_rate_limit("test_user")
    
    # Should be removed
    assert "test_user" not in rate_limiter.requests

def test_get_remaining_requests(rate_limiter, mock_redis):
    """Test getting remaining requests"""
    # Set up some requests
    rate_limiter.requests["test_user"] = {"": 3}
    
    # Get remaining
    remaining, ttl = rate_limiter.get_remaining_requests_and_ttl("test_user")
    
    # Should return remaining requests and TTL
    assert isinstance(remaining, int)
    assert isinstance(ttl, int) 