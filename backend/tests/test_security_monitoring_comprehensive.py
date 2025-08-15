import pytest
import json
import tempfile
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from app.services.security_monitoring import SecurityMonitoringService
from app.models.user import User
from app.core.config import settings


class TestSecurityMonitoringService:
    @pytest.fixture
    def security_service(self):
        """Create a security monitoring service with temporary directories"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Mock the logs directory
            with patch('app.services.security_monitoring.settings') as mock_settings:
                mock_settings.LOGS_DIR = temp_dir
                mock_settings.ALERT_THRESHOLDS = {
                    "failed_login_attempts": 5,
                    "rate_limit_violations": 10
                }
                service = SecurityMonitoringService()
                yield service

    @pytest.fixture
    def mock_user(self):
        """Create a mock user"""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.failed_login_attempts = 3
        return user

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session"""
        return Mock()

    def test_init_creates_directories(self, security_service):
        """Test that initialization creates necessary directories"""
        assert security_service.log_dir.exists()
        assert security_service.alert_log_file.parent.exists()

    def test_log_security_alert_critical(self, security_service):
        """Test logging critical security alerts"""
        with patch('app.services.security_monitoring.logger') as mock_logger:
            security_service.log_security_alert(
                "TEST_ALERT",
                "CRITICAL",
                {"test": "data"},
                user_id=1,
                ip_address="192.168.1.1"
            )
            
            # Check that alert was logged to file
            assert security_service.alert_log_file.exists()
            with open(security_service.alert_log_file, "r") as f:
                content = f.read()
                assert "TEST_ALERT" in content
                assert "CRITICAL" in content
            
            # Check that logger was called
            mock_logger.critical.assert_called_once()

    def test_log_security_alert_high(self, security_service):
        """Test logging high severity alerts"""
        with patch('app.services.security_monitoring.logger') as mock_logger:
            with patch.object(security_service, '_send_security_alert') as mock_notify:
                security_service.log_security_alert(
                    "TEST_ALERT",
                    "HIGH",
                    {"test": "data"},
                    user_id=1
                )
                mock_logger.error.assert_called_once()
                mock_notify.assert_called_once()

    def test_log_security_alert_medium(self, security_service):
        """Test logging medium severity alerts"""
        with patch('app.services.security_monitoring.logger') as mock_logger:
            security_service.log_security_alert(
                "TEST_ALERT",
                "MEDIUM",
                {"test": "data"}
            )
            
            mock_logger.warning.assert_called_once()

    def test_log_security_alert_low(self, security_service):
        """Test logging low severity alerts"""
        with patch('app.services.security_monitoring.logger') as mock_logger:
            security_service.log_security_alert(
                "TEST_ALERT",
                "LOW",
                {"test": "data"}
            )
            
            mock_logger.info.assert_called_once()

    @patch('app.services.security_monitoring.smtplib.SMTP')
    def test_send_security_alert_success(self, mock_smtp, security_service):
        """Test successful security alert sending"""
        with patch('app.services.security_monitoring.settings') as mock_settings:
            mock_settings.ALERT_EMAIL = "admin@example.com"
            mock_settings.SMTP_FROM_EMAIL = "noreply@example.com"
            mock_settings.SMTP_USERNAME = "test"
            mock_settings.SMTP_PASSWORD = "test"
            
            alert = {
                "alert_type": "TEST_ALERT",
                "severity": "HIGH",
                "timestamp": "2023-01-01T00:00:00",
                "user_id": 1,
                "ip_address": "192.168.1.1",
                "details": {"test": "data"}
            }
            
            mock_server = Mock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            security_service._send_security_alert(alert)
            
            mock_smtp.assert_called_once_with("smtp.gmail.com", 587)
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once_with("test", "test")
            mock_server.send_message.assert_called_once()

    @patch('app.services.security_monitoring.smtplib.SMTP')
    def test_send_security_alert_failure(self, mock_smtp, security_service):
        """Test security alert sending failure"""
        with patch('app.services.security_monitoring.settings') as mock_settings:
            mock_settings.ALERT_EMAIL = "admin@example.com"
            mock_settings.SMTP_FROM_EMAIL = "noreply@example.com"
            mock_settings.SMTP_USERNAME = "test"
            mock_settings.SMTP_PASSWORD = "test"
            
            alert = {
                "alert_type": "TEST_ALERT",
                "severity": "HIGH",
                "timestamp": "2023-01-01T00:00:00",
                "user_id": 1,
                "ip_address": "192.168.1.1",
                "details": {"test": "data"}
            }
            
            mock_smtp.side_effect = Exception("SMTP Error")
            
            with patch('app.services.security_monitoring.logger') as mock_logger:
                security_service._send_security_alert(alert)
                mock_logger.error.assert_called_once()

    def test_send_security_alert_no_alert_email(self, security_service):
        """Test security alert when no alert email is configured"""
        with patch('app.services.security_monitoring.settings') as mock_settings:
            mock_settings.ALERT_EMAIL = None
            
            alert = {
                "alert_type": "TEST_ALERT",
                "severity": "HIGH",
                "timestamp": "2023-01-01T00:00:00",
                "user_id": 1,
                "ip_address": "192.168.1.1",
                "details": {"test": "data"}
            }
            
            # Should not raise any exception
            security_service._send_security_alert(alert)

    def test_track_failed_login_attempts_below_threshold(self, security_service, mock_user, mock_db):
        """Test tracking failed login attempts below threshold"""
        with patch('app.services.security_monitoring.settings') as mock_settings:
            mock_settings.MAX_LOGIN_ATTEMPTS = 5
            
            with patch.object(security_service, 'log_security_alert') as mock_log:
                security_service.track_failed_login_attempts(mock_db, mock_user, "192.168.1.1")
                mock_log.assert_not_called()

    def test_track_failed_login_attempts_above_threshold(self, security_service, mock_user, mock_db):
        """Test tracking failed login attempts above threshold"""
        with patch('app.services.security_monitoring.settings') as mock_settings:
            mock_settings.MAX_LOGIN_ATTEMPTS = 5
            mock_settings.LOGIN_TIMEOUT_MINUTES = 30
            
            mock_user.failed_login_attempts = 5
            
            with patch.object(security_service, 'log_security_alert') as mock_log:
                security_service.track_failed_login_attempts(mock_db, mock_user, "192.168.1.1")
                mock_log.assert_called_once()

    def test_track_suspicious_activity(self, security_service, mock_user, mock_db):
        """Test tracking suspicious activity"""
        with patch.object(security_service, 'log_security_alert') as mock_log:
            security_service.track_suspicious_activity(
                mock_db, 
                mock_user, 
                "UNUSUAL_LOGIN", 
                {"location": "unknown"}
            )
            mock_log.assert_called_once()

    def test_track_rate_limit_violation(self, security_service):
        """Test tracking rate limit violations"""
        with patch.object(security_service, 'log_security_alert') as mock_log:
            security_service.track_rate_limit_violation(
                "192.168.1.1",
                "/api/login",
                15
            )
            mock_log.assert_called_once()

    def test_track_2fa_attempts_success(self, security_service, mock_user):
        """Test tracking successful 2FA attempts"""
        with patch.object(security_service, 'log_security_alert') as mock_log:
            security_service.track_2fa_attempts(mock_user, True, "192.168.1.1")
            mock_log.assert_not_called()

    def test_track_2fa_attempts_failure(self, security_service, mock_user):
        """Test tracking failed 2FA attempts"""
        with patch.object(security_service, 'log_security_alert') as mock_log:
            security_service.track_2fa_attempts(mock_user, False, "192.168.1.1")
            mock_log.assert_called_once()

    def test_generate_security_report_no_alerts(self, security_service):
        """Test generating security report with no alerts"""
        start_date = datetime(2023, 1, 1)
        end_date = datetime(2023, 1, 2)
        
        report = security_service.generate_security_report(start_date, end_date)
        
        assert report["period"]["start"] == start_date.isoformat()
        assert report["period"]["end"] == end_date.isoformat()
        assert report["alerts"]["total"] == 0
        assert report["alerts"]["by_severity"] == {}
        assert report["alerts"]["by_type"] == {}

    def test_generate_security_report_with_alerts(self, security_service):
        """Test generating security report with alerts"""
        # Create some test alerts
        test_alerts = [
            {
                "timestamp": "2023-01-01T12:00:00",
                "alert_type": "ACCOUNT_LOCKED",
                "severity": "HIGH",
                "user_id": 1,
                "ip_address": "192.168.1.1",
                "details": {"failed_attempts": 5}
            },
            {
                "timestamp": "2023-01-01T13:00:00",
                "alert_type": "RATE_LIMIT_VIOLATION",
                "severity": "MEDIUM",
                "user_id": None,
                "ip_address": "192.168.1.2",
                "details": {"endpoint": "/api/login", "attempts": 15}
            }
        ]
        
        # Write test alerts to file
        with open(security_service.alert_log_file, "w") as f:
            for alert in test_alerts:
                f.write(json.dumps(alert) + "\n")
        
        start_date = datetime(2023, 1, 1)
        end_date = datetime(2023, 1, 2)
        
        report = security_service.generate_security_report(start_date, end_date)
        
        assert report["alerts"]["total"] == 2
        assert report["alerts"]["by_severity"]["HIGH"] == 1
        assert report["alerts"]["by_severity"]["MEDIUM"] == 1
        assert report["alerts"]["by_type"]["ACCOUNT_LOCKED"] == 1
        assert report["alerts"]["by_type"]["RATE_LIMIT_VIOLATION"] == 1

    def test_generate_security_report_outside_date_range(self, security_service):
        """Test generating security report with alerts outside date range"""
        # Create test alert outside the date range
        test_alert = {
            "timestamp": "2023-02-01T12:00:00",  # Outside range
            "alert_type": "ACCOUNT_LOCKED",
            "severity": "HIGH",
            "user_id": 1,
            "ip_address": "192.168.1.1",
            "details": {"failed_attempts": 5}
        }
        
        # Write test alert to file
        with open(security_service.alert_log_file, "w") as f:
            f.write(json.dumps(test_alert) + "\n")
        
        start_date = datetime(2023, 1, 1)
        end_date = datetime(2023, 1, 2)
        
        report = security_service.generate_security_report(start_date, end_date)
        
        assert report["alerts"]["total"] == 0

    def test_update_security_metrics(self, security_service):
        """Test updating security metrics"""
        security_service.update_security_metrics()
        
        assert security_service.metrics_file.exists()
        with open(security_service.metrics_file, "r") as f:
            metrics = json.load(f)
            assert "timestamp" in metrics
            assert "active_users" in metrics
            assert "failed_login_attempts" in metrics
            assert "rate_limit_violations" in metrics
            assert "2fa_enabled_users" in metrics
            assert "locked_accounts" in metrics

    def test_log_security_alert_with_complex_details(self, security_service):
        """Test logging security alert with complex nested details"""
        complex_details = {
            "nested": {
                "data": [1, 2, 3],
                "dict": {"key": "value"}
            },
            "array": ["item1", "item2"],
            "boolean": True,
            "number": 42
        }
        
        security_service.log_security_alert(
            "COMPLEX_ALERT",
            "HIGH",
            complex_details,
            user_id=1,
            ip_address="192.168.1.1"
        )
        
        # Verify the alert was logged
        assert security_service.alert_log_file.exists()
        with open(security_service.alert_log_file, "r") as f:
            content = f.read()
            alert = json.loads(content.strip())
            assert alert["alert_type"] == "COMPLEX_ALERT"
            assert alert["severity"] == "HIGH"
            assert alert["details"] == complex_details

    def test_log_security_alert_without_optional_fields(self, security_service):
        """Test logging security alert without optional user_id and ip_address"""
        security_service.log_security_alert(
            "MINIMAL_ALERT",
            "LOW",
            {"test": "data"}
        )
        
        # Verify the alert was logged
        assert security_service.alert_log_file.exists()
        with open(security_service.alert_log_file, "r") as f:
            content = f.read()
            alert = json.loads(content.strip())
            assert alert["alert_type"] == "MINIMAL_ALERT"
            assert alert["severity"] == "LOW"
            assert alert["user_id"] is None
            assert alert["ip_address"] is None 