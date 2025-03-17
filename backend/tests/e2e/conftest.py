"""
Configuration and fixtures for E2E tests.
"""

import pytest
import asyncio
import docker
import time
import aioredis
import asyncpg
from typing import AsyncGenerator, Generator
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from backend.main import app
from backend.config import Settings, get_settings
from backend.database import Base
from backend.security import create_access_token

# Test database configuration
TEST_POSTGRES_DB = "test_assignmentai_e2e"
TEST_POSTGRES_USER = "test_user"
TEST_POSTGRES_PASSWORD = "test_password"
TEST_POSTGRES_PORT = 5433  # Different from default to avoid conflicts

# Test Redis configuration
TEST_REDIS_PORT = 6380  # Different from default to avoid conflicts

class TestSettings(Settings):
    """Test settings that use real services."""
    DATABASE_URL: str = f"postgresql+asyncpg://{TEST_POSTGRES_USER}:{TEST_POSTGRES_PASSWORD}@localhost:{TEST_POSTGRES_PORT}/{TEST_POSTGRES_DB}"
    REDIS_URL: str = f"redis://localhost:{TEST_REDIS_PORT}/0"
    TESTING: bool = True

@pytest.fixture(scope="session")
def docker_client():
    """Create Docker client for managing test containers."""
    return docker.from_env()

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def setup_test_containers(docker_client):
    """Setup PostgreSQL and Redis containers for E2E testing."""
    # Start PostgreSQL container
    postgres_container = docker_client.containers.run(
        "postgres:14",
        environment={
            "POSTGRES_DB": TEST_POSTGRES_DB,
            "POSTGRES_USER": TEST_POSTGRES_USER,
            "POSTGRES_PASSWORD": TEST_POSTGRES_PASSWORD
        },
        ports={f"5432/tcp": TEST_POSTGRES_PORT},
        detach=True,
        remove=True
    )

    # Start Redis container
    redis_container = docker_client.containers.run(
        "redis:6",
        ports={f"6379/tcp": TEST_REDIS_PORT},
        detach=True,
        remove=True
    )

    # Wait for services to be ready
    await wait_for_postgres()
    await wait_for_redis()

    yield

    # Cleanup
    postgres_container.stop()
    redis_container.stop()

async def wait_for_postgres(timeout: int = 30):
    """Wait for PostgreSQL to be ready."""
    start_time = time.time()
    while True:
        try:
            conn = await asyncpg.connect(
                database=TEST_POSTGRES_DB,
                user=TEST_POSTGRES_USER,
                password=TEST_POSTGRES_PASSWORD,
                host="localhost",
                port=TEST_POSTGRES_PORT
            )
            await conn.close()
            return
        except Exception:
            if time.time() - start_time > timeout:
                raise TimeoutError("PostgreSQL did not start in time")
            await asyncio.sleep(1)

async def wait_for_redis(timeout: int = 30):
    """Wait for Redis to be ready."""
    start_time = time.time()
    while True:
        try:
            redis = aioredis.from_url(f"redis://localhost:{TEST_REDIS_PORT}")
            await redis.ping()
            await redis.close()
            return
        except Exception:
            if time.time() - start_time > timeout:
                raise TimeoutError("Redis did not start in time")
            await asyncio.sleep(1)

@pytest.fixture
def test_settings():
    """Provide test settings."""
    return TestSettings()

@pytest.fixture
async def db_engine(test_settings):
    """Create database engine for tests."""
    engine = create_async_engine(
        test_settings.DATABASE_URL,
        echo=True,
        future=True
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async_session = sessionmaker(
        db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def redis_client(test_settings):
    """Get Redis client."""
    redis = aioredis.from_url(test_settings.REDIS_URL)
    await redis.flushdb()  # Clear test database
    yield redis
    await redis.flushdb()
    await redis.close()

@pytest.fixture
def test_client(test_settings) -> Generator:
    """Get test client with real service connections."""
    with TestClient(app) as client:
        yield client

@pytest.fixture
async def auth_token(test_settings):
    """Create authentication token for tests."""
    return create_access_token(
        data={"sub": "test@example.com", "scopes": ["teacher"]},
        expires_delta=None
    )

@pytest.fixture
async def auth_headers(auth_token):
    """Get authentication headers."""
    return {"Authorization": f"Bearer {auth_token}"} 