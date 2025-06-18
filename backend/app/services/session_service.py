from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.session import UserSession
from app.core.config import settings
from app.services.security_monitoring import security_monitoring
import json
import uuid

class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.active_sessions: Dict[str, Dict] = {}
        self.session_analytics: Dict[str, List[Dict]] = {}

    async def create_session(self, user_id: int, device_info: Dict[str, Any] = None) -> str:
        """Create a new session for a user"""
        session_id = str(uuid.uuid4())
        
        session = UserSession(
            id=session_id,
            user_id=user_id,
            device_info=device_info or {},
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=30),  # 30 days
            is_active=True
        )
        
        self.db.add(session)
        self.db.commit()
        
        return session_id

    async def validate_session(self, session_id: str) -> Optional[UserSession]:
        """Validate a session and return the session object if valid"""
        session = self.db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if session:
            # Update last accessed time
            session.last_accessed = datetime.utcnow()
            self.db.commit()
        
        return session

    async def invalidate_session(self, session_id: str) -> bool:
        """Invalidate a specific session"""
        session = self.db.query(UserSession).filter(
            UserSession.id == session_id
        ).first()
        
        if session:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False

    async def invalidate_all_sessions(self, user_id: int) -> bool:
        """Invalidate all sessions for a user"""
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        ).all()
        
        for session in sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        self.db.commit()
        return True

    async def get_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all active sessions for a user"""
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).order_by(UserSession.created_at.desc()).all()
        
        session_list = []
        for session in sessions:
            session_data = {
                "id": session.id,
                "device_info": session.device_info,
                "created_at": session.created_at.isoformat(),
                "last_accessed": session.last_accessed.isoformat() if session.last_accessed else None,
                "expires_at": session.expires_at.isoformat(),
                "is_current": False  # Will be set by caller
            }
            session_list.append(session_data)
        
        return session_list

    async def revoke_session(self, user_id: int, session_id: str) -> bool:
        """Revoke a specific session for a user"""
        session = self.db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.user_id == user_id
        ).first()
        
        if session:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False

    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions and return count of cleaned sessions"""
        expired_sessions = self.db.query(UserSession).filter(
            UserSession.expires_at <= datetime.utcnow(),
            UserSession.is_active == True
        ).all()
        
        count = len(expired_sessions)
        for session in expired_sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        self.db.commit()
        return count

    async def get_session_analytics(self, user_id: int) -> Dict[str, Any]:
        """Get session analytics for a user"""
        # Get total sessions
        total_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).count()
        
        # Get active sessions
        active_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).count()
        
        # Get sessions created in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.created_at >= thirty_days_ago
        ).count()
        
        # Get most common device types
        device_types = {}
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).all()
        
        for session in sessions:
            device_type = session.device_info.get('type', 'unknown')
            device_types[device_type] = device_types.get(device_type, 0) + 1
        
        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "recent_sessions": recent_sessions,
            "device_types": device_types,
        }

# Global session service instance
session_service = SessionService(None)

def get_session_service(db: Session) -> SessionService:
    """Get session service instance with database session"""
    session_service.db = db
    return session_service

    def track_session_activity(
        self,
        session_id: str,
        activity_type: str,
        details: Dict = None
    ) -> None:
        """Track session activity and update metrics"""
        if session_id not in self.active_sessions:
            return

        session_data = self.active_sessions[session_id]
        metrics = session_data["session_metrics"]
        current_time = datetime.utcnow()

        # Update metrics based on activity type
        if activity_type == "page_view":
            metrics["page_views"] += 1
        elif activity_type == "api_call":
            metrics["api_calls"] += 1
        elif activity_type == "error":
            metrics["errors"] += 1

        metrics["last_interaction"] = current_time.isoformat()
        
        # Calculate session duration
        created_at = datetime.fromisoformat(session_data["created_at"])
        metrics["total_duration"] = (current_time - created_at).total_seconds()

        # Record activity in analytics
        activity_record = {
            "timestamp": current_time.isoformat(),
            "type": activity_type,
            "details": details or {},
            "metrics": metrics.copy()
        }
        self.session_analytics[session_id].append(activity_record)

        # Keep only last 1000 activities per session
        if len(self.session_analytics[session_id]) > 1000:
            self.session_analytics[session_id] = self.session_analytics[session_id][-1000:]

        # Update session data
        self.active_sessions[session_id] = session_data

    def get_session_analytics(self, session_id: str) -> Dict:
        """Get analytics for a specific session"""
        if session_id not in self.active_sessions:
            return None

        session_data = self.active_sessions[session_id]
        analytics = self.session_analytics.get(session_id, [])

        return {
            "session_info": {
                "created_at": session_data["created_at"],
                "last_activity": session_data["last_activity"],
                "ip_address": session_data["ip_address"],
                "user_agent": session_data["user_agent"]
            },
            "metrics": session_data["session_metrics"],
            "activity_log": analytics[-100:] if analytics else [],  # Return last 100 activities
            "summary": {
                "total_page_views": session_data["session_metrics"]["page_views"],
                "total_api_calls": session_data["session_metrics"]["api_calls"],
                "error_rate": (
                    session_data["session_metrics"]["errors"] / 
                    max(session_data["session_metrics"]["api_calls"], 1)
                ) * 100,
                "average_session_duration": session_data["session_metrics"]["total_duration"] / 
                    max(session_data["session_metrics"]["page_views"], 1)
            }
        }

    def get_user_session_analytics(self, user_id: int) -> List[Dict]:
        """Get analytics for all sessions of a user"""
        user_sessions = [
            session_id for session_id, data in self.active_sessions.items()
            if data["user_id"] == user_id
        ]

        return [
            self.get_session_analytics(session_id)
            for session_id in user_sessions
        ] 