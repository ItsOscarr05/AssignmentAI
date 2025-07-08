import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import status
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from datetime import datetime
from app.core.deps import get_current_user

client = TestClient(app)

import pytest
from fastapi import status
from unittest.mock import Mock, patch

@pytest.fixture(autouse=True)
def override_get_current_user():
    user = Mock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    app.dependency_overrides[get_current_user] = lambda: user
    yield
    app.dependency_overrides.pop(get_current_user, None)

class TestUsageEndpoints:
    """Test usage tracking endpoints"""

    @pytest.fixture
    def mock_user(self):
        """Create a mock user"""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        return user

    @patch('app.services.usage_service.UsageService.track_usage')
    @patch('app.core.deps.get_db')
    def test_track_usage_success(
        self, 
        mock_get_db, 
        mock_track_usage
    ):
        """Test successful usage tracking"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_usage_response = Mock()
        mock_usage_response.id = 1
        mock_usage_response.user_id = 1
        mock_usage_response.feature = "assignment_generation"
        mock_usage_response.action = "create"
        mock_usage_response.timestamp = datetime.now()
        mock_usage_response.metadata = {"assignment_type": "essay"}
        mock_track_usage.return_value = mock_usage_response
        
        usage_data = {
            "feature": "assignment_generation",
            "action": "create",
            "metadata": {"assignment_type": "essay"}
        }
        
        response = client.post("/api/v1/usage/track", json=usage_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["feature"] == "assignment_generation"
        assert data["action"] == "create"
        
        # Verify the service was called with correct parameters
        mock_track_usage.assert_called_once_with(
            user=user,
            feature="assignment_generation",
            action="create",
            metadata={"assignment_type": "essay"}
        )

    @patch('app.services.usage_service.UsageService.track_usage')
    @patch('app.core.deps.get_db')
    def test_track_usage_without_metadata(
        self, 
        mock_get_db, 
        mock_track_usage
    ):
        """Test usage tracking without metadata"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_usage_response = Mock()
        mock_usage_response.id = 1
        mock_usage_response.user_id = 1
        mock_usage_response.feature = "feedback_generation"
        mock_usage_response.action = "create"
        mock_usage_response.timestamp = datetime.now()
        mock_usage_response.metadata = None
        mock_track_usage.return_value = mock_usage_response
        
        usage_data = {
            "feature": "feedback_generation",
            "action": "create"
        }
        
        response = client.post("/api/v1/usage/track", json=usage_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["feature"] == "feedback_generation"
        assert data["action"] == "create"
        
        # Verify the service was called with correct parameters
        mock_track_usage.assert_called_once_with(
            user=user,
            feature="feedback_generation",
            action="create",
            metadata=None
        )

    @patch('app.services.usage_service.UsageService.get_usage')
    @patch('app.core.deps.get_db')
    def test_get_usage_history_success(
        self, 
        mock_get_db, 
        mock_get_usage
    ):
        """Test successful retrieval of usage history"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_usage_entries = [
            Mock(
                id=1,
                user_id=1,
                feature="assignment_generation",
                action="create",
                timestamp=datetime.now(),
                metadata={"assignment_type": "essay"}
            ),
            Mock(
                id=2,
                user_id=1,
                feature="feedback_generation",
                action="create",
                timestamp=datetime.now(),
                metadata=None
            )
        ]
        mock_get_usage.return_value = mock_usage_entries
        
        response = client.get("/api/v1/usage/history")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["feature"] == "assignment_generation"
        assert data[1]["feature"] == "feedback_generation"
        
        # Verify the service was called with correct parameters
        mock_get_usage.assert_called_once_with(
            user=user,
            feature=None,
            start_date=None,
            end_date=None
        )

    @patch('app.services.usage_service.UsageService.get_usage')
    @patch('app.core.deps.get_db')
    def test_get_usage_history_with_filters(
        self, 
        mock_get_db, 
        mock_get_usage
    ):
        """Test retrieval of usage history with filters"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_usage_entries = [
            Mock(
                id=1,
                user_id=1,
                feature="assignment_generation",
                action="create",
                timestamp=datetime.now(),
                metadata={"assignment_type": "essay"}
            )
        ]
        mock_get_usage.return_value = mock_usage_entries
        
        response = client.get(
            "/api/v1/usage/history?feature=assignment_generation&start_date=2023-01-01T00:00:00&end_date=2023-12-31T23:59:59"
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["feature"] == "assignment_generation"
        
        # Verify the service was called with correct parameters
        mock_get_usage.assert_called_once()
        call_args = mock_get_usage.call_args
        assert call_args[1]["user"] == user
        assert call_args[1]["feature"] == "assignment_generation"
        assert call_args[1]["start_date"] is not None
        assert call_args[1]["end_date"] is not None

    @patch('app.services.usage_service.UsageService.get_usage_summary')
    @patch('app.core.deps.get_db')
    def test_get_usage_summary_success(
        self, 
        mock_get_db, 
        mock_get_usage_summary
    ):
        """Test successful retrieval of usage summary"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_summary = {
            "assignment_generation": 5,
            "feedback_generation": 3,
            "submission_analysis": 2
        }
        mock_get_usage_summary.return_value = mock_summary
        
        response = client.get("/api/v1/usage/summary")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["assignment_generation"] == 5
        assert data["feedback_generation"] == 3
        assert data["submission_analysis"] == 2
        
        # Verify the service was called with correct parameters
        mock_get_usage_summary.assert_called_once_with(
            user=user,
            feature=None,
            period="daily"
        )

    @patch('app.services.usage_service.UsageService.get_usage_summary')
    @patch('app.core.deps.get_db')
    def test_get_usage_summary_with_filters(
        self, 
        mock_get_db, 
        mock_get_usage_summary
    ):
        """Test retrieval of usage summary with filters"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_summary = {
            "assignment_generation": 5
        }
        mock_get_usage_summary.return_value = mock_summary
        
        response = client.get("/api/v1/usage/summary?feature=assignment_generation&period=weekly")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["assignment_generation"] == 5
        
        # Verify the service was called with correct parameters
        mock_get_usage_summary.assert_called_once_with(
            user=user,
            feature="assignment_generation",
            period="weekly"
        )

    @patch('app.services.usage_service.UsageService.get_usage_limits')
    @patch('app.core.deps.get_db')
    def test_get_usage_limits_success(
        self, 
        mock_get_db, 
        mock_get_usage_limits
    ):
        """Test successful retrieval of usage limits"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_limits = {
            "assignment_generation": {
                "daily_limit": 10,
                "monthly_limit": 100,
                "current_daily": 3,
                "current_monthly": 25
            },
            "feedback_generation": {
                "daily_limit": 20,
                "monthly_limit": 200,
                "current_daily": 5,
                "current_monthly": 50
            }
        }
        mock_get_usage_limits.return_value = mock_limits
        
        response = client.get("/api/v1/usage/limits")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "assignment_generation" in data
        assert "feedback_generation" in data
        assert data["assignment_generation"]["daily_limit"] == 10
        assert data["feedback_generation"]["monthly_limit"] == 200
        
        # Verify the service was called with correct parameters
        mock_get_usage_limits.assert_called_once_with(
            user=user,
            feature=None
        )

    @patch('app.services.usage_service.UsageService.get_usage_limits')
    @patch('app.core.deps.get_db')
    def test_get_usage_limits_for_specific_feature(
        self, 
        mock_get_db, 
        mock_get_usage_limits
    ):
        """Test retrieval of usage limits for a specific feature"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        mock_limits = {
            "assignment_generation": {
                "daily_limit": 10,
                "monthly_limit": 100,
                "current_daily": 3,
                "current_monthly": 25
            }
        }
        mock_get_usage_limits.return_value = mock_limits
        
        response = client.get("/api/v1/usage/limits?feature=assignment_generation")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "assignment_generation" in data
        assert data["assignment_generation"]["daily_limit"] == 10
        
        # Verify the service was called with correct parameters
        mock_get_usage_limits.assert_called_once_with(
            user=user,
            feature="assignment_generation"
        )

    @patch('app.services.usage_service.UsageService.track_usage')
    @patch('app.core.deps.get_db')
    def test_track_usage_invalid_data(
        self, 
        mock_get_db, 
        mock_track_usage
    ):
        """Test usage tracking with invalid data"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        
        # Missing required fields
        usage_data = {
            "feature": "assignment_generation"
            # Missing "action" field
        }
        
        response = client.post("/api/v1/usage/track", json=usage_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @patch('app.services.usage_service.UsageService.get_usage')
    @patch('app.core.deps.get_db')
    def test_get_usage_history_empty(
        self, 
        mock_get_db, 
        mock_get_usage
    ):
        """Test retrieval of empty usage history"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        mock_get_usage.return_value = []
        
        response = client.get("/api/v1/usage/history")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 0

    @patch('app.services.usage_service.UsageService.get_usage_summary')
    @patch('app.core.deps.get_db')
    def test_get_usage_summary_empty(
        self, 
        mock_get_db, 
        mock_get_usage_summary
    ):
        """Test retrieval of empty usage summary"""
        # Setup mocks
        mock_db = Mock()
        mock_get_db.return_value = mock_db
        user = app.dependency_overrides[get_current_user]()
        mock_get_usage_summary.return_value = {}
        
        response = client.get("/api/v1/usage/summary")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 0 