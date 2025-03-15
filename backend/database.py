from fastapi import logger
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import event, text
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import time
from prometheus_client import Histogram
from config import settings

# Create declarative base
Base = declarative_base()

# Performance metrics
DB_LATENCY = Histogram(
    'database_operation_duration_seconds',
    'Database operation latency',
    ['operation']
)

# Connection pool configuration
POOL_CONFIG = {
    'pool_size': settings.DB_POOL_SIZE,
    'max_overflow': settings.DB_MAX_OVERFLOW,
    'pool_timeout': settings.DB_POOL_TIMEOUT,
    'pool_recycle': 3600,  # Recycle connections after 1 hour
    'pool_pre_ping': True  # Enable connection health checks
}

# Create async engine with optimized pool settings
engine = create_async_engine(
    settings.DATABASE_URL,
    **POOL_CONFIG,
    echo=settings.DB_ECHO_SQL
)

# Create session factory with performance monitoring
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session with performance monitoring"""
    session = async_session()
    start_time = time.time()
    try:
        yield session
        await session.commit()
    except Exception as e:
        await session.rollback()
        raise
    finally:
        elapsed = time.time() - start_time
        DB_LATENCY.labels(operation='session').observe(elapsed)
        await session.close()

# Query optimization functions
async def optimize_query(session: AsyncSession, query: str) -> str:
    """Optimize SQL query using EXPLAIN ANALYZE"""
    try:
        result = await session.execute(
            text(f"EXPLAIN ANALYZE {query}")
        )
        plan = result.scalar()
        
        # Log query plan for monitoring
        logger.debug(f"Query plan: {plan}")
        
        return query
    except Exception as e:
        logger.error(f"Query optimization failed: {str(e)}")
        return query

async def create_indexes() -> None:
    """Create optimized indexes for common queries"""
    async with engine.begin() as conn:
        # Assignments table indexes
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_assignments_status 
            ON assignments(status, created_at DESC);
            
            CREATE INDEX IF NOT EXISTS idx_assignments_user 
            ON assignments(user_id, created_at DESC);
            
            CREATE INDEX IF NOT EXISTS idx_assignments_subject 
            ON assignments(subject, grade_level);
        """))
        
        # Users table indexes
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_email 
            ON users(email);
            
            CREATE INDEX IF NOT EXISTS idx_users_role 
            ON users(role);
        """))

# Connection pool monitoring
@event.listens_for(engine.sync_engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    connection_record.info['checkout_time'] = time.time()

@event.listens_for(engine.sync_engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    checkout_time = connection_record.info.get('checkout_time')
    if checkout_time is not None:
        elapsed = time.time() - checkout_time
        DB_LATENCY.labels(operation='connection').observe(elapsed)

# Database health check
async def check_database_health() -> bool:
    """Check database connectivity and performance"""
    try:
        start_time = time.time()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            elapsed = time.time() - start_time
            DB_LATENCY.labels(operation='health_check').observe(elapsed)
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False 