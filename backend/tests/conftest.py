from datetime import timedelta
import datetime
import pytest
from fastapi.testclient import TestClient
import asyncio
import os
import sys

import redis

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from config import Settings, get_settings, settings
from security import SecurityConfig, SecurityManager, create_access_token, create_encryption_key

def get_test_settings() -> Settings:
    """Get test settings."""
    return Settings(
        DATABASE_URL="sqlite+aiosqlite:///./test.db",
        DB_POOL_SIZE=5,
        DB_MAX_OVERFLOW=10,
        DB_POOL_TIMEOUT=30,
        DB_ECHO_SQL=True,
        REDIS_URL="redis://localhost:6379/1",  # Use different DB for tests
        DEBUG=True
    )

@pytest.fixture
def test_app():
    """Test app fixture."""
    return app

@pytest.fixture
def client(test_app):
    """Test client fixture."""
    return TestClient(test_app)

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def security_config():
    """Security config fixture."""
    return SecurityConfig(
        secret_key=create_encryption_key(),
        algorithm="HS256",
        access_token_expire_minutes=30,
        refresh_token_expire_days=7,
        password_min_length=8,
        max_login_attempts=5,
        lockout_duration_minutes=30
    )

@pytest.fixture
def security_manager(security_config):
    """Security manager fixture."""
    return SecurityManager(security_config)

@pytest.fixture(autouse=True)
def override_settings(monkeypatch):
    """Override settings for tests."""
    test_settings = get_test_settings()
    monkeypatch.setattr("config.get_settings", lambda: test_settings)
    return test_settings

# Mock Redis fixture
@pytest.fixture
async def mock_redis():
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_TEST_DB,
        decode_responses=True
    )
    await redis_client.flushdb()  # Clear test database
    yield redis_client
    await redis_client.flushdb()
    await redis_client.close()

# Test user token fixture
@pytest.fixture
def test_user_token():
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={"sub": "testuser", "scopes": ["teacher"]},
        expires_delta=access_token_expires
    )

# Mock assignment data fixture
@pytest.fixture
def test_assignment_data():
    return {
        "subject": "mathematics",
        "grade_level": "high_school",
        "assignment_text": "Test assignment for unit tests",
        "additional_requirements": ["requirement 1", "requirement 2"]
    }

# Mock task result fixture
@pytest.fixture
def mock_task_result():
    return {
        "id": "test-task-id",
        "status": "completed",
        "result": {
            "assignment": "Generated test assignment",
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "model_version": "test-1.0"
            }
        }
    } 