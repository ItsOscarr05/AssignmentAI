"""
Connection pool management for database connections.
"""

from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.pool import AsyncAdaptedQueuePool
from prometheus_client import Gauge
from typing import Optional
from .base import engine

# Metrics for pool monitoring
POOL_SIZE = Gauge('db_pool_size', 'Current database pool size')

class ConnectionPool:
    """Manages database connection pooling with metrics."""
    
    def __init__(self, engine: AsyncEngine):
        self.engine = engine
        self.pool = engine.pool
        if not isinstance(self.pool, AsyncAdaptedQueuePool):
            raise ValueError("Engine must use AsyncAdaptedQueuePool")
        
        # Initialize metrics
        self._update_metrics()
    
    def _update_metrics(self) -> None:
        """Update pool metrics."""
        POOL_SIZE.set(self.pool.size())
    
    async def get_stats(self) -> dict:
        """Get current pool statistics."""
        return {
            'size': self.pool.size()
        }
    
    async def resize(self, new_size: int) -> None:
        """Resize the connection pool."""
        if new_size < 1:
            raise ValueError("Pool size must be positive")
        
        self.pool._pool.maxsize = new_size
        self._update_metrics()
    
    async def clear(self) -> None:
        """Clear all connections in the pool."""
        await self.pool._do_clear()
        self._update_metrics()

# Global pool instance
pool = ConnectionPool(engine) 