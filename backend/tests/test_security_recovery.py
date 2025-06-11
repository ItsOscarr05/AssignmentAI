import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from app.core.config import settings
from app.models.user import User
from app.models.security import SecurityAlert, AuditLog, TwoFactorSetup
from app.core.security import create_access_token
from app.services.security_service import SecurityService

@pytest.fixture
def security_service():
    return SecurityService()

class TestSecurityRecovery:
    @pytest.fixture(autouse=True)
    def setup(self, db: Session, test_user: User):
        self.db = db
        self.test_user = test_user
        self.access_token = create_access_token(test_user.id)
        self.headers = {"Authorization": f"Bearer {self.access_token}"}

    def test_partial_2fa_setup_recovery(self, client: TestClient):
        """Test recovery from partial 2FA setup"""
        # Step 1: Start 2FA setup
        response = client.post(
            "/api/auth/2fa/setup",
            headers=self.headers
        )
        assert response.status_code == 200
        setup_id = response.json()["setup_id"]

        # Step 2: Simulate network failure during setup
        # Delete the setup record to simulate incomplete setup
        self.db.query(TwoFactorSetup).filter(
            TwoFactorSetup.id == setup_id
        ).delete()
        self.db.commit()

        # Step 3: Attempt to recover
        response = client.post(
            "/api/auth/2fa/recover",
            headers=self.headers
        )
        assert response.status_code == 200
        assert "setup_id" in response.json()

        # Step 4: Complete setup with new ID
        new_setup_id = response.json()["setup_id"]
        response = client.post(
            "/api/auth/2fa/verify",
            json={
                "setup_id": new_setup_id,
                "code": "123456"
            },
            headers=self.headers
        )
        assert response.status_code == 200

    def test_backup_code_recovery(self, client: TestClient):
        """Test backup code usage and regeneration"""
        # Step 1: Complete 2FA setup
        response = client.post(
            "/api/auth/2fa/setup",
            headers=self.headers
        )
        setup_id = response.json()["setup_id"]
        
        response = client.post(
            "/api/auth/2fa/verify",
            json={
                "setup_id": setup_id,
                "code": "123456"
            },
            headers=self.headers
        )
        backup_codes = response.json()["backup_codes"]

        # Step 2: Use backup code for login
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword"
            }
        )
        token = login_response.json()["access_token"]

        response = client.post(
            "/api/auth/verify-2fa",
            json={
                "code": backup_codes[0],
                "is_backup_code": True
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

        # Step 3: Regenerate backup codes
        response = client.post(
            "/api/auth/2fa/regenerate-backup-codes",
            headers=self.headers
        )
        assert response.status_code == 200
        new_backup_codes = response.json()["backup_codes"]
        assert len(new_backup_codes) == 8
        assert new_backup_codes != backup_codes

        # Step 4: Verify old backup codes are invalid
        response = client.post(
            "/api/auth/verify-2fa",
            json={
                "code": backup_codes[0],
                "is_backup_code": True
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 401

    def test_network_failure_recovery(self, client: TestClient):
        """Test recovery from network failures during security operations"""
        # Step 1: Simulate network failure during login
        def mock_failed_request(*args, **kwargs):
            raise ConnectionError("Network failure")

        with pytest.MonkeyPatch.context() as m:
            m.setattr("app.api.endpoints.auth.login", mock_failed_request)
            
            response = client.post(
                "/api/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpassword"
                }
            )
            assert response.status_code == 503

        # Step 2: Verify system recovers and allows login
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword"
            }
        )
        assert response.status_code == 200

    def test_session_recovery(self, client: TestClient):
        """Test recovery from invalid or expired sessions"""
        # Step 1: Create expired session
        expired_token = jwt.encode(
            {
                "sub": str(self.test_user.id),
                "exp": datetime.utcnow() - timedelta(minutes=15)
            },
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

        # Step 2: Attempt to use expired token
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401

        # Step 3: Verify refresh token works
        refresh_response = client.post(
            "/api/auth/refresh",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert refresh_response.status_code == 200
        new_token = refresh_response.json()["access_token"]

        # Step 4: Verify new token works
        response = client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {new_token}"}
        )
        assert response.status_code == 200

    def test_rate_limit_recovery(self, client: TestClient):
        """Test recovery from rate limiting"""
        # Step 1: Trigger rate limit
        for _ in range(5):
            response = client.post(
                "/api/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "wrongpassword"
                }
            )
            assert response.status_code == 401

        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword"
            }
        )
        assert response.status_code == 429

        # Step 2: Wait for rate limit to reset
        import time
        time.sleep(60)  # Assuming rate limit window is 1 minute

        # Step 3: Verify system recovers and allows login
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword"
            }
        )
        assert response.status_code == 200

    def test_security_alert_recovery(self, client: TestClient):
        """Test recovery from security alerts"""
        # Step 1: Trigger security alert
        for _ in range(3):
            response = client.post(
                "/api/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "wrongpassword"
                }
            )
            assert response.status_code == 401

        # Step 2: Verify account is locked
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword"
            }
        )
        assert response.status_code == 403
        assert "account locked" in response.json()["detail"].lower()

        # Step 3: Request account unlock
        response = client.post(
            "/api/auth/unlock",
            json={
                "email": "test@example.com",
                "unlock_token": "test_unlock_token"
            }
        )
        assert response.status_code == 200

        # Step 4: Verify account is unlocked
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpassword"
            }
        )
        assert response.status_code == 200

def test_password_recovery(client: TestClient, test_user: User):
    """Test password recovery flow"""
    # Request password reset
    response = client.post(
        f"{settings.API_V1_STR}/auth/forgot-password",
        json={"email": test_user.email}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Get reset token (in a real scenario, this would be sent via email)
    reset_token = create_access_token(
        test_user.id,
        expires_delta=timedelta(minutes=15),
        subject="password_reset"
    )
    
    # Reset password
    response = client.post(
        f"{settings.API_V1_STR}/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Try logging in with new password
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user.email,
            "password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK

def test_2fa_recovery(client: TestClient, test_user: User):
    """Test 2FA recovery flow"""
    # Setup 2FA first
    response = client.post(
        f"{settings.API_V1_STR}/auth/2fa/setup",
        headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"}
    )
    assert response.status_code == status.HTTP_200_OK
    setup_data = response.json()
    
    # Verify 2FA setup
    response = client.post(
        f"{settings.API_V1_STR}/auth/2fa/verify",
        headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"},
        json={"code": "123456"}  # Mock code
    )
    assert response.status_code == status.HTTP_200_OK
    backup_codes = response.json()["backup_codes"]
    
    # Try recovery with backup code
    response = client.post(
        f"{settings.API_V1_STR}/auth/2fa/recover",
        json={
            "email": test_user.email,
            "backup_code": backup_codes[0]
        }
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verify 2FA is disabled
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers={"Authorization": f"Bearer {create_access_token(test_user.id)}"}
    )
    assert response.status_code == status.HTTP_200_OK
    user_data = response.json()
    assert user_data["two_factor_enabled"] is False

def test_account_recovery_flow(client: TestClient, test_user: User):
    """Test complete account recovery flow"""
    # Lock account
    for _ in range(settings.MAX_LOGIN_ATTEMPTS + 1):
        response = client.post(
            f"{settings.API_V1_STR}/auth/login",
            data={
                "username": test_user.email,
                "password": "wrongpassword"
            }
        )
    
    # Request account unlock
    response = client.post(
        f"{settings.API_V1_STR}/auth/unlock-account",
        json={"email": test_user.email}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Get unlock token (in a real scenario, this would be sent via email)
    unlock_token = create_access_token(
        test_user.id,
        expires_delta=timedelta(minutes=15),
        subject="account_unlock"
    )
    
    # Unlock account
    response = client.post(
        f"{settings.API_V1_STR}/auth/verify-unlock",
        json={
            "token": unlock_token,
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verify account is unlocked
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user.email,
            "password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK 