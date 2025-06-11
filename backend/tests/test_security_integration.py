import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from app.core.config import settings
from app.models.user import User
from app.models.security import SecurityAlert, AuditLog
from app.core.security import create_access_token
from app.services.security_service import SecurityService

@pytest.fixture
async def security_service():
    return SecurityService()

class TestSecurityIntegration:
    @pytest.fixture(autouse=True)
    async def setup(self, db: Session, test_user: User):
        self.db = db
        self.test_user = test_user
        self.access_token = create_access_token(test_user.id)
        self.headers = {"Authorization": f"Bearer {self.access_token}"}

    async def test_complete_auth_flow(self, client: TestClient):
        """Test the complete authentication flow including 2FA"""
        # Step 1: Login
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"}
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()
        assert "requires_2fa" in login_response.json()
        assert login_response.json()["requires_2fa"] is True

        # Step 2: 2FA Verification
        verify_response = client.post(
            "/api/auth/verify-2fa",
            json={"code": "123456"},
            headers={"Authorization": f"Bearer {login_response.json()['access_token']}"}
        )
        assert verify_response.status_code == 200
        assert "access_token" in verify_response.json()

        # Step 3: Access Protected Resource
        protected_response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {verify_response.json()['access_token']}"}
        )
        assert protected_response.status_code == 200

    async def test_concurrent_auth_attempts(self, client: TestClient):
        """Test handling of concurrent authentication attempts"""
        import asyncio

        async def make_login_request():
            response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "testpassword"}
            )
            return response.json()

        # Make 5 concurrent login attempts
        tasks = [make_login_request() for _ in range(5)]
        responses = await asyncio.gather(*tasks)

        # Verify rate limiting is working
        success_count = sum(1 for r in responses if r.get("status_code") == 200)
        assert success_count <= 3  # Assuming rate limit of 3 attempts per minute

    async def test_session_management(self, client: TestClient):
        """Test session handling across multiple requests"""
        # Step 1: Login and get token
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"}
        )
        token = login_response.json()["access_token"]

        # Step 2: Make multiple requests with same token
        for _ in range(3):
            response = client.get(
                "/api/users/me",
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
            "/api/users/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401

    async def test_security_monitoring_integration(self, client: TestClient):
        """Test integration of security monitoring features"""
        # Step 1: Trigger security alert
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401

        # Step 2: Verify security alert was created
        alert = self.db.query(SecurityAlert).filter(
            SecurityAlert.user_id == self.test_user.id,
            SecurityAlert.type == "failed_login"
        ).first()
        assert alert is not None
        assert alert.severity == "high"

        # Step 3: Verify audit log was created
        log = self.db.query(AuditLog).filter(
            AuditLog.user_id == self.test_user.id,
            AuditLog.action == "login_attempt"
        ).first()
        assert log is not None
        assert log.status == "failed"

    async def test_file_upload_security_integration(self, client: TestClient):
        """Test integration of file upload security features"""
        # Step 1: Upload malicious file
        files = {
            "file": ("test.py", b"import os\nos.system('rm -rf /')", "text/plain")
        }
        response = client.post(
            "/api/submissions/upload",
            files=files,
            headers=self.headers
        )
        assert response.status_code == 400
        assert "malicious content" in response.json()["detail"].lower()

        # Step 2: Verify security alert
        alert = self.db.query(SecurityAlert).filter(
            SecurityAlert.user_id == self.test_user.id,
            SecurityAlert.type == "malicious_upload"
        ).first()
        assert alert is not None
        assert alert.severity == "high"

        # Step 3: Upload legitimate file
        files = {
            "file": ("test.txt", b"Hello, World!", "text/plain")
        }
        response = client.post(
            "/api/submissions/upload",
            files=files,
            headers=self.headers
        )
        assert response.status_code == 200

    async def test_csrf_protection_integration(self, client: TestClient):
        """Test integration of CSRF protection"""
        # Step 1: Get CSRF token
        response = client.get("/api/auth/csrf-token")
        assert response.status_code == 200
        csrf_token = response.json()["csrf_token"]

        # Step 2: Make request without CSRF token
        response = client.post(
            "/api/users/update",
            json={"name": "New Name"},
            headers=self.headers
        )
        assert response.status_code == 403

        # Step 3: Make request with CSRF token
        response = client.post(
            "/api/users/update",
            json={"name": "New Name"},
            headers={
                **self.headers,
                "X-CSRF-Token": csrf_token
            }
        )
        assert response.status_code == 200

    async def test_rate_limiting_integration(self, client: TestClient):
        """Test integration of rate limiting with other security features"""
        # Step 1: Make multiple login attempts
        for _ in range(5):
            response = client.post(
                "/api/auth/login",
                json={"email": "test@example.com", "password": "wrongpassword"}
            )
            assert response.status_code == 401

        # Step 2: Verify rate limit exceeded
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpassword"}
        )
        assert response.status_code == 429
        assert "rate limit exceeded" in response.json()["detail"].lower()

        # Step 3: Verify security alert was created
        alert = self.db.query(SecurityAlert).filter(
            SecurityAlert.user_id == self.test_user.id,
            SecurityAlert.type == "rate_limit_exceeded"
        ).first()
        assert alert is not None
        assert alert.severity == "medium"

    async def test_security_alert_creation(self, client: TestClient, test_user: User, security_service: SecurityService):
        """Test security alert creation and retrieval"""
        # Create a security alert
        alert_data = {
            "alert_type": "failed_login",
            "description": "Multiple failed login attempts",
            "severity": "high",
            "alert_metadata": {"ip_address": "192.168.1.1", "attempts": 5}
        }
        
        response = client.post(
            f"{settings.API_V1_STR}/security/alerts",
            headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"},
            json=alert_data
        )
        assert response.status_code == status.HTTP_201_CREATED
        alert = response.json()
        assert alert["alert_type"] == alert_data["alert_type"]
        assert alert["severity"] == alert_data["severity"]
        
        # Get alerts
        response = client.get(
            f"{settings.API_V1_STR}/security/alerts",
            headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"}
        )
        assert response.status_code == status.HTTP_200_OK
        alerts = response.json()
        assert len(alerts) > 0
        assert alerts[0]["alert_type"] == alert_data["alert_type"]

    async def test_audit_logging(self, client: TestClient, test_user: User, security_service: SecurityService):
        """Test audit logging functionality"""
        # Perform an action that should be logged
        response = client.post(
            f"{settings.API_V1_STR}/auth/change-password",
            headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"},
            json={"current_password": "testpassword123", "new_password": "newpassword123"}
        )
        assert response.status_code == status.HTTP_200_OK
        
        # Check audit logs
        response = client.get(
            f"{settings.API_V1_STR}/security/audit-logs",
            headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"}
        )
        assert response.status_code == status.HTTP_200_OK
        logs = response.json()
        assert len(logs) > 0
        assert any(log["action"] == "change_password" for log in logs)

    async def test_security_service_integration(self, client: TestClient, test_user: User, security_service: SecurityService):
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
                f"{settings.API_V1_STR}/security/alerts",
                headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"},
                json=alert_data
            )
            assert response.status_code == status.HTTP_201_CREATED
        
        # Test alert filtering
        response = client.get(
            f"{settings.API_V1_STR}/security/alerts?severity=medium",
            headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"}
        )
        assert response.status_code == status.HTTP_200_OK
        alerts = response.json()
        assert all(alert["severity"] == "medium" for alert in alerts)
        
        # Test alert resolution
        alert_id = alerts[0]["id"]
        response = client.patch(
            f"{settings.API_V1_STR}/security/alerts/{alert_id}",
            headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"},
            json={"resolved": True, "resolution_notes": "Test resolution"}
        )
        assert response.status_code == status.HTTP_200_OK
        alert = response.json()
        assert alert["resolved"] is True
        assert alert["resolution_notes"] == "Test resolution" 