import os
import redis
import logging
from typing import Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# In-memory fallback for development when Redis is not available
class InMemoryCache:
    """Simple in-memory cache fallback for development"""
    def __init__(self):
        self._cache = {}
        self._expiry = {}
        logger.warning("Using in-memory cache fallback - Redis not available")
    
    def setex(self, name: str, time: int, value: str) -> bool:
        """Set a key with expiry time in seconds"""
        self._cache[name] = value
        self._expiry[name] = datetime.utcnow() + timedelta(seconds=time)
        return True
    
    def get(self, name: str) -> Optional[str]:
        """Get a key value"""
        # Clean up expired keys
        if name in self._expiry:
            if datetime.utcnow() > self._expiry[name]:
                self.delete(name)
                return None
        return self._cache.get(name)
    
    def delete(self, name: str) -> int:
        """Delete a key"""
        if name in self._cache:
            del self._cache[name]
        if name in self._expiry:
            del self._expiry[name]
        return 1
        
    def ping(self) -> bool:
        """Ping check"""
        return True

# Try to connect to Redis, fall back to in-memory cache if unavailable
try:
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    # Test the connection
    redis_client.ping()
    logger.info("Successfully connected to Redis")
except (redis.ConnectionError, redis.RedisError) as e:
    logger.warning(f"Redis connection failed: {e}. Using in-memory cache fallback for development.")
    redis_client = InMemoryCache() 