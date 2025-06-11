from datetime import datetime, timedelta
from typing import Dict, List, Optional
#from sqlalchemy.orm import Session  # Removed
from app.models.user import User
from app.core.config import settings
from app.services.security_monitoring import security_monitoring
import json
import uuid

class SessionService:
    def __init__(self):
        self.active_sessions: Dict[str, Dict] = {}
        self.session_analytics: Dict[str, List[Dict]] = {}

    def create_session(
        self,
        user: User,
        ip_address: str,
        user_agent: str,
        remember_me: bool = False
    ) -> str:
        """Create a new session for a user"""
        session_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(
            days=settings.REMEMBER_ME_DAYS if remember_me else 1
        )

        session_data = {
            "user_id": user.id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat(),
            "remember_me": remember_me,
            "last_activity": datetime.utcnow().isoformat(),
            "session_metrics": {
                "page_views": 0,
                "api_calls": 0,
                "errors": 0,
                "total_duration": 0,
                "last_interaction": datetime.utcnow().isoformat()
            }
        }

        # Initialize session analytics
        self.session_analytics[session_id] = []

        # Store session in user's sessions list
        if not user.sessions:
            user.sessions = []
        user.sessions.append(session_data)

        # Keep only the most recent N sessions
        if len(user.sessions) > settings.MAX_CONCURRENT_SESSIONS:
            user.sessions = user.sessions[-settings.MAX_CONCURRENT_SESSIONS:]

        self.active_sessions[session_id] = session_data

        # Log session creation
        security_monitoring.log_security_alert(
            "SESSION_CREATED",
            "INFO",
            {
                "session_id": session_id,
                "remember_me": remember_me,
                "ip_address": ip_address,
                "user_agent": user_agent
            },
            user.id,
            ip_address
        )

        return session_id

    def validate_session(
        self,
        session_id: str,
        ip_address: str,
        user_agent: str
    ) -> Optional[User]:
        """Validate a session and return the associated user"""
        session_data = self.active_sessions.get(session_id)
        if not session_data:
            return None

        # Check if session has expired
        expires_at = datetime.fromisoformat(session_data["expires_at"])
        if datetime.utcnow() > expires_at:
            self.revoke_session(session_id)
            return None

        # Check if IP or user agent has changed
        if session_data["ip_address"] != ip_address or session_data["user_agent"] != user_agent:
            self.revoke_session(session_id)
            return None

        # Update last activity
        session_data["last_activity"] = datetime.utcnow().isoformat()
        self.active_sessions[session_id] = session_data

        # TODO: Get user from MongoDB/Beanie
        # user = ...
        user = None
        if not user:
            self.revoke_session(session_id)
            return None

        return user

    def revoke_session(self, session_id: str) -> None:
        """Revoke a specific session"""
        session_data = self.active_sessions.pop(session_id, None)
        if not session_data:
            return

        # TODO: Remove session from user's sessions list in MongoDB/Beanie

        # Log session revocation
        security_monitoring.log_security_alert(
            "SESSION_REVOKED",
            "INFO",
            {
                "session_id": session_id,
                "reason": "expired_or_invalid"
            },
            session_data["user_id"],
            session_data["ip_address"]
        )

    def revoke_all_sessions(self, user_id: int) -> None:
        """Revoke all sessions for a user"""
        # TODO: Remove all sessions for user in MongoDB/Beanie
        # Remove all sessions from active sessions
        for session_id, session_data in list(self.active_sessions.items()):
            if session_data["user_id"] == user_id:
                self.active_sessions.pop(session_id)

        # Log all sessions revoked
        security_monitoring.log_security_alert(
            "ALL_SESSIONS_REVOKED",
            "INFO",
            {
                "user_id": user_id,
                "reason": "user_requested"
            },
            user_id
        )

    def cleanup_expired_sessions(self) -> None:
        """Clean up expired sessions"""
        current_time = datetime.utcnow()
        expired_sessions = []

        # Find expired sessions
        for session_id, session_data in self.active_sessions.items():
            expires_at = datetime.fromisoformat(session_data["expires_at"])
            if current_time > expires_at:
                expired_sessions.append(session_id)

        # Revoke expired sessions
        for session_id in expired_sessions:
            self.revoke_session(session_id)

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

# Create a global session service instance
session_service = SessionService() 