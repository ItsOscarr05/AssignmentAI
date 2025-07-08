import pytest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
import json
from app.services.cache_service import CacheService, cache_service


class TestCacheService:
    """Test cases for CacheService"""
    
    @pytest.fixture
    def mock_redis(self):
        """Create a mock Redis cache"""
        mock = AsyncMock()
        return mock
    
    @pytest.fixture
    def cache_service_instance(self, mock_redis):
        """Create a CacheService instance with mocked Redis"""
        with patch('app.services.cache_service.RedisCache', return_value=mock_redis):
            service = CacheService()
            return service
    
    @pytest.mark.asyncio
    async def test_get_success(self, cache_service_instance, mock_redis):
        """Test successful cache get operation"""
        test_data = {"key": "value", "number": 42}
        mock_redis.get.return_value = json.dumps(test_data)
        
        result = await cache_service_instance.get("test_key")
        
        assert result == test_data
        mock_redis.get.assert_called_once_with("test_key")
    
    @pytest.mark.asyncio
    async def test_get_not_found(self, cache_service_instance, mock_redis):
        """Test cache get when key doesn't exist"""
        mock_redis.get.return_value = None
        
        result = await cache_service_instance.get("nonexistent_key")
        
        assert result is None
        mock_redis.get.assert_called_once_with("nonexistent_key")
    
    @pytest.mark.asyncio
    async def test_get_error(self, cache_service_instance, mock_redis):
        """Test cache get with Redis error"""
        mock_redis.get.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.get("test_key")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_set_success(self, cache_service_instance, mock_redis):
        """Test successful cache set operation"""
        test_data = {"key": "value", "number": 42}
        mock_redis.set.return_value = True
        
        result = await cache_service_instance.set("test_key", test_data)
        
        assert result is True
        mock_redis.set.assert_called_once_with(
            "test_key",
            json.dumps(test_data),
            3600  # default TTL
        )
    
    @pytest.mark.asyncio
    async def test_set_with_custom_ttl(self, cache_service_instance, mock_redis):
        """Test cache set with custom TTL"""
        test_data = {"key": "value"}
        mock_redis.set.return_value = True
        
        result = await cache_service_instance.set("test_key", test_data, ttl=7200)
        
        assert result is True
        mock_redis.set.assert_called_once_with(
            "test_key",
            json.dumps(test_data),
            7200
        )
    
    @pytest.mark.asyncio
    async def test_set_with_tags(self, cache_service_instance, mock_redis):
        """Test cache set with tags"""
        test_data = {"key": "value"}
        tags = ["tag1", "tag2"]
        mock_redis.set.return_value = True
        
        result = await cache_service_instance.set("test_key", test_data, tags=tags)
        
        assert result is True
        # Should call set twice: once for data, once for tags
        assert mock_redis.set.call_count == 2
        mock_redis.set.assert_any_call(
            "test_key",
            json.dumps(test_data),
            3600
        )
        mock_redis.set.assert_any_call(
            "tags:test_key",
            json.dumps(tags),
            3600
        )
    
    @pytest.mark.asyncio
    async def test_set_error(self, cache_service_instance, mock_redis):
        """Test cache set with Redis error"""
        mock_redis.set.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.set("test_key", {"data": "value"})
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_delete_success(self, cache_service_instance, mock_redis):
        """Test successful cache delete operation"""
        mock_redis.delete.return_value = True
        
        result = await cache_service_instance.delete("test_key")
        
        assert result is True
        mock_redis.delete.assert_called_once_with("test_key")
    
    @pytest.mark.asyncio
    async def test_delete_error(self, cache_service_instance, mock_redis):
        """Test cache delete with Redis error"""
        mock_redis.delete.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.delete("test_key")
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_invalidate_by_tag_success(self, cache_service_instance, mock_redis):
        """Test successful cache invalidation by tag"""
        mock_redis.keys.return_value = ["tags:key1", "tags:key2"]
        mock_redis.get.side_effect = [
            json.dumps(["tag1", "tag2"]),  # key1 has the tag
            json.dumps(["tag3", "tag4"])   # key2 doesn't have the tag
        ]
        mock_redis.delete.return_value = True
        
        result = await cache_service_instance.invalidate_by_tag("tag1")
        
        assert result is True
        mock_redis.keys.assert_called_once_with("tags:*")
        # Should delete key1 and its tag
        mock_redis.delete.assert_any_call("key1")
        mock_redis.delete.assert_any_call("tags:key1")
    
    @pytest.mark.asyncio
    async def test_invalidate_by_tag_no_matches(self, cache_service_instance, mock_redis):
        """Test cache invalidation by tag with no matching keys"""
        mock_redis.keys.return_value = []
        
        result = await cache_service_instance.invalidate_by_tag("nonexistent_tag")
        
        assert result is True
        mock_redis.keys.assert_called_once_with("tags:*")
        mock_redis.delete.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_invalidate_by_tag_error(self, cache_service_instance, mock_redis):
        """Test cache invalidation by tag with Redis error"""
        mock_redis.keys.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.invalidate_by_tag("tag1")
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_get_or_set_cache_hit(self, cache_service_instance, mock_redis):
        """Test get_or_set when value exists in cache"""
        cached_data = {"cached": "data"}
        mock_redis.get.return_value = json.dumps(cached_data)
        getter_func = AsyncMock()
        
        result = await cache_service_instance.get_or_set("test_key", getter_func)
        
        assert result == cached_data
        getter_func.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_or_set_cache_miss(self, cache_service_instance, mock_redis):
        """Test get_or_set when value doesn't exist in cache"""
        fresh_data = {"fresh": "data"}
        mock_redis.get.return_value = None  # Cache miss
        mock_redis.set.return_value = True
        getter_func = AsyncMock(return_value=fresh_data)
        
        result = await cache_service_instance.get_or_set("test_key", getter_func)
        
        assert result == fresh_data
        getter_func.assert_called_once()
        mock_redis.set.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_or_set_with_ttl_and_tags(self, cache_service_instance, mock_redis):
        """Test get_or_set with custom TTL and tags"""
        fresh_data = {"fresh": "data"}
        mock_redis.get.return_value = None
        mock_redis.set.return_value = True
        getter_func = AsyncMock(return_value=fresh_data)
        
        result = await cache_service_instance.get_or_set(
            "test_key", 
            getter_func, 
            ttl=7200, 
            tags=["tag1", "tag2"]
        )
        
        assert result == fresh_data
        # Should call set twice: once for data, once for tags
        assert mock_redis.set.call_count == 2
    
    @pytest.mark.asyncio
    async def test_clear_pattern_success(self, cache_service_instance, mock_redis):
        """Test successful cache pattern clearing"""
        mock_redis.clear_pattern.return_value = True
        
        result = await cache_service_instance.clear_pattern("user:*")
        
        assert result is True
        mock_redis.clear_pattern.assert_called_once_with("user:*")
    
    @pytest.mark.asyncio
    async def test_clear_pattern_error(self, cache_service_instance, mock_redis):
        """Test cache pattern clearing with Redis error"""
        mock_redis.clear_pattern.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.clear_pattern("user:*")
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_get_many_success(self, cache_service_instance, mock_redis):
        """Test successful get_many operation"""
        keys = ["key1", "key2", "key3"]
        mock_redis.get.side_effect = [
            json.dumps({"data": "value1"}),  # key1 exists
            None,                            # key2 doesn't exist
            json.dumps({"data": "value3"})   # key3 exists
        ]
        
        result = await cache_service_instance.get_many(keys)
        
        expected = {
            "key1": {"data": "value1"},
            "key3": {"data": "value3"}
        }
        assert result == expected
        assert mock_redis.get.call_count == 3
    
    @pytest.mark.asyncio
    async def test_get_many_error(self, cache_service_instance, mock_redis):
        """Test get_many with Redis error"""
        mock_redis.get.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.get_many(["key1", "key2"])
        
        assert result == {}
    
    @pytest.mark.asyncio
    async def test_set_many_success(self, cache_service_instance, mock_redis):
        """Test successful set_many operation"""
        items = {"key1": {"data": "value1"}, "key2": {"data": "value2"}}
        mock_redis.set.return_value = True
        
        result = await cache_service_instance.set_many(items)
        
        assert result is True
        assert mock_redis.set.call_count == 2  # 2 data entries (no tags by default)
    
    @pytest.mark.asyncio
    async def test_set_many_with_ttl_and_tags(self, cache_service_instance, mock_redis):
        """Test set_many with custom TTL and tags"""
        items = {"key1": {"data": "value1"}}
        mock_redis.set.return_value = True
        
        result = await cache_service_instance.set_many(
            items, 
            ttl=7200, 
            tags=["tag1", "tag2"]
        )
        
        assert result is True
        # Should call set twice: once for data, once for tags
        assert mock_redis.set.call_count == 2
    
    @pytest.mark.asyncio
    async def test_set_many_partial_failure(self, cache_service_instance, mock_redis):
        """Test set_many with partial failure"""
        items = {"key1": {"data": "value1"}, "key2": {"data": "value2"}}
        mock_redis.set.side_effect = [True, False]  # First succeeds, second fails
        
        result = await cache_service_instance.set_many(items)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_set_many_error(self, cache_service_instance, mock_redis):
        """Test set_many with Redis error"""
        mock_redis.set.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.set_many({"key1": {"data": "value1"}})
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_delete_many_success(self, cache_service_instance, mock_redis):
        """Test successful delete_many operation"""
        keys = ["key1", "key2", "key3"]
        mock_redis.delete.return_value = True
        
        result = await cache_service_instance.delete_many(keys)
        
        assert result is True
        assert mock_redis.delete.call_count == 3
    
    @pytest.mark.asyncio
    async def test_delete_many_partial_failure(self, cache_service_instance, mock_redis):
        """Test delete_many with partial failure"""
        keys = ["key1", "key2", "key3"]
        mock_redis.delete.side_effect = [True, False, True]  # Second fails
        
        result = await cache_service_instance.delete_many(keys)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_delete_many_error(self, cache_service_instance, mock_redis):
        """Test delete_many with Redis error"""
        mock_redis.delete.side_effect = Exception("Redis connection error")
        
        result = await cache_service_instance.delete_many(["key1", "key2"])
        
        assert result is False
    
    def test_service_initialization(self):
        """Test CacheService initialization"""
        with patch('app.services.cache_service.RedisCache') as mock_redis_class:
            service = CacheService()
            
            assert service.default_ttl == 3600
            mock_redis_class.assert_called_once()
    
    def test_global_instance(self):
        """Test global cache_service instance"""
        assert isinstance(cache_service, CacheService)
        assert cache_service.default_ttl == 3600 