from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.session import UserSession
from app.crud.base import CRUDBase
from datetime import datetime, timedelta
import uuid

class CRUDSession(CRUDBase[UserSession, str, str]):
    def get_active_sessions_by_user(self, db: Session, user_id: int) -> List[UserSession]:
        """Get all active sessions for a specific user with device deduplication"""
        # Get unique active sessions by device key (one per device)
        # This prevents counting multiple sessions from the same device as separate active sessions
        
        return db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active,
            UserSession.expires_at > datetime.utcnow()
        ).distinct(UserSession.device_key).order_by(UserSession.created_at.desc()).all()
    
    def get_session_by_id(self, db: Session, session_id: str) -> Optional[UserSession]:
        """Get a specific session by ID"""
        return db.query(UserSession).filter(UserSession.id == session_id).first()
    
    def create_session(
        self, 
        db: Session, 
        user_id: int, 
        device_info: Dict[str, Any] = None,
        expires_in_days: int = 30
    ) -> UserSession:
        """Create a new session for a user"""
        session = UserSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            device_info=device_info or {},
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
            is_active=True
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    def update_session_activity(self, db: Session, session_id: str) -> bool:
        """Update the last accessed time for a session"""
        session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if session:
            session.last_accessed = datetime.utcnow()
            db.commit()
            return True
        return False
    
    def invalidate_session(self, db: Session, session_id: str) -> bool:
        """Invalidate a specific session"""
        session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if session:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
            db.commit()
            return True
        return False
    
    def invalidate_all_user_sessions(self, db: Session, user_id: int) -> int:
        """Invalidate all sessions for a user and return count"""
        sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        ).all()
        
        count = len(sessions)
        for session in sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        db.commit()
        return count
    
    def cleanup_expired_sessions(self, db: Session) -> int:
        """Clean up expired sessions and return count"""
        expired_sessions = db.query(UserSession).filter(
            UserSession.expires_at <= datetime.utcnow(),
            UserSession.is_active == True
        ).all()
        
        count = len(expired_sessions)
        for session in expired_sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        db.commit()
        return count
    
    def force_cleanup_user_sessions(self, db: Session, user_id: int) -> int:
        """Force cleanup of all sessions for a user that are older than 1 day"""
        cutoff_time = datetime.utcnow() - timedelta(days=1)
        old_sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.created_at < cutoff_time,
            UserSession.is_active == True
        ).all()
        
        count = len(old_sessions)
        for session in old_sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        db.commit()
        return count
    
    def cleanup_inactive_sessions(self, db: Session, user_id: int) -> int:
        """Clean up sessions that don't meet our 'active' criteria"""
        cutoff_time = datetime.utcnow() - timedelta(hours=2)   # 2 hours ago (very strict)
        max_age = datetime.utcnow() - timedelta(days=1)        # 1 day ago (very strict)
        
        # Find sessions that are marked active but don't meet criteria
        inactive_sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow(),  # Not expired
            # But either:
            ((UserSession.last_accessed < cutoff_time) & (UserSession.created_at < cutoff_time)) |  # Neither recently accessed nor created
            (UserSession.created_at < max_age)           # Too old
        ).all()
        
        count = len(inactive_sessions)
        for session in inactive_sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        db.commit()
        return count
    
    def get_session_count_by_user(self, db: Session, user_id: int) -> int:
        """Get the count of active sessions for a user with device deduplication"""
        # Count unique active sessions by device key (one per device)
        # This prevents counting multiple sessions from the same device as separate active sessions
        
        return db.query(UserSession.device_key).filter(
            UserSession.user_id == user_id,
            UserSession.is_active,
            UserSession.expires_at > datetime.utcnow()
        ).distinct().count()
    
    def get_session_analytics(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get comprehensive session analytics for a user with device deduplication"""
        # Total sessions (all time)
        total_sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).count()
        
        # Active sessions (unique devices)
        active_sessions = self.get_session_count_by_user(db, user_id)
        
        # Sessions created in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.created_at >= thirty_days_ago
        ).count()
        
        # Device type analysis (unique devices)
        device_types = {}
        unique_sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active,
            UserSession.expires_at > datetime.utcnow()
        ).distinct(UserSession.device_key).all()
        
        for session in unique_sessions:
            device_type = session.device_info.get('type', 'unknown')
            device_types[device_type] = device_types.get(device_type, 0) + 1
        
        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "recent_sessions": recent_sessions,
            "device_types": device_types,
        }
    
    def get_session_diagnostics(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get detailed diagnostics about user sessions for debugging"""
        # Total sessions (all time)
        total_sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).count()
        
        # Sessions marked as active
        marked_active = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        ).count()
        
        # Sessions not expired
        not_expired = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.expires_at > datetime.utcnow()
        ).count()
        
        # Sessions accessed in last 24 hours
        cutoff_time = datetime.utcnow() - timedelta(days=1)
        recently_accessed = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.last_accessed >= cutoff_time
        ).count()
        
        # Sessions created in last 7 days
        max_age = datetime.utcnow() - timedelta(days=7)
        recently_created = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.created_at >= max_age
        ).count()
        
        # Sessions that meet ALL our active criteria
        truly_active = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow(),
            UserSession.last_accessed >= cutoff_time,
            UserSession.created_at >= max_age
        ).count()
        
        return {
            "total_sessions": total_sessions,
            "marked_active": marked_active,
            "not_expired": not_expired,
            "recently_accessed": recently_accessed,
            "recently_created": recently_created,
            "truly_active": truly_active,
            "criteria": {
                "cutoff_hours": 24,
                "max_age_days": 7
            }
        }
    
    def get_detailed_active_sessions(self, db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Get detailed information about each active session for debugging"""
        active_sessions = self.get_active_sessions_by_user(db, user_id)
        
        detailed_sessions = []
        for session in active_sessions:
            # Calculate time differences
            now = datetime.utcnow()
            created_ago = now - session.created_at
            last_accessed_ago = now - session.last_accessed if session.last_accessed else None
            expires_in = session.expires_at - now
            
            session_info = {
                "id": session.id,
                "created_at": session.created_at.isoformat(),
                "created_ago_hours": round(created_ago.total_seconds() / 3600, 2),
                "last_accessed": session.last_accessed.isoformat() if session.last_accessed else "Never",
                "last_accessed_ago_hours": round(last_accessed_ago.total_seconds() / 3600, 2) if last_accessed_ago else None,
                "expires_at": session.expires_at.isoformat(),
                "expires_in_hours": round(expires_in.total_seconds() / 3600, 2),
                "device_info": session.device_info,
                "meets_criteria": {
                    "is_active": session.is_active,
                    "not_expired": session.expires_at > now,
                    "recently_accessed": session.last_accessed and session.last_accessed >= (now - timedelta(hours=2)),
                    "recently_created": session.created_at >= (now - timedelta(hours=2)),
                    "not_too_old": session.created_at >= (now - timedelta(days=1))
                }
            }
            detailed_sessions.append(session_info)
        
        return detailed_sessions

session = CRUDSession(UserSession)
