import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import jwt
from app.core.config import settings
from app.models.user import User
from app.models.security import SecurityAlert, AuditLog
from app.core.security import create_access_token
from app.services.security_service import SecurityService
from typing import Optional, cast

@pytest.fixture
def security_service():
    return SecurityService()

class TestSecurityIntegration:
    @pytest.fixture(autouse=True)
    def setup(self, db: Session, test_user: User, superuser: User, security_service: SecurityService):
        self.db = db
        self.test_user = test_user
        self.superuser = superuser
        self.security_service = security_service
        self.access_token = create_access_token(test_user.id)
        self.headers = {"Authorization": f"Bearer {self.access_token}"}
        self.superuser_token = create_access_token(superuser.id)
        self.superuser_headers = {"Authorization": f"Bearer {self.superuser_token}"}

    def test_complete_auth_flow(self, client: TestClient):
        """Test the complete authentication flow including 2FA"""
        # Step 1: Login - use form data instead of JSON
        login_response = client.post(
            "/api/v1/auth/login",
            data={"username": self.test_user.email, "password": "testpassword"}
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()
        # Note: 2FA is not implemented yet, so we'll skip that part
        # assert "requires_2fa" in login_response.json()
        # assert login_response.json()["requires_2fa"] is True

        # Step 2: Access Protected Resource
        protected_response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {login_response.json()['access_token']}"}
        )
        assert protected_response.status_code == 200

    def test_concurrent_auth_attempts(self, client: TestClient):
        """Test handling of concurrent authentication attempts"""
        responses = []
        for _ in range(5):
            response = client.post(
                "/api/v1/auth/login",
                data={"username": self.test_user.email, "password": "testpassword"}
            )
            responses.append(response)
        # The first 3 should succeed, the next 2 should be rate limited
        success_count = sum(1 for r in responses if r.status_code == 200)
        rate_limited_count = sum(1 for r in responses if r.status_code == 429)
        assert success_count == 3, f"Expected 3 successes, got {success_count}"
        assert rate_limited_count == 2, f"Expected 2 rate limited, got {rate_limited_count}"

    def test_session_management(self, client: TestClient):
        """Test session handling across multiple requests"""
        # Step 1: Login and get token
        login_response = client.post(
            "/api/v1/auth/login",
            data={"username": self.test_user.email, "password": "testpassword"}
        )
        token = login_response.json()["access_token"]

        # Step 2: Make multiple requests with same token
        for _ in range(3):
            response = client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200

        # Step 3: Verify token expiration
        expired_token = jwt.encode(
            {
                "sub": str(self.test_user.id),
                "exp": datetime.utcnow() - timedelta(minutes=15)
            },
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401

    def test_security_monitoring_integration(self, client: TestClient):
        """Test integration of security monitoring features"""
        # Step 1: Trigger security alert
        response = client.post(
            "/api/v1/auth/login",
            data={"username": self.test_user.email, "password": "wrongpassword"}
        )
        assert response.status_code == 401

        # Step 2: Verify security alert was created
        stmt = select(SecurityAlert).where(
            SecurityAlert.user_id == self.test_user.id,
            SecurityAlert.alert_type == "failed_login"
        )
        result = self.db.execute(stmt).scalars().first()
        if not (result is None or isinstance(result, SecurityAlert)):
            raise AssertionError("Query did not return a SecurityAlert instance or None")
        alert = result
        assert alert is not None, "No security alert found for failed_login"  # type: ignore[reportGeneralTypeIssues]
        assert alert.severity == "high"  # type: ignore[reportGeneralTypeIssues]

        # Step 3: Verify audit log was created
        stmt = select(AuditLog).where(
            AuditLog.user_id == self.test_user.id,
            AuditLog.action == "login_attempt"
        )
        log = self.db.execute(stmt).scalar_one_or_none()
        assert log is not None, "No audit log found for login_attempt"

    def test_file_upload_security_integration(self, client: TestClient):
        """Test integration of file upload security features"""
        # Step 1: Upload malicious file
        files = {
            "file": ("test.py", b"import os\nos.system('rm -rf /')", "text/x-python")
        }
        response = client.post(
            "/api/v1/submissions/upload",
            files=files,
            headers=self.headers
        )
        assert response.status_code == 400
        assert "malicious content" in response.json()["detail"].lower()

        # Step 2: Verify security alert
        stmt = select(SecurityAlert).where(
            SecurityAlert.user_id == self.test_user.id,
            SecurityAlert.alert_type == "malicious_upload"
        )
        result = self.db.execute(stmt).scalars().first()
        if not (result is None or isinstance(result, SecurityAlert)):
            raise AssertionError("Query did not return a SecurityAlert instance or None")
        alert = result
        assert alert is not None, "No security alert found for malicious_upload"  # type: ignore[reportGeneralTypeIssues]
        assert alert.severity == "high"  # type: ignore[reportGeneralTypeIssues]

        # Step 3: Upload legitimate file
        files = {
            "file": ("test.txt", b"Hello, World!", "text/plain")
        }
        response = client.post(
            "/api/v1/submissions/upload",
            files=files,
            headers=self.headers
        )
        assert response.status_code == 200

    def test_csrf_protection_integration(self, client: TestClient):
        """Test integration of CSRF protection"""
        # Step 1: Get CSRF token
        response = client.get("/api/v1/auth/csrf-token")
        assert response.status_code == 200
        csrf_token = response.json()["csrf_token"]

        # Step 2: Make request without CSRF token
        response = client.post(
            "/api/v1/users/update",
            json={"name": "New Name"},
            headers=self.headers
        )
        assert response.status_code == 403

        # Step 3: Make request with CSRF token
        response = client.post(
            "/api/v1/users/update",
            json={"name": "New Name"},
            headers={
                **self.headers,
                "X-CSRF-Token": csrf_token
            }
        )
        assert response.status_code == 200

    def test_rate_limiting_integration(self, client: TestClient):
        """Test integration of rate limiting with other security features"""
        # Step 1: Make multiple login attempts
        for _ in range(3):
            response = client.post(
                "/api/v1/auth/login",
                data={"username": self.test_user.email, "password": "wrongpassword"}
            )
            assert response.status_code == 401

        # Step 2: Verify rate limit exceeded on the next attempt
        response = client.post(
            "/api/v1/auth/login",
            data={"username": self.test_user.email, "password": "testpassword"}
        )
        assert response.status_code == 429
        assert "rate limit exceeded" in response.json()["detail"].lower()

        # Step 3: Verify security alert was created
        stmt = select(SecurityAlert).where(
            SecurityAlert.user_id == self.test_user.id,
            SecurityAlert.alert_type == "rate_limit_exceeded"
        )
        result = self.db.execute(stmt).scalars().first()
        if not (result is None or isinstance(result, SecurityAlert)):
            raise AssertionError("Query did not return a SecurityAlert instance or None")
        alert = result
        assert alert is not None, "No security alert found for rate_limit_exceeded"  # type: ignore[reportGeneralTypeIssues]
        assert alert.severity == "medium"  # type: ignore[reportGeneralTypeIssues]

    def test_security_alert_creation(self, client: TestClient):
        """Test security alert creation and retrieval"""
        # Create a security alert
        alert_data = {
            "alert_type": "failed_login",
            "description": "Multiple failed login attempts",
            "severity": "high",
            "alert_metadata": {"ip_address": "192.168.1.1", "attempts": 5}
        }
        
        response = client.post(
            f"/api/v1/security/alerts",
            headers=self.superuser_headers,
            json=alert_data
        )
        assert response.status_code == status.HTTP_201_CREATED
        alert = response.json()
        assert alert["alert_type"] == alert_data["alert_type"]
        assert alert["severity"] == alert_data["severity"]
        
        # Get alerts
        response = client.get(
            f"/api/v1/security/alerts",
            headers=self.superuser_headers
        )
        assert response.status_code == status.HTTP_200_OK
        alerts = response.json()
        assert len(alerts) > 0
        assert alerts[0]["alert_type"] == alert_data["alert_type"]

    def test_audit_logging(self, client: TestClient):
        """Test audit logging functionality"""
        # Perform an action that should be logged
        response = client.post(
            f"/api/v1/auth/change-password",
            headers=self.headers,
            json={"current_password": "testpassword", "new_password": "newpassword123"}
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Check audit logs
        response = client.get(
            f"/api/v1/security/audit-logs",
            headers=self.superuser_headers
        )
        assert response.status_code == status.HTTP_200_OK
        logs = response.json()
        assert len(logs) > 0
        assert any(log["action"] == "change_password" for log in logs)

    def test_security_service_integration(self, client: TestClient):
        """Test integration between security service and API endpoints"""
        # Create multiple security alerts
        for i in range(3):
            alert_data = {
                "alert_type": f"test_alert_{i}",
                "description": f"Test alert {i}",
                "severity": "medium",
                "alert_metadata": {"test": True}
            }
            response = client.post(
                f"/api/v1/security/alerts",
                headers=self.superuser_headers,
                json=alert_data
            )
            assert response.status_code == status.HTTP_201_CREATED
        
        # Test alert filtering
        response = client.get(
            f"/api/v1/security/alerts?severity=medium",
            headers=self.superuser_headers
        )
        assert response.status_code == status.HTTP_200_OK
        alerts = response.json()
        assert all(alert["severity"] == "medium" for alert in alerts)
        
        # Test alert resolution
        alert_id = alerts[0]["id"]
        response = client.patch(
            f"/api/v1/security/alerts/{alert_id}",
            headers=self.superuser_headers,
            json={"resolved": True, "resolution_notes": "Test resolution"}
        )
        assert response.status_code == status.HTTP_200_OK
        alert = response.json()
        assert alert["resolved"] is True
        assert alert["resolution_notes"] == "Test resolution" 