import pytest
from unittest.mock import Mock, patch
from app.core.cache import RedisCache, CACHE_KEYS
from app.core.config import settings

@pytest.fixture
def mock_redis():
    with patch('redis.Redis') as mock:
        # Mock the ping method to return True
        mock.return_value.ping.return_value = True
        yield mock

@pytest.fixture
def cache(mock_redis):
    # Create a cache instance with the mocked Redis
    cache_instance = RedisCache()
    # Replace the redis_client with our mock
    cache_instance.redis_client = mock_redis.return_value
    return cache_instance

def test_get_cache_hit(cache, mock_redis):
    # Setup
    mock_redis.return_value.get.return_value = '{"key": "value"}'
    
    # Test
    result = cache.get("test_key")
    
    # Assert
    assert result == {"key": "value"}
    mock_redis.return_value.get.assert_called_once_with("test_key")

def test_get_cache_miss(cache, mock_redis):
    # Setup
    mock_redis.return_value.get.return_value = None
    
    # Test
    result = cache.get("test_key")
    
    # Assert
    assert result is None
    mock_redis.return_value.get.assert_called_once_with("test_key")

def test_get_cache_error(cache, mock_redis):
    # Setup
    mock_redis.return_value.get.side_effect = Exception("Redis error")
    
    # Test
    result = cache.get("test_key")
    
    # Assert
    assert result is None

def test_set_cache(cache, mock_redis):
    # Setup
    data = {"key": "value"}
    
    # Test
    result = cache.set("test_key", data)
    
    # Assert
    assert result is True
    mock_redis.return_value.set.assert_called_once_with(
        "test_key",
        '{"key": "value"}'
    )

def test_set_cache_with_expiry(cache, mock_redis):
    # Setup
    data = {"key": "value"}
    expiry = 3600
    
    # Test
    result = cache.set("test_key", data, expiry)
    
    # Assert
    assert result is True
    mock_redis.return_value.setex.assert_called_once_with(
        "test_key",
        3600,
        '{"key": "value"}'
    )

def test_set_cache_error(cache, mock_redis):
    # Setup
    mock_redis.return_value.set.side_effect = Exception("Redis error")
    
    # Test
    result = cache.set("test_key", {"key": "value"})
    
    # Assert
    assert result is False
    mock_redis.return_value.set.assert_called_once()

def test_delete_cache(cache, mock_redis):
    # Test
    result = cache.delete("test_key")
    
    # Assert
    assert result is True
    mock_redis.return_value.delete.assert_called_once_with("test_key")

def test_delete_cache_error(cache, mock_redis):
    # Setup
    mock_redis.return_value.delete.side_effect = Exception("Redis error")
    
    # Test
    result = cache.delete("test_key")
    
    # Assert
    assert result is False
    mock_redis.return_value.delete.assert_called_once()

def test_exists_cache(cache, mock_redis):
    # Setup
    mock_redis.return_value.exists.return_value = 1
    
    # Test
    result = cache.exists("test_key")
    
    # Assert
    assert result is True
    mock_redis.return_value.exists.assert_called_once_with("test_key")

def test_exists_cache_error(cache, mock_redis):
    # Setup
    mock_redis.return_value.exists.side_effect = Exception("Redis error")
    
    # Test
    result = cache.exists("test_key")
    
    # Assert
    assert result is False

def test_clear_pattern(cache, mock_redis):
    # Setup
    mock_redis.return_value.keys.return_value = ["test_key1", "test_key2"]
    
    # Test
    result = cache.clear_pattern("test_*")
    
    # Assert
    assert result is True
    mock_redis.return_value.keys.assert_called_once_with("test_*")
    mock_redis.return_value.delete.assert_called_once_with("test_key1", "test_key2")

def test_clear_pattern_no_matches(cache, mock_redis):
    # Setup
    mock_redis.return_value.keys.return_value = []
    
    # Test
    result = cache.clear_pattern("test_*")
    
    # Assert
    assert result is True
    mock_redis.return_value.keys.assert_called_once_with("test_*")
    mock_redis.return_value.delete.assert_not_called()

def test_clear_pattern_error(cache, mock_redis):
    # Setup
    mock_redis.return_value.keys.side_effect = Exception("Redis error")
    
    # Test
    result = cache.clear_pattern("test_*")
    
    # Assert
    assert result is False
    mock_redis.return_value.keys.assert_called_once_with("test_*")
    mock_redis.return_value.delete.assert_not_called()

def test_cache_key_patterns():
    # Test assignment cache key
    assert CACHE_KEYS["assignment"].format(id=1) == "assignment:1"
    
    # Test feedback cache key
    assert CACHE_KEYS["feedback"].format(id=1) == "feedback:1"
    
    # Test AI assignment cache key
    assert CACHE_KEYS["ai_assignment"].format(id=1) == "ai_assignment:1"
    
    # Test user assignments cache key
    assert CACHE_KEYS["user_assignments"].format(user_id=1) == "user:1:assignments"
    
    # Test class assignments cache key
    assert CACHE_KEYS["class_assignments"].format(class_id=1) == "class:1:assignments" 