import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app
from app.models.user import User
from app.models.assignment import Assignment
from app.models.file import File
from app.models.subscription import Subscription
from app.models.activity import Activity
from datetime import datetime, timedelta
from app.services.cache_service import cache_service

# Patch RedisCache globally for all tests before any app/service import
@pytest.fixture(autouse=True, scope="session")
def patch_redis_cache():
    with patch('app.core.cache.RedisCache') as MockRedisCache:
        instance = MockRedisCache.return_value
        instance.get = AsyncMock(return_value=None)
        instance.set = AsyncMock(return_value=True)
        instance.delete = AsyncMock(return_value=True)
        instance.keys = AsyncMock(return_value=[])
        instance.clear_pattern = AsyncMock(return_value=True)
        yield

client = TestClient(app)

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    return user

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def override_get_current_user(mock_user):
    app.dependency_overrides = getattr(app, 'dependency_overrides', {})
    from app.core.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides = {}

@pytest.fixture
def override_get_db(mock_db):
    app.dependency_overrides = getattr(app, 'dependency_overrides', {})
    from app.core.deps import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    yield
    app.dependency_overrides = {}

@pytest.fixture(autouse=True)
def mock_cache_service():
    """Mock the cache service to prevent Redis connection errors in tests"""
    with patch('app.services.cache_service.cache_service') as mock_cache:
        mock_cache.get = AsyncMock(return_value=None)
        mock_cache.set = AsyncMock()
        mock_cache.delete = AsyncMock()
        mock_cache.invalidate_by_tag = AsyncMock()
        mock_cache.get_or_set = AsyncMock()
        mock_cache.clear_pattern = AsyncMock()
        mock_cache.get_many = AsyncMock(return_value={})
        mock_cache.set_many = AsyncMock()
        mock_cache.delete_many = AsyncMock()
        yield mock_cache

@pytest.fixture(autouse=True, scope="module")
def patch_cache_service_methods():
    cache_service.get = AsyncMock(return_value=None)
    cache_service.set = AsyncMock(return_value=True)
    cache_service.delete = AsyncMock(return_value=True)
    cache_service.invalidate_by_tag = AsyncMock(return_value=True)
    cache_service.get_or_set = AsyncMock(return_value=None)
    cache_service.clear_pattern = AsyncMock(return_value=True)
    cache_service.get_many = AsyncMock(return_value={})
    cache_service.set_many = AsyncMock(return_value=True)
    cache_service.delete_many = AsyncMock(return_value=True)
    yield

def test_get_dashboard_stats_success(override_get_current_user, override_get_db, mock_db, mock_user):
    # Mock user id
    mock_user.id = 1
    # Mock queries and return values
    # Setup the chain for db.query().filter().count()
    mock_query = MagicMock()
    mock_db.query.return_value = mock_query
    mock_filter = MagicMock()
    mock_query.filter.return_value = mock_filter
    # total_assignments, completed_assignments, pending_assignments, total_files
    mock_filter.count.side_effect = [10, 5, 3, 7]
    # For db.query().filter().all() (files)
    mock_file = MagicMock(spec=File)
    mock_file.size = 100
    mock_file.user_id = 1
    mock_file.id = 1
    mock_filter.all.return_value = [mock_file, mock_file]
    # For db.query().filter().first() (subscription)
    mock_subscription = MagicMock(spec=Subscription)
    mock_subscription.id = 1
    mock_subscription.user_id = 1
    mock_subscription.status = "active"
    mock_filter.first.return_value = mock_subscription
    # For monthly assignments count
    # The endpoint calls db.query().filter().count() again for monthly_assignments
    # So we need to extend the side_effect
    mock_filter.count.side_effect = [10, 5, 3, 7, 0]
    with patch('app.api.v1.endpoints.dashboard.get_storage_limit', return_value=1000), \
         patch('app.api.v1.endpoints.dashboard.get_monthly_limit', return_value=20):
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert data['totalAssignments'] == 10
        assert data['completedAssignments'] == 5
        assert data['pendingAssignments'] == 3
        assert data['totalFiles'] == 7
        assert data['storageUsed'] == 200
        assert data['storageLimit'] == 1000
        assert data['monthlyUsage'] == 0 or isinstance(data['monthlyUsage'], int)
        assert data['monthlyLimit'] == 20

def test_get_dashboard_stats_error(override_get_current_user, override_get_db, mock_db):
    mock_db.query.side_effect = Exception("DB error")
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 500
    assert response.json()['detail'] == "DB error"

def test_get_recent_activity_success(override_get_current_user, override_get_db, mock_db, mock_user):
    mock_activity = MagicMock(spec=Activity)
    mock_activity.id = 1
    mock_activity.type = "login"
    mock_activity.created_at = datetime.now()
    with patch('app.api.v1.endpoints.dashboard.get_activity_title', return_value="Title"), \
         patch('app.api.v1.endpoints.dashboard.get_activity_description', return_value="Desc"):
        mock_db.query().filter().order_by().limit().all.return_value = [mock_activity]
        response = client.get("/api/v1/dashboard/activity")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert data[0]['type'] == "login"
        assert data[0]['title'] == "Title"
        assert data[0]['description'] == "Desc"

def test_get_recent_activity_error(override_get_current_user, override_get_db, mock_db):
    mock_db.query.side_effect = Exception("DB error")
    response = client.get("/api/v1/dashboard/activity")
    assert response.status_code == 500
    assert response.json()['detail'] == "DB error"

def test_get_recent_assignments_success(override_get_current_user, override_get_db, mock_db, mock_user):
    mock_assignment = MagicMock(spec=Assignment)
    mock_assignment.id = 1
    mock_assignment.title = "Test"
    mock_assignment.status = "completed"
    mock_assignment.created_at = datetime.now()
    mock_assignment.updated_at = datetime.now()
    mock_db.query().filter().order_by().limit().all.return_value = [mock_assignment]
    response = client.get("/api/v1/dashboard/assignments/recent")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]['title'] == "Test"
    assert data[0]['status'] == "completed"

def test_get_recent_assignments_error(override_get_current_user, override_get_db, mock_db):
    mock_db.query.side_effect = Exception("DB error")
    response = client.get("/api/v1/dashboard/assignments/recent")
    assert response.status_code == 500
    assert response.json()['detail'] == "DB error"

def test_get_recent_files_success(override_get_current_user, override_get_db, mock_db, mock_user):
    mock_file = MagicMock(spec=File)
    mock_file.id = 1
    mock_file.name = "file.txt"
    mock_file.size = 123
    mock_file.type = "txt"
    mock_file.created_at = datetime.now()
    mock_db.query().filter().order_by().limit().all.return_value = [mock_file]
    response = client.get("/api/v1/dashboard/files/recent")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]['name'] == "file.txt"
    assert data[0]['size'] == 123
    assert data[0]['type'] == "txt"

def test_get_recent_files_error(override_get_current_user, override_get_db, mock_db):
    mock_db.query.side_effect = Exception("DB error")
    response = client.get("/api/v1/dashboard/files/recent")
    assert response.status_code == 500
    assert response.json()['detail'] == "DB error"

def test_get_usage_analytics_success(override_get_current_user, override_get_db, mock_db, mock_user):
    mock_assignment = MagicMock(spec=Assignment)
    mock_assignment.id = 1
    mock_assignment.status = "completed"
    mock_assignment.created_at = datetime.now()
    mock_db.query().filter().all.return_value = [mock_assignment]
    response = client.get("/api/v1/dashboard/usage/analytics?period=month")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert 'daily_stats' in data
    assert isinstance(data['daily_stats'], list)
    if data['daily_stats']:
        assert data['daily_stats'][0]['assignments'] >= 1
        assert data['daily_stats'][0]['completed'] >= 1

def test_get_usage_analytics_error(override_get_current_user, override_get_db, mock_db):
    mock_db.query.side_effect = Exception("DB error")
    response = client.get("/api/v1/dashboard/usage/analytics?period=month")
    assert response.status_code == 500
    assert response.json()['detail'] == "DB error" 