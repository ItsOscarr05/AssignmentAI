from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from app.models.session import UserSession
import json
import uuid
import hashlib
import logging


logger = logging.getLogger(__name__)

class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.active_sessions: Dict[str, Dict] = {}
        self.session_analytics: Dict[str, List[Dict]] = {}

    def _generate_device_key(self, device_info: Dict[str, Any]) -> str:
        """Generate a unique device key for deduplication"""
        
        # Create a device fingerprint based on key identifying information
        device_data = {
            "user_agent": device_info.get("user_agent", ""),
            "ip_address": device_info.get("ip_address", ""),
            "device_fingerprint": device_info.get("device_fingerprint", ""),
        }
        
        # Create a hash of the device data
        device_string = json.dumps(device_data, sort_keys=True)
        return hashlib.sha256(device_string.encode()).hexdigest()

    async def create_session(self, user_id: int, device_info: Dict[str, Any] = None) -> str:
        """Create a new session for a user with smart deduplication"""
        if not device_info:
            device_info = {}
        
        # Generate device key for deduplication
        device_key = self._generate_device_key(device_info)
        
        # Check if user already has an active session with this device
        existing_session = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.device_key == device_key,
            UserSession.is_active,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if existing_session:
            # Update existing session instead of creating new one
            existing_session.last_accessed = datetime.utcnow()
            existing_session.expires_at = datetime.utcnow() + timedelta(days=30)
            existing_session.device_info = device_info  # Update device info
            self.db.commit()
            
            logger.info(
                f"Updated existing session {existing_session.id} for user {user_id} "
                f"on device {device_key}"
            )
            return existing_session.id
        
        # Create new session only if this is a truly different device
        session_id = str(uuid.uuid4())
        
        session = UserSession(
            id=session_id,
            user_id=user_id,
            device_info=device_info,
            device_key=device_key,  # Store device key for deduplication
            created_at=datetime.utcnow(),
            last_accessed=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=30),
            is_active=True
        )
        
        self.db.add(session)
        self.db.commit()
        
        logger.info(f"Created new session {session_id} for user {user_id} on device {device_key}")
        return session_id

    async def validate_session(self, session_id: str) -> Optional[UserSession]:
        """Validate a session and return the session object if valid"""
        session = self.db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.is_active,
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
            UserSession.is_active
        ).all()
        
        for session in sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        self.db.commit()
        return True

    async def get_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all active sessions for a user with deduplication"""
        # First, clean up any legacy sessions without device_key
        legacy_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.device_key.is_(None),
            UserSession.is_active
        ).all()
        
        if legacy_sessions:
            for session in legacy_sessions:
                session.is_active = False
                session.invalidated_at = session.created_at
            self.db.commit()
            logger.info(f"Cleaned up {len(legacy_sessions)} legacy sessions for user {user_id}")
        
        # Get unique sessions by device key (one per device)
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active,
            UserSession.expires_at > datetime.utcnow(),
            UserSession.device_key.is_not(None)  # Only get sessions with device_key
        ).order_by(UserSession.created_at.desc()).all()
        
        # Deduplicate by device key, keeping the most recent session per device
        unique_sessions = {}
        for session in sessions:
            device_key = session.device_key
            if (device_key not in unique_sessions or 
                session.created_at > unique_sessions[device_key].created_at):
                unique_sessions[device_key] = session
        
        session_list = []
        for session in unique_sessions.values():
            session_data = {
                "id": session.id,
                "device_info": session.device_info,
                "device_key": session.device_key,
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

    async def revoke_current_session_by_device(self, user_id: int, device_info: Dict[str, Any]) -> bool:
        """Revoke the current session for a specific device"""
        if not device_info:
            return False
            
        device_key = self._generate_device_key(device_info)
        
        # Find the active session for this device
        session = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.device_key == device_key,
            UserSession.is_active,
            UserSession.expires_at > datetime.utcnow()
        ).first()
        
        if session:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
            self.db.commit()
            logger.info(f"Revoked current session {session.id} for user {user_id} on device {device_key}")
            return True
        
        return False

    async def get_active_session_count(self, user_id: int) -> int:
        """Get the count of truly active sessions (unique devices) for a user"""
        # First, clean up any legacy sessions without device_key
        legacy_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.device_key.is_(None),
            UserSession.is_active
        ).all()
        
        if legacy_sessions:
            for session in legacy_sessions:
                session.is_active = False
                session.invalidated_at = session.created_at
            self.db.commit()
            logger.info(f"Cleaned up {len(legacy_sessions)} legacy sessions for user {user_id}")
        
        # Count unique active sessions by device key
        unique_sessions = self.db.query(UserSession.device_key).filter(
            UserSession.user_id == user_id,
            UserSession.is_active,
            UserSession.expires_at > datetime.utcnow(),
            UserSession.device_key.is_not(None)  # Only count sessions with device_key
        ).distinct().count()
        
        return unique_sessions

    async def cleanup_inactive_sessions(self, user_id: int) -> int:
        """Clean up inactive sessions and return count of cleaned sessions"""
        # Find sessions that are either expired or haven't been accessed in 7 days
        cutoff_time = datetime.utcnow() - timedelta(days=7)
        
        inactive_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
            (
                (UserSession.expires_at <= datetime.utcnow()) |
                (UserSession.last_accessed <= cutoff_time)
            )
        ).all()
        
        count = len(inactive_sessions)
        for session in inactive_sessions:
            session.is_active = False
            session.invalidated_at = datetime.utcnow()
        
        self.db.commit()
        return count

    async def get_session_analytics(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive session analytics for a user"""
        # Total sessions (all time)
        total_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).count()
        
        # Active sessions (unique devices)
        active_sessions = await self.get_active_session_count(user_id)
        
        # Sessions created in last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.created_at >= thirty_days_ago
        ).count()
        
        # Device type analysis (unique devices)
        device_types = {}
        unique_sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True,
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

    def get_session_analytics_by_id(self, session_id: str) -> Dict:
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
            self.get_session_analytics_by_id(session_id)
            for session_id in user_sessions
        ]


# Global session service instance
session_service = SessionService(None)

def get_session_service(db: Session) -> SessionService:
    """Get session service instance with database session"""
    session_service.db = db
    return session_service 