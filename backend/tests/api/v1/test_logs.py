import pytest
from fastapi import status
from unittest.mock import patch, MagicMock
from app.models.log import SystemLog
from app.models.user import User
from datetime import datetime
from app.main import app
from app.core.deps import get_current_active_superuser

@pytest.fixture
def test_superuser():
    """Create a test superuser"""
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "admin@example.com"
    user.is_superuser = True
    return user

@pytest.fixture
def test_token(test_superuser):
    """Create a test token for superuser"""
    from app.core.security import create_access_token
    return create_access_token(subject=str(test_superuser.id))

@pytest.fixture(autouse=True)
def override_superuser_dependency(test_superuser):
    app.dependency_overrides[get_current_active_superuser] = lambda: test_superuser
    yield
    app.dependency_overrides.pop(get_current_active_superuser, None)

def test_read_logs_success(client, test_superuser, test_token):
    """Test successful log retrieval"""
    mock_logs = [
        {
            "id": 1,
            "level": "INFO",
            "message": "Test log message",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": 1,
            "action": "test_action",
            "details": {"test": "data"}
        }
    ]
    with patch('app.api.v1.endpoints.logs.get_logs', new=MagicMock(return_value=mock_logs)):
        response = client.get("/api/v1/logs/", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["level"] == "INFO"
        assert data[0]["message"] == "Test log message"

def test_read_logs_with_level_filter(client, test_superuser, test_token):
    """Test log retrieval with level filter"""
    mock_logs = [
        {
            "id": 1,
            "level": "ERROR",
            "message": "Error log message",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": 1,
            "action": "test_action",
            "details": {"error": "data"}
        }
    ]
    with patch('app.api.v1.endpoints.logs.get_logs', new=MagicMock(return_value=mock_logs)):
        response = client.get("/api/v1/logs/?level=ERROR", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["level"] == "ERROR"

def test_read_log_success(client, test_superuser, test_token):
    """Test successful single log retrieval"""
    mock_log = {
        "id": 1,
        "level": "INFO",
        "message": "Test log message",
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": 1,
        "action": "test_action",
        "details": {"test": "data"}
    }
    with patch('app.api.v1.endpoints.logs.get_log', new=MagicMock(return_value=mock_log)):
        response = client.get("/api/v1/logs/1", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["level"] == "INFO"
        assert data["message"] == "Test log message"

def test_read_log_not_found(client, test_superuser, test_token):
    """Test log retrieval when log not found"""
    with patch('app.api.v1.endpoints.logs.get_log', new=MagicMock(return_value=None)):
        response = client.get("/api/v1/logs/999", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Log not found"

def test_delete_log_success(client, test_superuser, test_token):
    """Test successful log deletion"""
    with patch('app.api.v1.endpoints.logs.delete_log', new=MagicMock(return_value=True)):
        response = client.delete("/api/v1/logs/1", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Log deleted successfully"

def test_delete_log_not_found(client, test_superuser, test_token):
    """Test log deletion when log not found"""
    with patch('app.api.v1.endpoints.logs.delete_log', new=MagicMock(return_value=False)):
        response = client.delete("/api/v1/logs/999", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Log not found" 