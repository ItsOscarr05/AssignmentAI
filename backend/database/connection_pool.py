"""
Connection pool management for database connections.
"""

from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.pool import AsyncAdaptedQueuePool
from prometheus_client import Gauge, Counter, Histogram
from typing import Optional, Dict, Any
from .base import engine
from asyncpg import create_pool, Pool
import asyncio
import logging
from contextlib import asynccontextmanager
from config import settings

logger = logging.getLogger(__name__)

# Metrics
POOL_SIZE = Gauge('db_pool_size', 'Current size of the connection pool')
POOL_AVAILABLE = Gauge('db_pool_available', 'Number of available connections')
POOL_USED = Gauge('db_pool_used', 'Number of used connections')
POOL_WAIT_TIME = Histogram('db_pool_wait_seconds', 'Time spent waiting for connection')
POOL_ACQUIRE_COUNT = Counter('db_pool_acquire_total', 'Total number of connection acquisitions')
POOL_RELEASE_COUNT = Counter('db_pool_release_total', 'Total number of connection releases')

class EnhancedPool:
    def __init__(self):
        self._pool: Optional[Pool] = None
        self._min_size = settings.DB_POOL_MIN_SIZE
        self._max_size = settings.DB_POOL_MAX_SIZE
        self._timeout = settings.DB_POOL_TIMEOUT
        self._max_inactive_time = settings.DB_MAX_INACTIVE_TIME
        self._stats: Dict[str, Any] = {
            "total_connections": 0,
            "active_connections": 0,
            "idle_connections": 0,
            "waiting_queries": 0
        }
        self._last_cleanup = 0
        self._cleanup_interval = 300  # 5 minutes

    async def initialize(self):
        """Initialize the connection pool with optimized settings"""
        if self._pool is not None:
            return

        try:
            self._pool = await create_pool(
                dsn=settings.DATABASE_URL,
                min_size=self._min_size,
                max_size=self._max_size,
                command_timeout=settings.DB_COMMAND_TIMEOUT,
                max_inactive_connection_lifetime=self._max_inactive_time,
                setup=self._setup_connection,
                init=self._init_connection,
                server_settings={
                    'jit': 'off',  # Disable JIT for more predictable performance
                    'statement_timeout': str(settings.DB_STATEMENT_TIMEOUT),
                    'idle_in_transaction_session_timeout': str(settings.DB_IDLE_TIMEOUT),
                    'application_name': 'AssignmentAI'
                }
            )
            logger.info(f"Database pool initialized with size {self._min_size}-{self._max_size}")
            
            # Start background tasks
            asyncio.create_task(self._monitor_pool())
            asyncio.create_task(self._periodic_cleanup())
            
        except Exception as e:
            logger.error(f"Failed to initialize connection pool: {str(e)}")
            raise

    async def _setup_connection(self, conn):
        """Set up new connections with optimal settings"""
        await conn.execute("""
            SET SESSION synchronous_commit = 'off';
            SET SESSION tcp_keepalives_idle = 300;
            SET SESSION tcp_keepalives_interval = 10;
            SET SESSION tcp_keepalives_count = 3;
        """)

    async def _init_connection(self, conn):
        """Initialize connection with prepared statements"""
        # Prepare frequently used statements
        await conn.prepare(
            'get_assignment',
            'SELECT * FROM assignments WHERE id = $1'
        )
        await conn.prepare(
            'update_assignment_status',
            'UPDATE assignments SET status = $2 WHERE id = $1'
        )

    @asynccontextmanager
    async def acquire(self):
        """Acquire a connection from the pool with monitoring"""
        start_time = asyncio.get_event_loop().time()
        try:
            async with self._pool.acquire() as connection:
                POOL_ACQUIRE_COUNT.inc()
                self._stats["active_connections"] += 1
                try:
                    yield connection
                finally:
                    self._stats["active_connections"] -= 1
                    POOL_RELEASE_COUNT.inc()
        finally:
            wait_time = asyncio.get_event_loop().time() - start_time
            POOL_WAIT_TIME.observe(wait_time)

    @asynccontextmanager
    async def optimized_session(self):
        """Get a connection with automatic transaction management and retries"""
        retries = 3
        while retries > 0:
            try:
                async with self.acquire() as conn:
                    async with conn.transaction():
                        yield conn
                break
            except Exception as e:
                retries -= 1
                if retries == 0:
                    raise
                await asyncio.sleep(0.1)

    async def cleanup(self):
        """Clean up idle connections"""
        if self._pool is None:
            return

        try:
            await self._pool.execute("""
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE application_name = 'AssignmentAI'
                AND state = 'idle'
                AND state_change < NOW() - INTERVAL '1 hour'
            """)
        except Exception as e:
            logger.error(f"Error during connection cleanup: {str(e)}")

    async def _monitor_pool(self):
        """Monitor pool statistics"""
        while True:
            if self._pool:
                POOL_SIZE.set(len(self._pool._holders))
                POOL_AVAILABLE.set(self._pool._queue.qsize())
                POOL_USED.set(len(self._pool._holders) - self._pool._queue.qsize())
                
                self._stats.update({
                    "total_connections": len(self._pool._holders),
                    "idle_connections": self._pool._queue.qsize(),
                    "waiting_queries": self._pool._queue._getters.qsize()
                })
            
            await asyncio.sleep(5)

    async def _periodic_cleanup(self):
        """Periodically clean up idle connections"""
        while True:
            await asyncio.sleep(self._cleanup_interval)
            await self.cleanup()

    def get_pool_stats(self) -> Dict[str, Any]:
        """Get current pool statistics"""
        return self._stats

    async def close(self):
        """Close the connection pool"""
        if self._pool:
            await self._pool.close()
            self._pool = None
            logger.info("Database connection pool closed")

pool = EnhancedPool() 