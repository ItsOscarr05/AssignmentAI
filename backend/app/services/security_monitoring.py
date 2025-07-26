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
        
        # IP-based monitoring
        self.ip_activity = {}  # Track IP activity
        self.suspicious_ips = set()  # Known suspicious IPs
        self.ip_failed_attempts = {}  # Track failed attempts per IP
        self.ip_successful_logins = {}  # Track successful logins per IP

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
        # Track IP-based failed attempts
        if ip_address not in self.ip_failed_attempts:
            self.ip_failed_attempts[ip_address] = 0
        self.ip_failed_attempts[ip_address] += 1
        
        # Check for suspicious IP activity
        if self.ip_failed_attempts[ip_address] >= 10:  # 10 failed attempts from same IP
            self.suspicious_ips.add(ip_address)
            self.log_security_alert(
                "SUSPICIOUS_IP_ACTIVITY",
                "HIGH",
                {
                    "ip_address": ip_address,
                    "failed_attempts": self.ip_failed_attempts[ip_address],
                    "action": "IP marked as suspicious"
                },
                user.id if user else None,
                ip_address
            )
        
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            self.log_security_alert(
                "ACCOUNT_LOCKED",
                "HIGH",
                {
                    "failed_attempts": user.failed_login_attempts,
                    "lockout_duration": settings.LOGIN_TIMEOUT_MINUTES,
                    "ip_address": ip_address
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
    
    def track_successful_login(self, user: User, ip_address: str, user_agent: str) -> None:
        """Track successful login and analyze for suspicious patterns"""
        # Track successful logins per IP
        if ip_address not in self.ip_successful_logins:
            self.ip_successful_logins[ip_address] = 0
        self.ip_successful_logins[ip_address] += 1
        
        # Check if IP was previously suspicious
        if ip_address in self.suspicious_ips:
            self.log_security_alert(
                "SUCCESSFUL_LOGIN_FROM_SUSPICIOUS_IP",
                "MEDIUM",
                {
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "previous_failed_attempts": self.ip_failed_attempts.get(ip_address, 0)
                },
                user.id,
                ip_address
            )
        
        # Check for unusual login patterns (multiple successful logins from same IP)
        if self.ip_successful_logins[ip_address] > 5:  # More than 5 successful logins from same IP
            self.log_security_alert(
                "MULTIPLE_SUCCESSFUL_LOGINS_FROM_IP",
                "LOW",
                {
                    "ip_address": ip_address,
                    "successful_logins": self.ip_successful_logins[ip_address],
                    "user_agent": user_agent
                },
                user.id,
                ip_address
            )
    
    def is_ip_suspicious(self, ip_address: str) -> bool:
        """Check if an IP address is marked as suspicious"""
        return ip_address in self.suspicious_ips
    
    def get_ip_risk_score(self, ip_address: str) -> int:
        """Calculate risk score for an IP address (0-100)"""
        score = 0
        
        # Failed attempts contribute to risk
        failed_attempts = self.ip_failed_attempts.get(ip_address, 0)
        score += min(failed_attempts * 10, 50)  # Max 50 points for failed attempts
        
        # Suspicious IP status
        if ip_address in self.suspicious_ips:
            score += 30
        
        # Multiple successful logins (potential shared account)
        successful_logins = self.ip_successful_logins.get(ip_address, 0)
        if successful_logins > 3:
            score += min((successful_logins - 3) * 5, 20)  # Max 20 points
        
        return min(score, 100)
    
    def analyze_login_patterns(self, ip_address: str, user_agent: str) -> Dict:
        """Analyze login patterns for suspicious activity"""
        analysis = {
            "ip_address": ip_address,
            "risk_score": self.get_ip_risk_score(ip_address),
            "is_suspicious": self.is_ip_suspicious(ip_address),
            "failed_attempts": self.ip_failed_attempts.get(ip_address, 0),
            "successful_logins": self.ip_successful_logins.get(ip_address, 0),
            "recommendations": []
        }
        
        # Generate recommendations based on analysis
        if analysis["risk_score"] > 70:
            analysis["recommendations"].append("Consider blocking this IP address")
        elif analysis["risk_score"] > 50:
            analysis["recommendations"].append("Monitor this IP address closely")
        elif analysis["risk_score"] > 30:
            analysis["recommendations"].append("Consider additional verification for this IP")
        
        return analysis

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

        # Read and analyze alert logs if file exists
        if self.alert_log_file.exists():
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