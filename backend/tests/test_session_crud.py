import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.crud.session import session
from app.models.session import UserSession
from app.models.user import User

class TestSessionCRUD:
    def test_create_session(self, db: Session):
        """Test creating a new session"""
        # Create a test user first
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            name="Test User",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create session
        device_info = {"type": "desktop", "browser": "chrome"}
        session_obj = session.create_session(
            db=db,
            user_id=user.id,
            device_info=device_info,
            expires_in_days=30
        )
        
        assert session_obj.user_id == user.id
        assert session_obj.device_info == device_info
        assert session_obj.is_active == True
        assert session_obj.expires_at > datetime.utcnow()
    
    def test_get_active_sessions_by_user(self, db: Session):
        """Test getting active sessions for a user"""
        # Create a test user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            name="Test User",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create multiple sessions
        session1 = UserSession(
            id="session1",
            user_id=user.id,
            device_info={"type": "desktop"},
            expires_at=datetime.utcnow() + timedelta(days=30),
            is_active=True
        )
        session2 = UserSession(
            id="session2",
            user_id=user.id,
            device_info={"type": "mobile"},
            expires_at=datetime.utcnow() + timedelta(days=30),
            is_active=True
        )
        expired_session = UserSession(
            id="expired",
            user_id=user.id,
            device_info={"type": "tablet"},
            expires_at=datetime.utcnow() - timedelta(days=1),
            is_active=True
        )
        
        db.add_all([session1, session2, expired_session])
        db.commit()
        
        # Get active sessions
        active_sessions = session.get_active_sessions_by_user(db, user.id)
        
        assert len(active_sessions) == 2
        assert any(s.id == "session1" for s in active_sessions)
        assert any(s.id == "session2" for s in active_sessions)
        assert not any(s.id == "expired" for s in active_sessions)
    
    def test_get_session_count_by_user(self, db: Session):
        """Test getting session count for a user"""
        # Create a test user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create active sessions
        session1 = UserSession(
            id="session1",
            user_id=user.id,
            device_info={"type": "desktop"},
            expires_at=datetime.utcnow() + timedelta(days=30),
            is_active=True
        )
        session2 = UserSession(
            id="session2",
            user_id=user.id,
            device_info={"type": "mobile"},
            expires_at=datetime.utcnow() + timedelta(days=30),
            is_active=True
        )
        
        db.add_all([session1, session2])
        db.commit()
        
        # Get count
        count = session.get_session_count_by_user(db, user.id)
        assert count == 2
    
    def test_invalidate_session(self, db: Session):
        """Test invalidating a session"""
        # Create a test user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            name="Test User",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create session
        session_obj = UserSession(
            id="session1",
            user_id=user.id,
            device_info={"type": "desktop"},
            expires_at=datetime.utcnow() + timedelta(days=30),
            is_active=True
        )
        db.add(session_obj)
        db.commit()
        
        # Invalidate session
        success = session.invalidate_session(db, "session1")
        assert success == True
        
        # Verify session is invalidated
        db.refresh(session_obj)
        assert session_obj.is_active == False
        assert session_obj.invalidated_at is not None
    
    def test_cleanup_expired_sessions(self, db: Session):
        """Test cleaning up expired sessions"""
        # Create a test user
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            name="Test User",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create expired session
        expired_session = UserSession(
            id="expired",
            user_id=user.id,
            device_info={"type": "desktop"},
            expires_at=datetime.utcnow() - timedelta(days=1),
            is_active=True
        )
        db.add(expired_session)
        db.commit()
        
        # Cleanup expired sessions
        count = session.cleanup_expired_sessions(db)
        assert count == 1
        
        # Verify session is invalidated
        db.refresh(expired_session)
        assert expired_session.is_active == False
        assert expired_session.invalidated_at is not None
