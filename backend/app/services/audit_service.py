from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.config import settings
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class AuditService:
    def __init__(self):
        self.log_dir = Path(settings.LOGS_DIR) / "audit"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = self.log_dir / "security_audit.log"

    def log_security_event(
        self,
        event_type: str,
        user_id: Optional[int],
        ip_address: str,
        details: Dict[str, Any],
        severity: str = "INFO"
    ) -> None:
        """Log a security event with details"""
        timestamp = datetime.utcnow().isoformat()
        event = {
            "timestamp": timestamp,
            "event_type": event_type,
            "user_id": user_id,
            "ip_address": ip_address,
            "severity": severity,
            "details": details
        }
        
        # Log to file
        with open(self.log_file, "a") as f:
            f.write(json.dumps(event) + "\n")
        
        # Log to console based on severity
        if severity == "ERROR":
            logger.error(f"Security Event: {event_type} - {json.dumps(details)}")
        elif severity == "WARNING":
            logger.warning(f"Security Event: {event_type} - {json.dumps(details)}")
        else:
            logger.info(f"Security Event: {event_type} - {json.dumps(details)}")

    def log_login_attempt(
        self,
        user: Optional[User],
        ip_address: str,
        success: bool,
        failure_reason: Optional[str] = None
    ) -> None:
        """Log login attempt"""
        details = {
            "success": success,
            "failure_reason": failure_reason,
            "user_email": user.email if user else None
        }
        self.log_security_event(
            "LOGIN_ATTEMPT",
            user.id if user else None,
            ip_address,
            details,
            "WARNING" if not success else "INFO"
        )

    def log_password_change(
        self,
        user: User,
        ip_address: str,
        success: bool,
        failure_reason: Optional[str] = None
    ) -> None:
        """Log password change attempt"""
        details = {
            "success": success,
            "failure_reason": failure_reason
        }
        self.log_security_event(
            "PASSWORD_CHANGE",
            user.id,
            ip_address,
            details,
            "WARNING" if not success else "INFO"
        )

    def log_2fa_event(
        self,
        user: User,
        ip_address: str,
        event_type: str,
        success: bool,
        failure_reason: Optional[str] = None
    ) -> None:
        """Log 2FA-related events"""
        details = {
            "success": success,
            "failure_reason": failure_reason,
            "event_type": event_type
        }
        self.log_security_event(
            "2FA_EVENT",
            user.id,
            ip_address,
            details,
            "WARNING" if not success else "INFO"
        )

    def log_account_locked(
        self,
        user: User,
        ip_address: str,
        reason: str,
        duration_minutes: int
    ) -> None:
        """Log account lockout"""
        details = {
            "reason": reason,
            "duration_minutes": duration_minutes
        }
        self.log_security_event(
            "ACCOUNT_LOCKED",
            user.id,
            ip_address,
            details,
            "WARNING"
        )

    def log_session_event(
        self,
        user: User,
        ip_address: str,
        event_type: str,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log session-related events"""
        if details is None:
            details = {}
        details["event_type"] = event_type
        self.log_security_event(
            "SESSION_EVENT",
            user.id,
            ip_address,
            details
        )

# Create a global audit service instance
audit_service = AuditService() 