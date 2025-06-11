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
            "last_activity": datetime.utcnow().isoformat()
        }

        # Store session in user's sessions list
        if not user.sessions:
            user.sessions = []
        user.sessions.append(session_data)

        # Keep only the most recent N sessions
        if len(user.sessions) > settings.MAX_CONCURRENT_SESSIONS:
            user.sessions = user.sessions[-settings.MAX_CONCURRENT_SESSIONS:]

        # TODO: Save user.sessions to MongoDB/Beanie
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

# Create a global session service instance
session_service = SessionService() 