from typing import Any, Optional, Union
from datetime import datetime, timedelta
import json
import redis
from app.core.config import settings
from app.core.logger import logger
from redis import asyncio as aioredis

class RedisCache:
    def __init__(self):
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            self.available = True
        except Exception:
            self.redis_client = None
            self.available = False

    def get(self, key: str) -> Optional[Any]:
        if not self.available:
            return None
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception:
            return None

    def set(
        self,
        key: str,
        value: Any,
        expire: Optional[Union[int, timedelta]] = None
    ) -> bool:
        if not self.available:
            return False
        try:
            serialized_value = json.dumps(value)
            if expire:
                self.redis_client.setex(key, expire, serialized_value)
            else:
                self.redis_client.set(key, serialized_value)
            return True
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        if not self.available:
            return False
        try:
            self.redis_client.delete(key)
            return True
        except Exception:
            return False

    def exists(self, key: str) -> bool:
        if not self.available:
            return False
        try:
            return bool(self.redis_client.exists(key))
        except Exception:
            return False

    def clear_pattern(self, pattern: str) -> bool:
        if not self.available:
            return False
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
            return True
        except Exception:
            return False

# Cache key patterns
CACHE_KEYS = {
    "assignment": "assignment:{id}",
    "feedback": "feedback:{id}",
    "ai_assignment": "ai_assignment:{id}",
    "user_assignments": "user:{user_id}:assignments",
    "user_feedback": "user:{user_id}:feedback",
    "class_assignments": "class:{class_id}:assignments"
}

# Cache durations (in seconds)
CACHE_DURATIONS = {
    "assignment": 3600,  # 1 hour
    "feedback": 3600,    # 1 hour
    "ai_assignment": 7200,  # 2 hours
    "user_assignments": 1800,  # 30 minutes
    "user_feedback": 1800,    # 30 minutes
    "class_assignments": 1800  # 30 minutes
}

# Create a singleton instance
cache = RedisCache()

async def init_cache():
    """Initialize Redis cache."""
    try:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf8",
            decode_responses=True
        )
        # Test the connection
        await redis_client.ping()
        logger.info("Redis cache initialized successfully")
    except Exception as e:
        logger.warning(f"Redis cache initialization failed: {str(e)}")
        logger.info("Continuing without Redis cache") 