from typing import Any, Dict, Optional, List, Set, Union
import asyncio
from datetime import datetime, timedelta
import json
from redis.asyncio import Redis
from functools import wraps
import hashlib
from collections import defaultdict
import logging
from dataclasses import dataclass, field
from prometheus_client import Counter, Histogram

from backend.config import settings
from backend.exceptions import CacheError

logger = logging.getLogger(__name__)

# Prometheus metrics
CACHE_HITS = Counter('cache_hits_total', 'Number of cache hits', ['cache_type'])
CACHE_MISSES = Counter('cache_misses_total', 'Number of cache misses', ['cache_type'])
CACHE_ERRORS = Counter('cache_errors_total', 'Number of cache errors', ['cache_type'])
CACHE_OPERATION_DURATION = Histogram(
    'cache_operation_duration_seconds',
    'Duration of cache operations',
    ['operation', 'cache_type']
)

class CacheLevel:
    """Cache levels for the multi-level cache system."""
    L1 = "l1"  # Memory cache
    L2 = "l2"  # Redis cache
    L3 = "l3"  # Distributed cache

@dataclass
class CacheItem:
    """Represents a cached item with metadata."""
    data: Any
    expires_at: datetime
    access_count: int = 0
    last_access: datetime = field(default_factory=datetime.now)
    access_pattern: List[datetime] = field(default_factory=list)

    def is_expired(self) -> bool:
        """Check if the cache item has expired."""
        return datetime.now() > self.expires_at

    def update_access(self) -> None:
        """Update access metadata for the cache item."""
        self.access_count += 1
        self.last_access = datetime.now()
        self.access_pattern.append(self.last_access)

class MultiLevelCache:
    """Multi-level caching system with memory and Redis backends."""
    
    def __init__(self):
        """Initialize the multi-level cache."""
        self._memory_cache: Dict[str, CacheItem] = {}
        self._redis_client: Optional[Redis] = None
        self._cache_stats = defaultdict(lambda: {"hits": 0, "misses": 0})
        self._last_cleanup = datetime.now()
        self._cleanup_interval = 300  # 5 minutes
        self._max_memory_items = settings.CACHE_MAX_MEMORY_ITEMS
        self._initialized = False
        
    async def initialize(self) -> None:
        """Initialize Redis connection and start background tasks."""
        if self._initialized:
            return
            
        try:
            self._redis_client = Redis.from_url(
                settings.REDIS_URL,
                encoding='utf-8',
                decode_responses=True,
                socket_timeout=1.0,
                socket_connect_timeout=1.0,
                retry_on_timeout=True,
                health_check_interval=30
            )
            await self._redis_client.ping()
            
            # Start background tasks
            asyncio.create_task(self._periodic_cleanup())
            asyncio.create_task(self._monitor_cache())
            
            self._initialized = True
            logger.info("Cache system initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize cache: {str(e)}")
            raise CacheError(f"Cache initialization failed: {str(e)}")

    async def get(self, key: str, level: str = CacheLevel.L1) -> Optional[Any]:
        """
        Get value from cache with specified level.
        
        Args:
            key: Cache key
            level: Cache level to query (L1, L2, or L3)
            
        Returns:
            Cached value if found, None otherwise
        """
        if not self._initialized:
            await self.initialize()
            
        start_time = asyncio.get_event_loop().time()
        try:
            # Try memory cache first
            if level == CacheLevel.L1 and key in self._memory_cache:
                item = self._memory_cache[key]
                if not item.is_expired():
                    item.update_access()
                    CACHE_HITS.labels(cache_type='memory').inc()
                    return item.data
                else:
                    await self._evict(key)

            # Try Redis cache
            if level in [CacheLevel.L1, CacheLevel.L2]:
                redis_value = await self._redis_client.get(key)
                if redis_value:
                    CACHE_HITS.labels(cache_type='redis').inc()
                    try:
                        decoded_value = json.loads(redis_value)
                        if level == CacheLevel.L1:
                            await self.set(key, decoded_value)
                        return decoded_value
                    except json.JSONDecodeError:
                        logger.error(f"Failed to decode cache value for key: {key}")
                        await self._redis_client.delete(key)

            CACHE_MISSES.labels(cache_type=level).inc()
            return None
            
        except Exception as e:
            CACHE_ERRORS.labels(cache_type=level).inc()
            logger.error(f"Cache get error: {str(e)}")
            return None
            
        finally:
            duration = asyncio.get_event_loop().time() - start_time
            CACHE_OPERATION_DURATION.labels(
                operation='get',
                cache_type=level
            ).observe(duration)

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = 3600,
        level: str = CacheLevel.L1
    ) -> None:
        """
        Set value in cache with specified level.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            level: Cache level to set
        """
        if not self._initialized:
            await self.initialize()
            
        start_time = asyncio.get_event_loop().time()
        try:
            expires_at = datetime.now() + timedelta(seconds=ttl)
            cache_item = CacheItem(
                data=value,
                expires_at=expires_at,
                access_count=1,
                last_access=datetime.now(),
                access_pattern=[datetime.now()]
            )

            if level == CacheLevel.L1:
                self._memory_cache[key] = cache_item
                await self._enforce_memory_limits()

            if level in [CacheLevel.L1, CacheLevel.L2]:
                try:
                    json_value = json.dumps(value)
                    await self._redis_client.setex(key, ttl, json_value)
                except (TypeError, json.JSONEncodeError) as e:
                    logger.error(f"Failed to encode cache value: {str(e)}")
                    raise CacheError(f"Failed to encode cache value: {str(e)}")
                    
        except Exception as e:
            CACHE_ERRORS.labels(cache_type=level).inc()
            logger.error(f"Cache set error: {str(e)}")
            raise CacheError(f"Failed to set cache value: {str(e)}")
            
        finally:
            duration = asyncio.get_event_loop().time() - start_time
            CACHE_OPERATION_DURATION.labels(
                operation='set',
                cache_type=level
            ).observe(duration)

    async def delete(self, key: str, levels: Optional[List[str]] = None) -> None:
        """
        Delete value from specified cache levels.
        
        Args:
            key: Cache key to delete
            levels: List of cache levels to delete from, defaults to all levels
        """
        if not levels:
            levels = [CacheLevel.L1, CacheLevel.L2, CacheLevel.L3]
            
        try:
            if CacheLevel.L1 in levels and key in self._memory_cache:
                del self._memory_cache[key]

            if CacheLevel.L2 in levels:
                await self._redis_client.delete(key)
                
        except Exception as e:
            CACHE_ERRORS.labels(cache_type='all').inc()
            logger.error(f"Cache delete error: {str(e)}")
            raise CacheError(f"Failed to delete cache key: {str(e)}")

    async def _enforce_memory_limits(self) -> None:
        """Enforce memory cache size limits."""
        while len(self._memory_cache) > self._max_memory_items:
            # Remove least recently accessed item
            lru_key = min(
                self._memory_cache.items(),
                key=lambda x: x[1].last_access
            )[0]
            await self._evict(lru_key)

    async def _evict(self, key: str) -> None:
        """Evict a key from memory cache."""
        if key in self._memory_cache:
            del self._memory_cache[key]

    async def _periodic_cleanup(self) -> None:
        """Periodically clean up expired cache entries."""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval)
                
                # Clean up memory cache
                now = datetime.now()
                expired_keys = [
                    key for key, item in self._memory_cache.items()
                    if item.is_expired()
                ]
                for key in expired_keys:
                    await self._evict(key)
                    
                self._last_cleanup = now
                
            except Exception as e:
                logger.error(f"Cache cleanup error: {str(e)}")

    async def _monitor_cache(self) -> None:
        """Monitor cache statistics."""
        while True:
            try:
                await asyncio.sleep(60)
                memory_size = len(self._memory_cache)
                redis_size = await self._redis_client.dbsize()
                
                logger.info(
                    f"Cache stats - Memory: {memory_size} items, "
                    f"Redis: {redis_size} keys"
                )
                
            except Exception as e:
                logger.error(f"Cache monitoring error: {str(e)}")

    async def flush(self) -> None:
        """Flush all cache levels."""
        try:
            self._memory_cache.clear()
            await self._redis_client.flushdb()
        except Exception as e:
            logger.error(f"Cache flush error: {str(e)}")
            raise CacheError(f"Failed to flush cache: {str(e)}")

    async def check_health(self) -> bool:
        """Check health of cache system."""
        try:
            if not self._initialized:
                return False
            await self._redis_client.ping()
            return True
        except Exception:
            return False

    async def close(self) -> None:
        """Close cache connections."""
        try:
            if self._redis_client:
                await self._redis_client.close()
            self._initialized = False
            logger.info("Cache connections closed")
        except Exception as e:
            logger.error(f"Error closing cache connections: {str(e)}")
            raise CacheError(f"Failed to close cache connections: {str(e)}")

def cache(ttl: int = 3600, level: str = CacheLevel.L1):
    """
    Decorator for caching function results.
    
    Args:
        ttl: Time to live in seconds
        level: Cache level to use
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{func.__name__}:{hashlib.md5(str(args).encode()).hexdigest()}"
            
            # Try to get from cache
            cached_value = await cache_instance.get(key, level)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_instance.set(key, result, ttl, level)
            return result
        return wrapper
    return decorator

# Global instance
cache_instance = MultiLevelCache() 