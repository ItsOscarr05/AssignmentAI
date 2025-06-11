import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.core.config import settings
from app.models.user import User
from app.core.security import create_access_token
from app.schemas.auth import TokenResponse
from datetime import datetime, timedelta
import jwt
from app.models.security import AuditLog, SecurityAlert
from app.services.security_service import SecurityService
from app.services.file_service import FileService
from app.middleware.csrf import CSRFMiddleware

@pytest.fixture
async def test_user():
    return {
        "email": "test@example.com",
        "password": "Test123!@#",
        "full_name": "Test User",
    }

@pytest.fixture
async def test_token(test_user):
    return jwt.encode(
        {
            "sub": test_user["email"],
            "exp": datetime.utcnow() + timedelta(minutes=30),
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

class TestSecurity:
    @pytest.fixture(autouse=True)
    async def setup(self, test_user, test_token):
        self.test_user = test_user
        self.test_token = test_token
        self.headers = {"Authorization": f"Bearer {test_token}"}

    async def test_jwt_authentication(self, client: TestClient):
        """Test JWT authentication flow"""
        # Test login
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": self.test_user["email"],
                "password": "testpassword123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        token_data = response.json()
        assert "access_token" in token_data
        assert "refresh_token" in token_data

        # Test protected endpoint with token
        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )
        assert response.status_code == status.HTTP_200_OK
        user_data = response.json()
        assert user_data["email"] == self.test_user["email"]

        # Test invalid token
        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_2fa_setup_and_verification(self, client: TestClient):
        """Test 2FA setup and verification flow"""
        # Login first
        login_response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": self.test_user["email"],
                "password": "testpassword123"
            }
        )
        token_data = login_response.json()
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}

        # Start 2FA setup
        response = client.post(
            f"{settings.API_V1_STR}/auth/2fa/setup",
            headers=headers
        )
        assert response.status_code == status.HTTP_200_OK
        setup_data = response.json()
        assert "qr_code" in setup_data
        assert "secret" in setup_data

        # Verify 2FA setup
        response = client.post(
            f"{settings.API_V1_STR}/auth/2fa/verify",
            headers=headers,
            json={"code": "123456"}  # Mock code
        )
        assert response.status_code == status.HTTP_200_OK
        assert "backup_codes" in response.json()

        # Test 2FA login
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": self.test_user["email"],
                "password": "testpassword123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        assert "requires_2fa" in response.json()

    async def test_rate_limiting(self, client: TestClient):
        """Test rate limiting for authentication endpoints"""
        # Test login rate limiting
        for _ in range(5):  # Assuming limit is 5 attempts
            response = client.post(
                f"{settings.API_V1_STR}/auth/login",
                data={
                    "username": "test@example.com",
                    "password": "wrongpassword"
                }
            )
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Next attempt should be rate limited
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": "test@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    async def test_csrf_protection(self, client: TestClient):
        """Test CSRF protection"""
        # Get CSRF token
        response = client.get(f"{settings.API_V1_STR}/auth/csrf-token")
        assert response.status_code == status.HTTP_200_OK
        csrf_token = response.cookies["csrf_token"]

        # Test protected endpoint without CSRF token
        response = client.post(
            f"{settings.API_V1_STR}/auth/change-password",
            headers={"Authorization": f"Bearer {self.test_token}"},
            json={"current_password": "testpassword123", "new_password": "newpassword123"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Test with CSRF token
        response = client.post(
            f"{settings.API_V1_STR}/auth/change-password",
            headers={
                "Authorization": f"Bearer {self.test_token}",
                "X-CSRF-Token": csrf_token
            },
            json={"current_password": "testpassword123", "new_password": "newpassword123"}
        )
        assert response.status_code == status.HTTP_200_OK

    async def test_file_upload_security(self, client: TestClient):
        """Test file upload security measures"""
        # Test file size limit
        large_file = b"x" * (settings.MAX_FILE_SIZE + 1)
        files = {
            "file": ("large.pdf", large_file, "application/pdf")
        }
        response = client.post(
            f"{settings.API_V1_STR}/submissions/upload",
            headers={"Authorization": f"Bearer {self.test_token}"},
            files=files
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "File size exceeds limit" in response.json()["detail"]

        # Test file type validation
        files = {
            "file": ("test.exe", b"test", "application/x-msdownload")
        }
        response = client.post(
            f"{settings.API_V1_STR}/submissions/upload",
            headers={"Authorization": f"Bearer {self.test_token}"},
            files=files
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "File type not allowed" in response.json()["detail"]

        # Test malicious file content
        files = {
            "file": ("test.pdf", b"<?php echo 'malicious'; ?>", "application/pdf")
        }
        response = client.post(
            f"{settings.API_V1_STR}/submissions/upload",
            headers={"Authorization": f"Bearer {self.test_token}"},
            files=files
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid file content" in response.json()["detail"]

    async def test_security_headers(self, client: TestClient):
        """Test security headers"""
        response = client.get(f"{settings.API_V1_STR}/health")
        assert response.status_code == status.HTTP_200_OK
        headers = response.headers
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "X-XSS-Protection" in headers
        assert "Strict-Transport-Security" in headers
        assert "Content-Security-Policy" in headers

    async def test_security_monitoring(self, client: TestClient):
        """Test security monitoring features"""
        # Trigger a security alert
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Check if alert was created
        alert = SecurityAlert.objects.filter(
            type="failed_login", email="test@example.com"
        ).first()
        assert alert is not None
        assert alert.severity == "medium"

    async def test_audit_logging(self, client: TestClient):
        """Test audit logging functionality"""
        # Perform an action that should be logged
        response = client.get(
            f"{settings.API_V1_STR}/auth/me",
            headers={"Authorization": f"Bearer {self.test_token}"},
        )
        assert response.status_code == status.HTTP_200_OK

        # Check if action was logged
        log = AuditLog.objects.filter(
            user_email="test@example.com", action="get_profile"
        ).first()
        assert log is not None
        assert log.status == "success" 