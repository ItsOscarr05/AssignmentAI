import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.services.session_service import SessionService
from app.models.session import UserSession
from app.models.user import User
from datetime import datetime, timedelta
import uuid

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    return user

@pytest.fixture
def session_service(mock_db):
    return SessionService(mock_db)

@pytest.fixture
def mock_session():
    session = MagicMock(spec=UserSession)
    session.id = "test-session-id"
    session.user_id = 1
    session.device_info = {"type": "desktop", "browser": "chrome"}
    session.created_at = datetime.utcnow()
    session.expires_at = datetime.utcnow() + timedelta(days=30)
    session.is_active = True
    session.last_accessed = None
    session.invalidated_at = None
    return session

@pytest.fixture
def mock_expired_session():
    session = MagicMock(spec=UserSession)
    session.id = "expired-session-id"
    session.user_id = 1
    session.device_info = {"type": "mobile", "browser": "safari"}
    session.created_at = datetime.utcnow() - timedelta(days=31)
    session.expires_at = datetime.utcnow() - timedelta(days=1)
    session.is_active = True
    session.last_accessed = None
    session.invalidated_at = None
    return session

class TestSessionService:
    """Test cases for SessionService"""

    @pytest.mark.asyncio
    async def test_create_session_success(self, session_service, mock_db):
        """Test successful session creation"""
        with patch('uuid.uuid4', return_value="test-uuid"):
            result = await session_service.create_session(1, {"type": "desktop"})
            
            assert result == "test-uuid"
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_session_no_device_info(self, session_service, mock_db):
        """Test session creation without device info"""
        with patch('uuid.uuid4', return_value="test-uuid"):
            result = await session_service.create_session(1)
            
            assert result == "test-uuid"
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_validate_session_success(self, session_service, mock_db, mock_session):
        """Test successful session validation"""
        mock_db.query().filter().first.return_value = mock_session
        
        result = await session_service.validate_session("test-session-id")
        
        assert result == mock_session
        assert mock_session.last_accessed is not None
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_validate_session_not_found(self, session_service, mock_db):
        """Test session validation when session not found"""
        mock_db.query().filter().first.return_value = None
        
        result = await session_service.validate_session("invalid-session-id")
        
        assert result is None
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_validate_session_expired(self, session_service, mock_db, mock_expired_session):
        """Test session validation when session is expired"""
        mock_db.query().filter().first.return_value = None  # Query won't find expired session
        
        result = await session_service.validate_session("expired-session-id")
        
        assert result is None
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_invalidate_session_success(self, session_service, mock_db, mock_session):
        """Test successful session invalidation"""
        mock_db.query().filter().first.return_value = mock_session
        
        result = await session_service.invalidate_session("test-session-id")
        
        assert result is True
        assert mock_session.is_active is False
        assert mock_session.invalidated_at is not None
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_invalidate_session_not_found(self, session_service, mock_db):
        """Test session invalidation when session not found"""
        mock_db.query().filter().first.return_value = None
        
        result = await session_service.invalidate_session("invalid-session-id")
        
        assert result is False
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_invalidate_all_sessions_success(self, session_service, mock_db, mock_session):
        """Test successful invalidation of all user sessions"""
        mock_db.query().filter().all.return_value = [mock_session]
        
        result = await session_service.invalidate_all_sessions(1)
        
        assert result is True
        assert mock_session.is_active is False
        assert mock_session.invalidated_at is not None
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_invalidate_all_sessions_no_sessions(self, session_service, mock_db):
        """Test invalidation when user has no active sessions"""
        mock_db.query().filter().all.return_value = []
        
        result = await session_service.invalidate_all_sessions(1)
        
        assert result is True
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_sessions_success(self, session_service, mock_db, mock_session):
        """Test successful retrieval of user sessions"""
        mock_db.query().filter().order_by().all.return_value = [mock_session]
        
        result = await session_service.get_user_sessions(1)
        
        assert len(result) == 1
        session_data = result[0]
        assert session_data["id"] == "test-session-id"
        assert session_data["device_info"] == {"type": "desktop", "browser": "chrome"}
        assert session_data["is_current"] is False

    @pytest.mark.asyncio
    async def test_get_user_sessions_no_sessions(self, session_service, mock_db):
        """Test retrieval when user has no active sessions"""
        mock_db.query().filter().order_by().all.return_value = []
        
        result = await session_service.get_user_sessions(1)
        
        assert result == []

    @pytest.mark.asyncio
    async def test_revoke_session_success(self, session_service, mock_db, mock_session):
        """Test successful session revocation"""
        mock_db.query().filter().first.return_value = mock_session
        
        result = await session_service.revoke_session(1, "test-session-id")
        
        assert result is True
        assert mock_session.is_active is False
        assert mock_session.invalidated_at is not None
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_revoke_session_not_found(self, session_service, mock_db):
        """Test session revocation when session not found"""
        mock_db.query().filter().first.return_value = None
        
        result = await session_service.revoke_session(1, "invalid-session-id")
        
        assert result is False
        mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_cleanup_expired_sessions_success(self, session_service, mock_db, mock_expired_session):
        """Test successful cleanup of expired sessions"""
        mock_db.query().filter().all.return_value = [mock_expired_session]
        
        result = await session_service.cleanup_expired_sessions()
        
        assert result == 1
        assert mock_expired_session.is_active is False
        assert mock_expired_session.invalidated_at is not None
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_cleanup_expired_sessions_none(self, session_service, mock_db):
        """Test cleanup when no expired sessions exist"""
        mock_db.query().filter().all.return_value = []
        
        result = await session_service.cleanup_expired_sessions()
        
        assert result == 0
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_session_analytics_success(self, session_service, mock_db, mock_session):
        """Test successful retrieval of session analytics"""
        # Mock different query results
        mock_db.query().filter().count.side_effect = [5, 2, 3]  # total, active, recent
        mock_db.query().filter().all.return_value = [mock_session]
        
        result = await session_service.get_session_analytics(1)
        
        assert result["total_sessions"] == 5
        assert result["active_sessions"] == 2
        assert result["recent_sessions"] == 3
        assert "device_types" in result
        assert result["device_types"]["desktop"] == 1

    @pytest.mark.asyncio
    async def test_get_session_analytics_no_sessions(self, session_service, mock_db):
        """Test analytics when user has no sessions"""
        mock_db.query().filter().count.side_effect = [0, 0, 0]
        mock_db.query().filter().all.return_value = []
        
        result = await session_service.get_session_analytics(1)
        
        assert result["total_sessions"] == 0
        assert result["active_sessions"] == 0
        assert result["recent_sessions"] == 0
        assert result["device_types"] == {}

    @pytest.mark.asyncio
    async def test_get_session_analytics_multiple_device_types(self, session_service, mock_db):
        """Test analytics with multiple device types"""
        # Create sessions with different device types
        desktop_session = MagicMock()
        desktop_session.device_info = {"type": "desktop"}
        mobile_session = MagicMock()
        mobile_session.device_info = {"type": "mobile"}
        tablet_session = MagicMock()
        tablet_session.device_info = {"type": "tablet"}
        
        mock_db.query().filter().count.side_effect = [3, 2, 1]
        mock_db.query().filter().all.return_value = [desktop_session, mobile_session, tablet_session]
        
        result = await session_service.get_session_analytics(1)
        
        assert result["device_types"]["desktop"] == 1
        assert result["device_types"]["mobile"] == 1
        assert result["device_types"]["tablet"] == 1

    @pytest.mark.asyncio
    async def test_get_session_analytics_unknown_device_type(self, session_service, mock_db):
        """Test analytics with unknown device type"""
        unknown_session = MagicMock()
        unknown_session.device_info = {}
        
        mock_db.query().filter().count.side_effect = [1, 1, 1]
        mock_db.query().filter().all.return_value = [unknown_session]
        
        result = await session_service.get_session_analytics(1)
        
        assert result["device_types"]["unknown"] == 1 

    @pytest.mark.asyncio
    async def test_get_user_session_analytics_empty(self, session_service):
        # No active_sessions for this user_id
        session_service.active_sessions = {}
        result = session_service.get_user_session_analytics(999)
        assert result == []

    def test_track_session_activity_success(self, session_service):
        """Test successful session activity tracking"""
        # Setup session data
        session_id = "test-session"
        session_service.active_sessions[session_id] = {
            "user_id": 1,
            "created_at": "2024-01-01T00:00:00",
            "last_activity": "2024-01-01T00:00:00",
            "ip_address": "127.0.0.1",
            "user_agent": "test-agent",
            "session_metrics": {
                "page_views": 0,
                "api_calls": 0,
                "errors": 0,
                "total_duration": 0
            }
        }
        session_service.session_analytics[session_id] = []
        
        # Track activity
        session_service.track_session_activity(session_id, "page_view", {"page": "/test"})
        
        # Verify metrics updated
        metrics = session_service.active_sessions[session_id]["session_metrics"]
        assert metrics["page_views"] == 1
        assert len(session_service.session_analytics[session_id]) == 1

    def test_track_session_activity_unknown_session(self, session_service):
        """Test tracking activity for unknown session"""
        # Should not raise exception
        session_service.track_session_activity("unknown-session", "page_view")

    def test_get_session_analytics_by_id_success(self, session_service):
        """Test getting analytics for specific session"""
        # Setup session data
        session_id = "test-session"
        session_service.active_sessions[session_id] = {
            "user_id": 1,
            "created_at": "2024-01-01T00:00:00",
            "last_activity": "2024-01-01T00:00:00",
            "ip_address": "127.0.0.1",
            "user_agent": "test-agent",
            "session_metrics": {
                "page_views": 5,
                "api_calls": 10,
                "errors": 1,
                "total_duration": 3600
            }
        }
        session_service.session_analytics[session_id] = [
            {"timestamp": "2024-01-01T00:00:00", "type": "page_view"}
        ]
        
        result = session_service.get_session_analytics_by_id(session_id)
        
        assert result is not None
        assert result["session_info"]["created_at"] == "2024-01-01T00:00:00"
        assert result["metrics"]["page_views"] == 5
        assert result["summary"]["total_page_views"] == 5
        assert result["summary"]["error_rate"] == 10.0  # 1/10 * 100

    def test_get_session_analytics_by_id_not_found(self, session_service):
        """Test getting analytics for non-existent session"""
        result = session_service.get_session_analytics_by_id("non-existent")
        assert result is None

    def test_track_session_activity_error_type(self, session_service):
        """Test tracking session activity with error type"""
        # Setup session data
        session_id = "test-session"
        session_service.active_sessions[session_id] = {
            "user_id": 1,
            "created_at": "2024-01-01T00:00:00",
            "last_activity": "2024-01-01T00:00:00",
            "ip_address": "127.0.0.1",
            "user_agent": "test-agent",
            "session_metrics": {
                "page_views": 0,
                "api_calls": 0,
                "errors": 0,
                "total_duration": 0
            }
        }
        session_service.session_analytics[session_id] = []
        
        # Track error activity
        session_service.track_session_activity(session_id, "error", {"error": "test error"})
        
        # Verify metrics updated
        metrics = session_service.active_sessions[session_id]["session_metrics"]
        assert metrics["errors"] == 1
        assert len(session_service.session_analytics[session_id]) == 1

    def test_track_session_activity_trim_analytics(self, session_service):
        """Test tracking session activity with analytics trimming"""
        # Setup session data with 1001 activities
        session_id = "test-session"
        session_service.active_sessions[session_id] = {
            "user_id": 1,
            "created_at": "2024-01-01T00:00:00",
            "last_activity": "2024-01-01T00:00:00",
            "ip_address": "127.0.0.1",
            "user_agent": "test-agent",
            "session_metrics": {
                "page_views": 0,
                "api_calls": 0,
                "errors": 0,
                "total_duration": 0
            }
        }
        # Create 1001 activities to trigger trimming
        session_service.session_analytics[session_id] = [{"activity": i} for i in range(1001)]
        
        # Track activity to trigger trimming
        session_service.track_session_activity(session_id, "page_view")
        
        # Verify analytics were trimmed to last 1000
        assert len(session_service.session_analytics[session_id]) == 1000

    def test_get_session_service_function(self):
        """Test the get_session_service function"""
        from app.services.session_service import get_session_service
        from sqlalchemy.orm import Session
        
        mock_db = MagicMock(spec=Session)
        service = get_session_service(mock_db)
        
        assert service is not None
        assert service.db == mock_db

    def test_track_session_activity_api_call_type(self, session_service):
        """Test tracking session activity with api_call type"""
        # Setup session data
        session_id = "test-session"
        session_service.active_sessions[session_id] = {
            "user_id": 1,
            "created_at": "2024-01-01T00:00:00",
            "last_activity": "2024-01-01T00:00:00",
            "ip_address": "127.0.0.1",
            "user_agent": "test-agent",
            "session_metrics": {
                "page_views": 0,
                "api_calls": 0,
                "errors": 0,
                "total_duration": 0
            }
        }
        session_service.session_analytics[session_id] = []
        
        # Track API call activity
        session_service.track_session_activity(session_id, "api_call", {"endpoint": "/api/test"})
        
        # Verify metrics updated
        metrics = session_service.active_sessions[session_id]["session_metrics"]
        assert metrics["api_calls"] == 1
        assert len(session_service.session_analytics[session_id]) == 1 