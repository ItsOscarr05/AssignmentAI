from typing import Any, Optional, Union, Dict, List
import json
from redis import asyncio as aioredis
import pickle
from datetime import timedelta, datetime
import logging
from functools import wraps
from config import settings
import asyncio
from enum import Enum
import orjson
import zlib
from prometheus_client import Counter, Histogram

logger = logging.getLogger(__name__)

class CacheLevel(Enum):
    L1 = "memory"
    L2 = "disk"
    L3 = "redis"

class CacheMetrics:
    def __init__(self):
        self.hits = {level: 0 for level in CacheLevel}
        self.misses = {level: 0 for level in CacheLevel}
        self.latency = {level: 0.0 for level in CacheLevel}
        
        # Prometheus metrics
        self.cache_hits = Counter(
            'cache_hits_total',
            'Number of cache hits',
            ['level']
        )
        self.cache_misses = Counter(
            'cache_misses_total',
            'Number of cache misses',
            ['level']
        )
        self.cache_latency = Histogram(
            'cache_operation_duration_seconds',
            'Cache operation latency',
            ['level', 'operation']
        )

class CacheItem:
    def __init__(self, value: Any, ttl: int = 3600):
        self.value = value
        self.created_at = datetime.now()
        self.last_accessed = datetime.now()
        self.access_count = 1
        self.ttl = ttl
        self.is_stale = False
        
    @property
    def age(self) -> float:
        return (datetime.now() - self.created_at).total_seconds()
        
    @property
    def is_expired(self) -> bool:
        return self.age > self.ttl
        
    @property
    def is_near_expiry(self) -> bool:
        return self.age > (self.ttl * 0.8)  # 80% of TTL

class RedisCache:
    def __init__(self):
        self._redis = None
        self._connected = False

    async def connect(self):
        if not self._connected:
            try:
                redis_url = settings.REDIS_URL or f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}"
                self._redis = aioredis.Redis.from_url(
                    redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    password=settings.REDIS_PASSWORD
                )
                self._connected = True
                logger.info("Successfully connected to Redis")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {str(e)}")
                raise

    async def disconnect(self):
        if self._connected and self._redis:
            await self._redis.close()
            self._connected = False

    async def get(self, key: str) -> Optional[Any]:
        if not self._connected:
            await self.connect()
        
        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting key {key} from Redis: {str(e)}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[Union[int, timedelta]] = None
    ):
        if not self._connected:
            await self.connect()
        
        try:
            serialized = json.dumps(value)
            await self._redis.set(key, serialized, ex=expire)
        except Exception as e:
            logger.error(f"Error setting key {key} in Redis: {str(e)}")

    async def delete(self, key: str):
        if not self._connected:
            await self.connect()
        
        try:
            await self._redis.delete(key)
        except Exception as e:
            logger.error(f"Error deleting key {key} from Redis: {str(e)}")

    async def exists(self, key: str) -> bool:
        if not self._connected:
            await self.connect()
        
        try:
            return await self._redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking existence of key {key} in Redis: {str(e)}")
            return False

class BinaryRedisCache(RedisCache):
    """Redis cache for binary data (e.g., document content)"""
    
    async def connect(self):
        if not self._connected:
            try:
                redis_url = settings.REDIS_URL or f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}"
                self._redis = aioredis.Redis.from_url(
                    redis_url,
                    encoding=None,  # Binary mode
                    decode_responses=False,
                    password=settings.REDIS_PASSWORD
                )
                self._connected = True
                logger.info("Successfully connected to Binary Redis")
            except Exception as e:
                logger.error(f"Failed to connect to Binary Redis: {str(e)}")
                raise

    async def get(self, key: str) -> Optional[Any]:
        if not self._connected:
            await self.connect()
        
        try:
            value = await self._redis.get(key)
            if value:
                return pickle.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting binary key {key} from Redis: {str(e)}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[Union[int, timedelta]] = None
    ):
        if not self._connected:
            await self.connect()
        
        try:
            serialized = pickle.dumps(value)
            await self._redis.set(key, serialized, ex=expire)
        except Exception as e:
            logger.error(f"Error setting binary key {key} in Redis: {str(e)}")

class HierarchicalCache:
    def __init__(self, redis_client, compression_level: int = 6):
        self.redis = redis_client
        self.compression_level = compression_level
        self.items: Dict[CacheLevel, Dict[str, CacheItem]] = {
            level: {} for level in CacheLevel
        }
        self.metrics = CacheMetrics()
        self.refresh_lock = asyncio.Lock()
        
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache with hierarchical fallback and background refresh"""
        try:
            start_time = datetime.now()
            
            # Try L1 (Memory) cache first
            value = await self._get_from_l1(key)
            if value is not None:
                self.metrics.hits[CacheLevel.L1] += 1
                self.metrics.cache_hits.labels(level='l1').inc()
                
                # Background refresh if near expiry
                item = self.items[CacheLevel.L1][key]
                if item.is_near_expiry and not item.is_stale:
                    item.is_stale = True
                    asyncio.create_task(self._refresh_cache(key))
                    
                return value
                
            self.metrics.misses[CacheLevel.L1] += 1
            self.metrics.cache_misses.labels(level='l1').inc()
            
            # Try L2 (Local disk) cache
            value = await self._get_from_l2(key)
            if value is not None:
                self.metrics.hits[CacheLevel.L2] += 1
                self.metrics.cache_hits.labels(level='l2').inc()
                await self._promote_to_l1(key, value)
                return value
                
            self.metrics.misses[CacheLevel.L2] += 1
            self.metrics.cache_misses.labels(level='l2').inc()
            
            # Try L3 (Redis) cache
            value = await self._get_from_l3(key)
            if value is not None:
                self.metrics.hits[CacheLevel.L3] += 1
                self.metrics.cache_hits.labels(level='l3').inc()
                await self._promote_to_l2(key, value)
                return value
                
            self.metrics.misses[CacheLevel.L3] += 1
            self.metrics.cache_misses.labels(level='l3').inc()
            
            return None
            
        finally:
            elapsed = (datetime.now() - start_time).total_seconds()
            for level in CacheLevel:
                self.metrics.latency[level] = elapsed
                self.metrics.cache_latency.labels(
                    level=level.value,
                    operation='get'
                ).observe(elapsed)

    async def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        """Set value in cache with compression and optimal level placement"""
        try:
            start_time = datetime.now()
            
            # Create cache item
            item = CacheItem(value, ttl)
            
            # Determine optimal cache level
            level = self._determine_optimal_level(key, item)
            
            # Compress if needed
            if level in (CacheLevel.L2, CacheLevel.L3):
                compressed = self._compress_value(value)
                item.value = compressed
            
            # Store in cache
            self.items[level][key] = item
            
            # If storing in Redis, also store compressed value
            if level == CacheLevel.L3:
                await self.redis.set(key, item.value, ex=ttl)
                
        finally:
            elapsed = (datetime.now() - start_time).total_seconds()
            self.metrics.cache_latency.labels(
                level=level.value,
                operation='set'
            ).observe(elapsed)

    async def _refresh_cache(self, key: str) -> None:
        """Background refresh of cache value"""
        async with self.refresh_lock:
            # Only refresh if still stale
            item = self.items[CacheLevel.L1].get(key)
            if item and item.is_stale:
                # Fetch fresh value (implement in subclass)
                fresh_value = await self._fetch_fresh_value(key)
                if fresh_value is not None:
                    await self.set(key, fresh_value, item.ttl)
                item.is_stale = False

    def _compress_value(self, value: Any) -> bytes:
        """Compress value using zlib"""
        serialized = orjson.dumps(value)
        return zlib.compress(serialized, self.compression_level)

    def _decompress_value(self, compressed: bytes) -> Any:
        """Decompress value using zlib"""
        decompressed = zlib.decompress(compressed)
        return orjson.loads(decompressed)

    async def warm_cache(self, keys: List[str]) -> None:
        """Pre-warm cache with frequently accessed keys"""
        await asyncio.gather(*[
            self._fetch_and_cache(key) for key in keys
        ])

    async def _fetch_and_cache(self, key: str) -> None:
        """Fetch value and store in cache"""
        value = await self._fetch_fresh_value(key)
        if value is not None:
            await self.set(key, value)

    async def _fetch_fresh_value(self, key: str) -> Optional[Any]:
        """Fetch fresh value for key (implement in subclass)"""
        raise NotImplementedError()

def cache_response(expire: int = 300):
    """Decorator for caching API responses"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = RedisCache()
            
            # Generate cache key from function name and arguments
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached = await cache.get(key)
            if cached is not None:
                return cached
            
            # If not in cache, execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            await cache.set(key, result, expire)
            
            return result
        return wrapper
    return decorator

# Initialize cache instances
cache = RedisCache()
binary_cache = BinaryRedisCache() 