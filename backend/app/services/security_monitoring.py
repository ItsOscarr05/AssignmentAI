from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.config import settings
from app.services.audit_service import audit_service
import json
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

class SecurityMonitoringService:
    def __init__(self):
        self.log_dir = Path(settings.LOGS_DIR) / "security"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.alert_log_file = self.log_dir / "security_alerts.log"
        self.metrics_file = self.log_dir / "security_metrics.json"
        self.alert_thresholds = settings.ALERT_THRESHOLDS

    def log_security_alert(
        self,
        alert_type: str,
        severity: str,
        details: Dict,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None
    ) -> None:
        """Log a security alert and trigger notifications if needed"""
        timestamp = datetime.utcnow().isoformat()
        alert = {
            "timestamp": timestamp,
            "alert_type": alert_type,
            "severity": severity,
            "user_id": user_id,
            "ip_address": ip_address,
            "details": details
        }

        # Log to file
        with open(self.alert_log_file, "a") as f:
            f.write(json.dumps(alert) + "\n")

        # Log to console based on severity
        if severity == "CRITICAL":
            logger.critical(f"Security Alert: {alert_type} - {json.dumps(details)}")
        elif severity == "HIGH":
            logger.error(f"Security Alert: {alert_type} - {json.dumps(details)}")
        elif severity == "MEDIUM":
            logger.warning(f"Security Alert: {alert_type} - {json.dumps(details)}")
        else:
            logger.info(f"Security Alert: {alert_type} - {json.dumps(details)}")

        # Send notifications for high and critical alerts
        if severity in ["HIGH", "CRITICAL"]:
            self._send_security_notification(alert)

    def _send_security_notification(self, alert: Dict) -> None:
        """Send security notifications via email"""
        if not settings.ALERT_EMAIL:
            return

        msg = MIMEMultipart()
        msg["Subject"] = f"Security Alert: {alert['alert_type']} - {alert['severity']}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = settings.ALERT_EMAIL

        body = f"""
        Security Alert Details:
        Type: {alert['alert_type']}
        Severity: {alert['severity']}
        Time: {alert['timestamp']}
        User ID: {alert['user_id']}
        IP Address: {alert['ip_address']}
        Details: {json.dumps(alert['details'], indent=2)}
        """
        msg.attach(MIMEText(body, "plain"))

        try:
            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.send_message(msg)
        except Exception as e:
            logger.error(f"Failed to send security notification: {str(e)}")

    def track_failed_login_attempts(self, db: Session, user: User, ip_address: str) -> None:
        """Track failed login attempts and generate alerts"""
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            self.log_security_alert(
                "ACCOUNT_LOCKED",
                "HIGH",
                {
                    "failed_attempts": user.failed_login_attempts,
                    "lockout_duration": settings.LOGIN_TIMEOUT_MINUTES
                },
                user.id,
                ip_address
            )

    def track_suspicious_activity(self, db: Session, user: User, activity_type: str, details: Dict) -> None:
        """Track suspicious user activity"""
        self.log_security_alert(
            "SUSPICIOUS_ACTIVITY",
            "MEDIUM",
            {
                "activity_type": activity_type,
                "details": details
            },
            user.id
        )

    def track_rate_limit_violation(self, ip_address: str, endpoint: str, attempts: int) -> None:
        """Track rate limit violations"""
        self.log_security_alert(
            "RATE_LIMIT_VIOLATION",
            "HIGH",
            {
                "endpoint": endpoint,
                "attempts": attempts
            },
            ip_address=ip_address
        )

    def track_2fa_attempts(self, user: User, success: bool, ip_address: str) -> None:
        """Track 2FA attempts"""
        if not success:
            self.log_security_alert(
                "2FA_FAILURE",
                "MEDIUM",
                {
                    "success": success,
                    "user_email": user.email
                },
                user.id,
                ip_address
            )

    def generate_security_report(self, start_date: datetime, end_date: datetime) -> Dict:
        """Generate a security report for the specified period"""
        report = {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "alerts": {
                "total": 0,
                "by_severity": {},
                "by_type": {}
            },
            "login_attempts": {
                "total": 0,
                "failed": 0,
                "successful": 0
            },
            "rate_limit_violations": 0,
            "2fa_attempts": {
                "total": 0,
                "failed": 0,
                "successful": 0
            }
        }

        # Read and analyze alert logs
        with open(self.alert_log_file, "r") as f:
            for line in f:
                alert = json.loads(line)
                alert_time = datetime.fromisoformat(alert["timestamp"])
                if start_date <= alert_time <= end_date:
                    report["alerts"]["total"] += 1
                    report["alerts"]["by_severity"][alert["severity"]] = \
                        report["alerts"]["by_severity"].get(alert["severity"], 0) + 1
                    report["alerts"]["by_type"][alert["alert_type"]] = \
                        report["alerts"]["by_type"].get(alert["alert_type"], 0) + 1

        return report

    def update_security_metrics(self) -> None:
        """Update security metrics"""
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "active_users": 0,
            "failed_login_attempts": 0,
            "rate_limit_violations": 0,
            "2fa_enabled_users": 0,
            "locked_accounts": 0
        }

        # Save metrics to file
        with open(self.metrics_file, "w") as f:
            json.dump(metrics, f, indent=2)

# Create a global security monitoring service instance
security_monitoring = SecurityMonitoringService() 