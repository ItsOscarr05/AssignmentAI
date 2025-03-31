import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from app.core.rate_limit import RateLimiter, RateLimitExceeded
from app.core.config import settings

@pytest.fixture
def mock_redis():
    with patch('redis.Redis') as mock:
        yield mock

@pytest.fixture
def rate_limiter(mock_redis):
    return RateLimiter()

def test_check_rate_limit_within_limit(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.return_value = b'4'  # 4 requests made
    mock_redis.ttl.return_value = 300  # 5 minutes remaining
    
    # Test
    result = rate_limiter.check_rate_limit("test_user")
    
    # Assert
    assert result is True
    mock_redis.get.assert_called_once()
    mock_redis.ttl.assert_called_once()

def test_check_rate_limit_exceeded(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.return_value = b'6'  # 6 requests made (exceeding limit)
    mock_redis.ttl.return_value = 300  # 5 minutes remaining
    
    # Test
    with pytest.raises(RateLimitExceeded) as exc_info:
        rate_limiter.check_rate_limit("test_user")
    
    # Assert
    assert "Rate limit exceeded" in str(exc_info.value)
    assert exc_info.value.retry_after == 300

def test_check_rate_limit_no_previous_requests(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.return_value = None
    mock_redis.ttl.return_value = -1
    
    # Test
    result = rate_limiter.check_rate_limit("test_user")
    
    # Assert
    assert result is True
    mock_redis.get.assert_called_once()
    mock_redis.ttl.assert_called_once()

def test_check_rate_limit_redis_error(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.side_effect = Exception("Redis error")
    
    # Test
    result = rate_limiter.check_rate_limit("test_user")
    
    # Assert
    assert result is True  # Should allow request on Redis error

def test_increment_request_count(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.return_value = b'4'
    mock_redis.ttl.return_value = 300
    
    # Test
    rate_limiter.increment_request_count("test_user")
    
    # Assert
    mock_redis.incr.assert_called_once()
    mock_redis.expire.assert_called_once()

def test_increment_request_count_new_user(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.return_value = None
    mock_redis.ttl.return_value = -1
    
    # Test
    rate_limiter.increment_request_count("test_user")
    
    # Assert
    mock_redis.set.assert_called_once()
    mock_redis.expire.assert_called_once()

def test_increment_request_count_redis_error(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.side_effect = Exception("Redis error")
    
    # Test
    rate_limiter.increment_request_count("test_user")
    
    # Assert
    mock_redis.get.assert_called_once()

def test_reset_rate_limit(rate_limiter, mock_redis):
    # Test
    rate_limiter.reset_rate_limit("test_user")
    
    # Assert
    mock_redis.delete.assert_called_once()

def test_reset_rate_limit_redis_error(rate_limiter, mock_redis):
    # Setup
    mock_redis.delete.side_effect = Exception("Redis error")
    
    # Test
    rate_limiter.reset_rate_limit("test_user")
    
    # Assert
    mock_redis.delete.assert_called_once()

def test_get_remaining_requests(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.return_value = b'4'
    mock_redis.ttl.return_value = 300
    
    # Test
    remaining, ttl = rate_limiter.get_remaining_requests("test_user")
    
    # Assert
    assert remaining == 1  # 5 - 4 = 1 request remaining
    assert ttl == 300

def test_get_remaining_requests_no_previous_requests(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.return_value = None
    mock_redis.ttl.return_value = -1
    
    # Test
    remaining, ttl = rate_limiter.get_remaining_requests("test_user")
    
    # Assert
    assert remaining == 5  # Full limit available
    assert ttl == -1

def test_get_remaining_requests_redis_error(rate_limiter, mock_redis):
    # Setup
    mock_redis.get.side_effect = Exception("Redis error")
    
    # Test
    remaining, ttl = rate_limiter.get_remaining_requests("test_user")
    
    # Assert
    assert remaining == 5  # Should return full limit on Redis error
    assert ttl == -1 