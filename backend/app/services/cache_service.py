from typing import Any, Optional, Union
import json
from datetime import datetime, timedelta
from app.core.cache import RedisCache
from app.services.logging_service import logging_service

class CacheService:
    def __init__(self):
        self.redis = RedisCache()
        self.default_ttl = 3600  # 1 hour default TTL
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logging_service.error(
                "Error getting value from cache",
                extra={"error": str(e)}
            )
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        tags: Optional[list] = None
    ) -> bool:
        """Set value in cache with optional TTL and tags"""
        try:
            serialized_value = json.dumps(value)
            success = await self.redis.set(
                key,
                serialized_value,
                ttl or self.default_ttl
            )
            
            if success and tags:
                # Store tags for cache invalidation
                await self.redis.set(
                    f"tags:{key}",
                    json.dumps(tags),
                    ttl or self.default_ttl
                )
            
            return success
        except Exception as e:
            logging_service.error(
                "Error setting value in cache",
                extra={"error": str(e)}
            )
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            return await self.redis.delete(key)
        except Exception as e:
            logging_service.error(
                "Error deleting value from cache",
                extra={"error": str(e)}
            )
            return False
    
    async def invalidate_by_tag(self, tag: str) -> bool:
        """Invalidate all cache entries with a specific tag"""
        try:
            pattern = f"tags:*"
            keys = await self.redis.keys(pattern)
            
            for key in keys:
                tags = await self.redis.get(key)
                if tags:
                    tags = json.loads(tags)
                    if tag in tags:
                        # Delete the tagged key
                        cache_key = key.replace("tags:", "")
                        await self.redis.delete(cache_key)
                        await self.redis.delete(key)
            
            return True
        except Exception as e:
            logging_service.error(
                "Error invalidating cache by tag",
                extra={"error": str(e)}
            )
            return False
    
    async def get_or_set(
        self,
        key: str,
        getter_func,
        ttl: Optional[int] = None,
        tags: Optional[list] = None
    ) -> Any:
        """Get value from cache or set it using the getter function"""
        value = await self.get(key)
        if value is not None:
            return value
        
        value = await getter_func()
        await self.set(key, value, ttl, tags)
        return value
    
    async def clear_pattern(self, pattern: str) -> bool:
        """Clear all cache entries matching a pattern"""
        try:
            return await self.redis.clear_pattern(pattern)
        except Exception as e:
            logging_service.error("Error clearing cache pattern", extra={"error": str(e)})
            return False
    
    async def get_many(self, keys: list) -> dict:
        """Get multiple values from cache"""
        try:
            values = {}
            for key in keys:
                value = await self.get(key)
                if value is not None:
                    values[key] = value
            return values
        except Exception as e:
            logging_service.error("Error getting multiple values from cache", extra={"error": str(e)})
            return {}
    
    async def set_many(
        self,
        items: dict,
        ttl: Optional[int] = None,
        tags: Optional[list] = None
    ) -> bool:
        """Set multiple values in cache"""
        try:
            success = True
            for key, value in items.items():
                if not await self.set(key, value, ttl, tags):
                    success = False
                    break
            return success
        except Exception as e:
            logging_service.error("Error setting multiple values in cache", extra={"error": str(e)})
            return False
    
    async def delete_many(self, keys: list) -> bool:
        """Delete multiple values from cache"""
        try:
            success = True
            for key in keys:
                if not await self.delete(key):
                    success = False
                    break
            return success
        except Exception as e:
            logging_service.error("Error deleting multiple values from cache", extra={"error": str(e)})
            return False

# Create global instance
cache_service = CacheService() 