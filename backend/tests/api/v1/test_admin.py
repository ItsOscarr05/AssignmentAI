import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock, ANY
from datetime import datetime

from app.main import app
from app.models.user import User
from app.schemas.admin import UserStatusUpdate, SystemLog
from tests.conftest import TestingSessionLocal
from app.core.deps import get_current_active_superuser

client = TestClient(app)

@pytest.fixture
def admin_user():
    """Create an admin user for testing"""
    return User(
        id=1,
        email="admin@example.com",
        hashed_password="fakehash",
        name="Admin User",
        is_active=True,
        is_verified=True,
        is_superuser=True,
        updated_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )

@pytest.fixture
def regular_user():
    """Create a regular user for testing"""
    return User(
        id=2,
        email="user@example.com",
        hashed_password="fakehash",
        name="Regular User",
        is_active=True,
        is_verified=True,
        is_superuser=False,
        updated_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )

@pytest.fixture(autouse=True)
def override_get_current_active_superuser(admin_user):
    """Override the dependency to use admin user"""
    from app.main import app
    app.dependency_overrides[get_current_active_superuser] = lambda: admin_user
    yield
    app.dependency_overrides.clear()

class TestAdminEndpoints:
    """Test cases for admin endpoints"""
    
    def test_get_admin_stats_success(self, db: Session, admin_user: User):
        """Test getting admin stats successfully"""
        with patch('app.crud.user.count') as mock_count, \
             patch('app.crud.user.count_by_role') as mock_count_by_role, \
             patch('app.crud.assignment.count') as mock_assignment_count, \
             patch('app.crud.submission.count') as mock_submission_count, \
             patch('app.crud.activity.get_recent') as mock_recent_activity:
            
            mock_count.return_value = 100
            mock_count_by_role.side_effect = [20, 80]  # teachers, students
            mock_assignment_count.return_value = 50
            mock_submission_count.return_value = 200
            mock_recent_activity.return_value = []
            
            response = client.get("/api/v1/admin/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert "total_users" in data
            assert "total_teachers" in data
            assert "total_students" in data
            assert "total_assignments" in data
            assert "total_submissions" in data
            assert "recent_activity" in data
    
    def test_get_all_users_success(self, db: Session, admin_user: User):
        """Test getting all users successfully"""
        with patch('app.crud.user.get_multi') as mock_get_multi:
            mock_users = [
                {"id": 1, "email": "user1@example.com", "name": "User 1", "created_at": datetime.utcnow()},
                {"id": 2, "email": "user2@example.com", "name": "User 2", "created_at": datetime.utcnow()}
            ]
            mock_get_multi.return_value = mock_users
            
            response = client.get("/api/v1/admin/users")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
    
    def test_get_all_users_with_pagination(self, db: Session, admin_user: User):
        """Test getting all users with pagination"""
        with patch('app.crud.user.get_multi') as mock_get_multi:
            mock_users = [{"id": 1, "email": "user1@example.com", "name": "User 1", "created_at": datetime.utcnow()}]
            mock_get_multi.return_value = mock_users
            
            response = client.get("/api/v1/admin/users?skip=0&limit=10")
            
            assert response.status_code == 200
            mock_get_multi.assert_called_once()
    
    def test_update_user_status_success(self, db: Session, admin_user: User):
        """Test updating user status successfully"""
        with patch('app.api.v1.endpoints.admin.crud.user.get') as mock_get, \
             patch('app.api.v1.endpoints.admin.crud.update_status') as mock_update_status:
            mock_user = {
                "id": 1,
                "email": "test@example.com",
                "name": "Test User",
                "avatar": None,
                "bio": None,
                "location": None,
                "website": None,
                "preferences": {},
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": None
            }
            mock_get.return_value = mock_user
            mock_update_status.return_value = mock_user
            status_update = UserStatusUpdate(is_active=True)
            response = client.put(
                "/api/v1/admin/users/1/status",
                json=status_update.model_dump()
            )
            assert response.status_code == 200
            mock_get.assert_called_once_with(ANY, id=1)
            mock_update_status.assert_called_once()
    
    def test_update_user_status_user_not_found(self, db: Session, admin_user: User):
        """Test updating user status when user not found"""
        with patch('app.api.v1.endpoints.admin.crud.user.get') as mock_get:
            mock_get.return_value = None
            status_update = UserStatusUpdate(is_active=True)
            response = client.put(
                "/api/v1/admin/users/999/status",
                json=status_update.model_dump()
            )
            assert response.status_code == 404
            assert "User not found" in response.json()["detail"]
    
    def test_get_system_health_success(self, db: Session, admin_user: User):
        """Test getting system health successfully"""
        with patch('app.api.v1.endpoints.admin.check_postgres_health') as mock_health:
            mock_health.return_value = {"status": "healthy"}
            response = client.get("/api/v1/admin/health")
            assert response.status_code == 200
            data = response.json()
            assert "database" in data
            assert data["database"]["status"] == "healthy"
    
    def test_get_system_health_database_down(self, db: Session, admin_user: User):
        """Test getting system health when database is down"""
        with patch('app.api.v1.endpoints.admin.check_postgres_health') as mock_health:
            mock_health.return_value = {"status": "unhealthy", "message": "Connection failed"}
            response = client.get("/api/v1/admin/health")
            assert response.status_code == 200
            data = response.json()
            assert "database" in data
            assert data["database"]["status"] == "unhealthy"
    
    def test_read_logs_success(self, db: Session, admin_user: User):
        """Test reading logs successfully"""
        with patch('app.api.v1.endpoints.admin.get_logs') as mock_get_logs:
            mock_logs = [
                SystemLog(
                    id=1,
                    level="INFO",
                    message="Test log message",
                    timestamp=datetime.utcnow(),
                    user_id=1
                )
            ]
            mock_get_logs.return_value = mock_logs
            response = client.get("/api/v1/admin/logs")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["level"] == "INFO"
    
    def test_read_logs_with_filtering(self, db: Session, admin_user: User):
        """Test reading logs with level filtering"""
        with patch('app.api.v1.endpoints.admin.get_logs') as mock_get_logs:
            mock_logs = []
            mock_get_logs.return_value = mock_logs
            response = client.get("/api/v1/admin/logs?level=ERROR&skip=0&limit=50")
            assert response.status_code == 200
            mock_get_logs.assert_called_once_with(ANY, skip=0, limit=50, level="ERROR")
    
    def test_delete_log_success(self, db: Session, admin_user: User):
        """Test deleting log successfully"""
        with patch('app.api.v1.endpoints.admin.delete_log') as mock_delete_log:
            mock_delete_log.return_value = True
            response = client.delete("/api/v1/admin/logs/1")
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Log deleted successfully"
            mock_delete_log.assert_called_once_with(ANY, log_id=1)
    
    def test_delete_log_not_found(self, db: Session, admin_user: User):
        """Test deleting log when log not found"""
        with patch('app.api.v1.endpoints.admin.delete_log') as mock_delete_log:
            mock_delete_log.return_value = False
            response = client.delete("/api/v1/admin/logs/999")
            assert response.status_code == 404
            assert "Log not found" in response.json()["detail"]
    
    def test_admin_endpoints_unauthorized(self, db: Session):
        """Test admin endpoints without admin privileges"""
        from app.main import app
        app.dependency_overrides.clear()
        
        # Test stats endpoint
        response = client.get("/api/v1/admin/stats")
        assert response.status_code == 401
        
        # Test users endpoint
        response = client.get("/api/v1/admin/users")
        assert response.status_code == 401
        
        # Test health endpoint
        response = client.get("/api/v1/admin/health")
        assert response.status_code == 401
        
        # Test logs endpoint
        response = client.get("/api/v1/admin/logs")
        assert response.status_code == 401
        
        # Test delete log endpoint
        response = client.delete("/api/v1/admin/logs/1")
        assert response.status_code == 401
    
    def test_update_user_status_invalid_data(self, db: Session, admin_user: User):
        """Test updating user status with invalid data"""
        with patch('app.api.v1.endpoints.admin.crud.user.get') as mock_get:
            mock_user = MagicMock()
            mock_get.return_value = mock_user
            response = client.put(
                "/api/v1/admin/users/1/status",
                json={"invalid": "data"}
            )
            assert response.status_code == 422
    
    def test_read_logs_empty_result(self, db: Session, admin_user: User):
        """Test reading logs when no logs exist"""
        with patch('app.api.v1.endpoints.admin.get_logs') as mock_get_logs:
            mock_get_logs.return_value = []
            response = client.get("/api/v1/admin/logs")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 0
    
    def test_get_admin_stats_with_activity(self, db: Session, admin_user: User):
        """Test getting admin stats with recent activity"""
        with patch('app.crud.count_users') as mock_count, \
             patch('app.crud.count_by_role') as mock_count_by_role, \
             patch('app.crud.count_assignments') as mock_assignment_count, \
             patch('app.crud.count_submissions') as mock_submission_count, \
             patch('app.crud.get_recent') as mock_recent_activity:
            
            mock_count.return_value = 100
            mock_count_by_role.side_effect = [20, 80]
            mock_assignment_count.return_value = 50
            mock_submission_count.return_value = 200
            mock_recent_activity.return_value = [
                {"id": 1, "action": "login", "user_id": 1},
                {"id": 2, "action": "logout", "user_id": 2}
            ]
            
            response = client.get("/api/v1/admin/stats")
            
            assert response.status_code == 200
            data = response.json()
            assert "recent_activity" in data
            assert len(data["recent_activity"]) == 2 