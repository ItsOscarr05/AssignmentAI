import pytest
from unittest.mock import Mock, patch
from app.core.cache import RedisCache
from app.core.config import settings

@pytest.fixture
def mock_redis():
    with patch('redis.Redis') as mock:
        yield mock

@pytest.fixture
def cache(mock_redis):
    return RedisCache()

def test_get_cache_hit(cache, mock_redis):
    # Setup
    mock_redis.get.return_value = b'{"key": "value"}'
    
    # Test
    result = cache.get("test_key")
    
    # Assert
    assert result == {"key": "value"}
    mock_redis.get.assert_called_once_with("test_key")

def test_get_cache_miss(cache, mock_redis):
    # Setup
    mock_redis.get.return_value = None
    
    # Test
    result = cache.get("test_key")
    
    # Assert
    assert result is None
    mock_redis.get.assert_called_once_with("test_key")

def test_get_cache_error(cache, mock_redis):
    # Setup
    mock_redis.get.side_effect = Exception("Redis error")
    
    # Test
    result = cache.get("test_key")
    
    # Assert
    assert result is None

def test_set_cache(cache, mock_redis):
    # Setup
    data = {"key": "value"}
    
    # Test
    cache.set("test_key", data)
    
    # Assert
    mock_redis.set.assert_called_once_with(
        "test_key",
        '{"key": "value"}',
        ex=None
    )

def test_set_cache_with_expiry(cache, mock_redis):
    # Setup
    data = {"key": "value"}
    expiry = 3600
    
    # Test
    cache.set("test_key", data, expiry)
    
    # Assert
    mock_redis.set.assert_called_once_with(
        "test_key",
        '{"key": "value"}',
        ex=3600
    )

def test_set_cache_error(cache, mock_redis):
    # Setup
    mock_redis.set.side_effect = Exception("Redis error")
    
    # Test
    cache.set("test_key", {"key": "value"})
    
    # Assert
    mock_redis.set.assert_called_once()

def test_delete_cache(cache, mock_redis):
    # Test
    cache.delete("test_key")
    
    # Assert
    mock_redis.delete.assert_called_once_with("test_key")

def test_delete_cache_error(cache, mock_redis):
    # Setup
    mock_redis.delete.side_effect = Exception("Redis error")
    
    # Test
    cache.delete("test_key")
    
    # Assert
    mock_redis.delete.assert_called_once()

def test_exists_cache(cache, mock_redis):
    # Setup
    mock_redis.exists.return_value = True
    
    # Test
    result = cache.exists("test_key")
    
    # Assert
    assert result is True
    mock_redis.exists.assert_called_once_with("test_key")

def test_exists_cache_error(cache, mock_redis):
    # Setup
    mock_redis.exists.side_effect = Exception("Redis error")
    
    # Test
    result = cache.exists("test_key")
    
    # Assert
    assert result is False

def test_clear_pattern(cache, mock_redis):
    # Setup
    mock_redis.keys.return_value = [b"test_key1", b"test_key2"]
    
    # Test
    cache.clear_pattern("test_*")
    
    # Assert
    mock_redis.keys.assert_called_once_with("test_*")
    mock_redis.delete.assert_called_once_with("test_key1", "test_key2")

def test_clear_pattern_no_matches(cache, mock_redis):
    # Setup
    mock_redis.keys.return_value = []
    
    # Test
    cache.clear_pattern("test_*")
    
    # Assert
    mock_redis.keys.assert_called_once_with("test_*")
    mock_redis.delete.assert_not_called()

def test_clear_pattern_error(cache, mock_redis):
    # Setup
    mock_redis.keys.side_effect = Exception("Redis error")
    
    # Test
    cache.clear_pattern("test_*")
    
    # Assert
    mock_redis.keys.assert_called_once_with("test_*")
    mock_redis.delete.assert_not_called()

def test_cache_key_patterns():
    # Test assignment cache key
    assert RedisCache.get_assignment_key(1) == "assignment:1"
    
    # Test feedback cache key
    assert RedisCache.get_feedback_key(1) == "feedback:1"
    
    # Test AI assignment cache key
    assert RedisCache.get_ai_assignment_key(1) == "ai_assignment:1"
    
    # Test user assignments cache key
    assert RedisCache.get_user_assignments_key(1) == "user:1:assignments"
    
    # Test class assignments cache key
    assert RedisCache.get_class_assignments_key(1) == "class:1:assignments" 