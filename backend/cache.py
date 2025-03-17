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
import msgpack

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

    async def _get_from_l1(self, key: str) -> Optional[Any]:
        """Get value from L1 (Memory) cache"""
        if key in self.items[CacheLevel.L1]:
            item = self.items[CacheLevel.L1][key]
            if not item.is_expired:
                return item.value
            await self._evict(key, CacheLevel.L1)
        return None
        
    async def _get_from_l2(self, key: str) -> Optional[Any]:
        """Get value from L2 (Disk) cache"""
        if key in self.items[CacheLevel.L2]:
            item = self.items[CacheLevel.L2][key]
            if not item.is_expired:
                return self._decompress_value(item.value)
            await self._evict(key, CacheLevel.L2)
        return None
        
    async def _get_from_l3(self, key: str) -> Optional[Any]:
        """Get value from L3 (Redis) cache"""
        try:
            value = await self.redis.get(key)
            if value:
                return self._decompress_value(value)
        except Exception as e:
            logger.error(f"Error getting key {key} from Redis: {str(e)}")
        return None
        
    async def _promote_to_l1(self, key: str, value: Any) -> None:
        """Promote value to L1 cache"""
        item = CacheItem(value)
        self.items[CacheLevel.L1][key] = item
        
    async def _promote_to_l2(self, key: str, value: Any) -> None:
        """Promote value to L2 cache"""
        compressed = self._compress_value(value)
        item = CacheItem(compressed)
        self.items[CacheLevel.L2][key] = item
        
    async def _evict(self, key: str, level: CacheLevel) -> None:
        """Evict item from specified cache level"""
        if key in self.items[level]:
            del self.items[level][key]
            
    def _determine_optimal_level(self, key: str, item: CacheItem) -> CacheLevel:
        """Determine optimal cache level for item"""
        # Simple strategy: large items go to lower levels
        try:
            size = len(orjson.dumps(item.value))
            if size < 1024:  # < 1KB
                return CacheLevel.L1
            elif size < 1024 * 1024:  # < 1MB
                return CacheLevel.L2
            return CacheLevel.L3
        except Exception:
            return CacheLevel.L1  # Default to L1 if size cannot be determined

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

class MultiLevelCache:
    def __init__(self):
        self._local_cache: Dict[str, Any] = {}
        self._redis: Optional[aioredis.Redis] = None
        self._binary_redis: Optional[aioredis.Redis] = None
        self._local_cache_size = settings.LOCAL_CACHE_SIZE
        self._local_ttl = settings.LOCAL_CACHE_TTL
        self._last_cleanup = datetime.now()
        self._cleanup_interval = 300  # 5 minutes

    async def connect(self):
        """Initialize Redis connections with optimized settings"""
        try:
            # Main Redis for small data
            self._redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding='utf-8',
                decode_responses=True,
                socket_timeout=1.0,
                socket_connect_timeout=1.0,
                retry_on_timeout=True,
                health_check_interval=30,
                max_connections=settings.REDIS_MAX_CONNECTIONS
            )

            # Binary Redis for large objects
            self._binary_redis = await aioredis.from_url(
                settings.BINARY_REDIS_URL,
                encoding=None,
                decode_responses=False,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
                retry_on_timeout=True,
                health_check_interval=30,
                max_connections=settings.REDIS_MAX_CONNECTIONS
            )

            # Start background tasks
            asyncio.create_task(self._periodic_cleanup())
            asyncio.create_task(self._monitor_cache())

            logger.info("Cache connections established")
        except Exception as e:
            logger.error(f"Failed to initialize cache connections: {str(e)}")
            raise

    async def get(self, key: str, use_local: bool = True) -> Optional[Any]:
        """Get value from cache with multi-level lookup"""
        start_time = asyncio.get_event_loop().time()
        try:
            # Check local cache first
            if use_local:
                if value := self._local_cache.get(key):
                    CACHE_HITS.labels(cache_type='local').inc()
                    return value

            # Check Redis
            value = await self._redis.get(key)
            if value is not None:
                CACHE_HITS.labels(cache_type='redis').inc()
                if use_local:
                    self._local_cache[key] = value
                return value

            CACHE_MISSES.labels(cache_type='all').inc()
            return None
        except Exception as e:
            CACHE_ERRORS.labels(cache_type='all').inc()
            logger.error(f"Cache get error: {str(e)}")
            return None
        finally:
            duration = asyncio.get_event_loop().time() - start_time
            CACHE_OPERATION_DURATION.labels(
                operation='get',
                cache_type='all'
            ).observe(duration)

    async def set(
        self,
        key: str,
        value: Any,
        expire: int = 3600,
        use_local: bool = True
    ) -> bool:
        """Set value in cache with optional local caching"""
        start_time = asyncio.get_event_loop().time()
        try:
            # Set in Redis
            await self._redis.set(key, value, ex=expire)
            
            # Update local cache if enabled
            if use_local:
                self._local_cache[key] = value
                
            return True
        except Exception as e:
            CACHE_ERRORS.labels(cache_type='all').inc()
            logger.error(f"Cache set error: {str(e)}")
            return False
        finally:
            duration = asyncio.get_event_loop().time() - start_time
            CACHE_OPERATION_DURATION.labels(
                operation='set',
                cache_type='all'
            ).observe(duration)

    async def set_binary(self, key: str, value: bytes, expire: int = 3600) -> bool:
        """Store binary data in separate Redis instance"""
        start_time = asyncio.get_event_loop().time()
        try:
            compressed = msgpack.packb(value)
            await self._binary_redis.set(key, compressed, ex=expire)
            return True
        except Exception as e:
            CACHE_ERRORS.labels(cache_type='binary').inc()
            logger.error(f"Binary cache set error: {str(e)}")
            return False
        finally:
            duration = asyncio.get_event_loop().time() - start_time
            CACHE_OPERATION_DURATION.labels(
                operation='set_binary',
                cache_type='binary'
            ).observe(duration)

    async def get_binary(self, key: str) -> Optional[bytes]:
        """Retrieve binary data from separate Redis instance"""
        start_time = asyncio.get_event_loop().time()
        try:
            data = await self._binary_redis.get(key)
            if data is None:
                CACHE_MISSES.labels(cache_type='binary').inc()
                return None
            
            CACHE_HITS.labels(cache_type='binary').inc()
            return msgpack.unpackb(data)
        except Exception as e:
            CACHE_ERRORS.labels(cache_type='binary').inc()
            logger.error(f"Binary cache get error: {str(e)}")
            return None
        finally:
            duration = asyncio.get_event_loop().time() - start_time
            CACHE_OPERATION_DURATION.labels(
                operation='get_binary',
                cache_type='binary'
            ).observe(duration)

    async def delete(self, key: str, use_local: bool = True) -> bool:
        """Delete value from all cache levels"""
        try:
            # Remove from Redis
            await self._redis.delete(key)
            
            # Remove from local cache if enabled
            if use_local and key in self._local_cache:
                del self._local_cache[key]
            
            return True
        except Exception as e:
            CACHE_ERRORS.labels(cache_type='all').inc()
            logger.error(f"Cache delete error: {str(e)}")
            return False

    async def _periodic_cleanup(self):
        """Periodically clean up local cache"""
        while True:
            await asyncio.sleep(self._cleanup_interval)
            try:
                # Remove oldest entries if cache is too large
                while len(self._local_cache) > self._local_cache_size:
                    self._local_cache.pop(next(iter(self._local_cache)))
                
                # Clear expired entries
                now = datetime.now()
                expired = [
                    k for k, v in self._local_cache.items()
                    if (now - self._last_cleanup).total_seconds() > self._local_ttl
                ]
                for key in expired:
                    del self._local_cache[key]
                
                self._last_cleanup = now
            except Exception as e:
                logger.error(f"Cache cleanup error: {str(e)}")

    async def _monitor_cache(self):
        """Monitor cache statistics"""
        while True:
            await asyncio.sleep(60)
            try:
                # Log cache statistics
                logger.info(
                    f"Cache stats - Local: {len(self._local_cache)} items, "
                    f"Redis: {await self._redis.dbsize()} keys, "
                    f"Binary: {await self._binary_redis.dbsize()} keys"
                )
            except Exception as e:
                logger.error(f"Cache monitoring error: {str(e)}")

    async def flush(self):
        """Clear all caches"""
        try:
            self._local_cache.clear()
            await self._redis.flushdb()
            await self._binary_redis.flushdb()
            return True
        except Exception as e:
            logger.error(f"Cache flush error: {str(e)}")
            return False

    async def check_health(self) -> bool:
        """Check health of cache connections"""
        try:
            await self._redis.ping()
            await self._binary_redis.ping()
            return True
        except Exception:
            return False

    async def disconnect(self):
        """Close Redis connections"""
        try:
            if self._redis:
                await self._redis.close()
            if self._binary_redis:
                await self._binary_redis.close()
            logger.info("Cache connections closed")
        except Exception as e:
            logger.error(f"Error closing cache connections: {str(e)}")

# Global cache instances
cache = MultiLevelCache()
binary_cache = MultiLevelCache()  # Separate instance for binary data 