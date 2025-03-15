import pytest
from backend.cache import cache, binary_cache
import pickle

@pytest.mark.asyncio
async def test_cache_connection(mock_redis):
    """Test Redis cache connection"""
    assert await cache.connect()
    assert await cache.disconnect()

@pytest.mark.asyncio
async def test_cache_set_get(mock_redis):
    """Test setting and getting values from cache"""
    test_key = "test_key"
    test_value = "test_value"
    
    # Test setting value
    await cache.set(test_key, test_value)
    
    # Test getting value
    result = await cache.get(test_key)
    assert result == test_value

@pytest.mark.asyncio
async def test_cache_delete(mock_redis):
    """Test deleting values from cache"""
    test_key = "test_key"
    test_value = "test_value"
    
    # Set and verify value
    await cache.set(test_key, test_value)
    assert await cache.exists(test_key)
    
    # Delete and verify removal
    await cache.delete(test_key)
    assert not await cache.exists(test_key)

@pytest.mark.asyncio
async def test_binary_cache_operations(mock_redis):
    """Test binary cache operations with complex objects"""
    test_key = "binary_test"
    test_data = {
        "numpy_array": [1, 2, 3],
        "metadata": {"type": "test", "size": 3}
    }
    
    # Test setting binary data
    await binary_cache.set(test_key, test_data)
    
    # Test getting binary data
    result = await binary_cache.get(test_key)
    assert result == test_data
    
    # Test deleting binary data
    await binary_cache.delete(test_key)
    assert not await binary_cache.exists(test_key)

@pytest.mark.asyncio
async def test_cache_expiration(mock_redis):
    """Test cache key expiration"""
    test_key = "expiring_key"
    test_value = "expiring_value"
    
    # Set value with 1 second expiration
    await cache.set(test_key, test_value, expire=1)
    
    # Verify value exists
    assert await cache.exists(test_key)
    
    # Wait for expiration
    import asyncio
    await asyncio.sleep(1.1)
    
    # Verify value has expired
    assert not await cache.exists(test_key) 