import pytest
from fastapi import status
from app.core.security import verify_password
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock
from app.crud import user as user_crud

def test_login_success(client, test_user):
    """Test successful login with valid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword",
        },
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data
    assert data["requires_2fa"] == False
    assert "user" in data
    assert data["user"]["email"] == test_user.email

def test_login_wrong_password(client, test_user):
    """Test login with incorrect password"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "wrongpassword",
        },
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["detail"] == "Incorrect email or password"

def test_login_inactive_user(client, test_user, db):
    """Test login with inactive user"""
    # Update user to inactive in database
    test_user.is_active = False
    db.commit()
    db.refresh(test_user)
    
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Account is deactivated"

def test_register_success(client):
    unique_id = str(uuid.uuid4())[:8]
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"newuser-{unique_id}@example.com",
            "password": "newpassword",
            "full_name": "New User",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["message"] == "User registered successfully"

def test_register_existing_email(client, test_user):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "password": "newpassword",
            "full_name": "New User",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Email already registered"

def test_get_current_user(client, test_user, test_token):
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.name
    assert data["role"] == "user"

def test_get_current_user_invalid_token(client):
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_verify_email(client, test_user, db):
    # Set user as unverified
    test_user.is_verified = False
    db.commit()
    db.refresh(test_user)
    
    # First, get the verification token
    token = test_user.generate_verification_token()
    response = client.get(f"/api/v1/auth/verify-email?token={token}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Email verified successfully"

def test_verify_email_invalid_token(client):
    response = client.get("/api/v1/auth/verify-email?token=invalid_token")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Invalid verification token"

def test_resend_verification_email(client, test_user, db):
    # Set user as unverified
    test_user.is_verified = False
    db.commit()
    db.refresh(test_user)
    
    response = client.post(
        "/api/v1/auth/resend-verification",
        json={"email": test_user.email},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Verification email sent"

def test_resend_verification_email_already_verified(client, test_user, db):
    # Ensure user is verified
    test_user.is_verified = True
    db.commit()
    db.refresh(test_user)
    
    response = client.post(
        "/api/v1/auth/resend-verification",
        json={"email": test_user.email},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Email already verified" 

def test_login_user_not_found(client):
    """Test login when user doesn't exist"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "testpassword",
        },
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["detail"] == "Incorrect email or password"

def test_login_internal_error(client, test_user, test_token):
    """Test login with internal error (e.g., DB error)"""
    with patch('sqlalchemy.orm.query.Query.first', side_effect=Exception("Database error")):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "password"},
        )
        assert response.status_code == 500
        assert response.json()["detail"] == "Internal server error during login"

def test_login_account_locked(client, test_user, db):
    """Test login with locked account"""
    # Lock the account by setting failed attempts
    test_user.failed_login_attempts = 5
    test_user.account_locked_until = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "testpassword"},
    )
    assert response.status_code == 423
    data = response.json()
    assert "Account temporarily locked" in data["detail"]

def test_login_csrf_protection(client, test_user):
    """Test CSRF protection for login"""
    # First get a CSRF token
    csrf_response = client.get("/api/v1/auth/csrf-token")
    assert csrf_response.status_code == 200
    csrf_token = csrf_response.json()["csrf_token"]
    
    # Try login with invalid CSRF token
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "testpassword"},
        headers={"X-CSRF-Token": "invalid_token"}
    )
    # Should still work since CSRF is optional for login
    assert response.status_code in [200, 401]  # Either success or auth failure, not CSRF error

def test_login_rate_limiting(client, test_user):
    """Test rate limiting for login attempts"""
    # Make multiple rapid login attempts
    for i in range(6):  # Exceed the rate limit
        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "wrongpassword"},
        )
        if response.status_code == 429:  # Rate limit exceeded
            break
    
    # Should eventually hit rate limit
    assert response.status_code == 429
    assert "Too many login attempts" in response.json()["detail"]

def test_logout_success(client, test_user, test_token):
    """Test successful logout"""
    with patch('app.api.v1.endpoints.auth.session_service.revoke_session') as mock_revoke:
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Successfully logged out"

def test_me_endpoint(client, test_user, test_token):
    """Test getting current user information via /me endpoint"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.name
    assert data["is_active"] == test_user.is_active
    assert data["is_verified"] == test_user.is_verified

def test_logout_all_success(client, test_user, test_token):
    """Test logout from all devices"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_get_service:
        mock_service = AsyncMock()
        mock_get_service.return_value = mock_service
        
        response = client.post(
            "/api/v1/auth/logout-all",
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Logged out from all devices"

def test_get_active_sessions(client, test_user, test_token):
    """Test getting active sessions"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_get_service:
        mock_service = AsyncMock()
        mock_service.get_user_sessions.return_value = [
            {"id": "session1", "created_at": "2025-01-01T00:00:00Z"}
        ]
        mock_get_service.return_value = mock_service
        
        response = client.get(
            "/api/v1/auth/sessions",
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

def test_revoke_session_success(client, test_user, test_token):
    """Test revoking a specific session"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_get_service:
        mock_service = AsyncMock()
        mock_get_service.return_value = mock_service
        
        response = client.delete(
            "/api/v1/auth/sessions/session123",
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Session revoked successfully"

def test_get_session_analytics_not_found(client, test_user, test_token):
    """Test getting session analytics when session not found"""
    # Mock user with no sessions
    mock_user = MagicMock()
    mock_user.sessions = []
    
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=mock_user):
        response = client.get(
            "/api/v1/auth/sessions/session123/analytics",
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data["detail"] == "Session not found"

def test_get_session_analytics_analytics_not_found(client, test_user, test_token):
    response = client.get(
        "/api/v1/auth/sessions/session123/analytics",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Session not found"

def test_track_session_activity_session_not_found(client, test_user, test_token):
    """Test tracking session activity when session not found"""
    # Mock user with no sessions
    mock_user = MagicMock()
    mock_user.sessions = []
    
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=mock_user):
        response = client.post(
            "/api/v1/auth/sessions/session123/activity",
            json={"activity": "test"},
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data["detail"] == "Session not found"

def test_2fa_setup_success(client, test_user, test_token):
    """Test 2FA setup"""
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.setup_2fa.return_value = ("TESTSECRET123", "base64_qr_code")
        
        response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "qr_code" in data
        assert "secret" in data
        assert data["message"] == "2FA setup initiated"

def test_2fa_setup_already_enabled(client, test_user, test_token, db):
    """Test 2FA setup when already enabled"""
    # Enable 2FA for test user
    test_user.two_factor_enabled = True
    db.commit()
    
    response = client.post(
        "/api/v1/auth/2fa/setup",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already enabled" in response.json()["detail"]

def test_2fa_verify_success(client, test_user, test_token):
    """Test 2FA verification during setup"""
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.confirm_2fa.return_value = True
        mock_2fa.generate_backup_codes.return_value = ["BACKUP1", "BACKUP2"]
        
        response = client.post(
            "/api/v1/auth/2fa/verify",
            json={"code": "123456"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "backup_codes" in data
        assert data["message"] == "2FA has been successfully enabled"

def test_2fa_verify_invalid_code(client, test_user, test_token):
    """Test 2FA verification with invalid code"""
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.confirm_2fa.return_value = False
        
        response = client.post(
            "/api/v1/auth/2fa/verify",
            json={"code": "123456"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid 2FA code" in response.json()["detail"]

def test_2fa_status(client, test_user, test_token, db):
    """Test getting 2FA status"""
    # Set up 2FA for test user
    test_user.two_factor_enabled = True
    test_user.backup_codes = ["CODE1", "CODE2", "CODE3"]
    db.commit()
    
    response = client.get(
        "/api/v1/auth/2fa/status",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["enabled"] == True
    assert data["has_backup_codes"] == True
    assert data["backup_codes_remaining"] == 3

def test_2fa_disable_success(client, test_user, test_token, db):
    """Test disabling 2FA"""
    # Enable 2FA for test user
    test_user.two_factor_enabled = True
    db.commit()
    
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        response = client.post(
            "/api/v1/auth/2fa/disable",
            json={"password": "testpassword"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "2FA has been successfully disabled"

def test_2fa_disable_invalid_password(client, test_user, test_token, db):
    """Test disabling 2FA with invalid password"""
    # Enable 2FA for test user
    test_user.two_factor_enabled = True
    db.commit()
    
    response = client.post(
        "/api/v1/auth/2fa/disable",
        json={"password": "wrongpassword"},
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid password" in response.json()["detail"]

def test_2fa_recovery_with_backup_code(client, test_user, test_token):
    """Test 2FA recovery with backup code"""
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.verify_backup_code.return_value = True
        
        response = client.post(
            "/api/v1/auth/2fa/recover",
            json={"backup_code": "BACKUP123"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Backup code verified successfully"
        assert data["2fa_disabled"] == True

def test_2fa_recovery_new_setup(client, test_user, test_token, db):
    """Test 2FA recovery with new setup"""
    # Enable 2FA for test user
    test_user.two_factor_enabled = True
    db.commit()
    
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.setup_2fa.return_value = ("NEWSECRET123", "base64_qr_code")
        
        response = client.post(
            "/api/v1/auth/2fa/recover",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "qr_code" in data
        assert "secret" in data
        assert data["message"] == "2FA recovery initiated"

def test_verify_2fa_login_success(client, test_user, test_token, db):
    """Test 2FA verification during login"""
    # Enable 2FA for test user
    test_user.two_factor_enabled = True
    db.commit()
    
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.verify_2fa.return_value = True
        
        response = client.post(
            "/api/v1/auth/verify-2fa",
            json={"code": "123456"},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["message"] == "2FA verification successful"

def test_verify_2fa_backup_code_success(client, test_user, test_token, db):
    """Test 2FA verification with backup code during login"""
    # Enable 2FA for test user
    test_user.two_factor_enabled = True
    db.commit()
    
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.verify_backup_code.return_value = True
        
        response = client.post(
            "/api/v1/auth/verify-2fa",
            json={"code": "BACKUP123", "is_backup_code": True},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["message"] == "2FA verification successful"

def test_regenerate_backup_codes_success(client, test_user, test_token):
    """Test regenerating backup codes"""
    with patch('app.api.v1.endpoints.auth.TwoFactorAuthService') as mock_2fa:
        mock_2fa.generate_backup_codes.return_value = ["NEW1", "NEW2", "NEW3"]
        
        response = client.post(
            "/api/v1/auth/2fa/regenerate-backup-codes",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "backup_codes" in data
        assert data["message"] == "Backup codes regenerated successfully"

def test_get_active_sessions_success(client, test_user, test_token):
    """Test getting active sessions"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        mock_service.get_user_sessions.return_value = [
            {
                "id": "session1",
                "device_info": {"browser": "Chrome", "os": "Windows"},
                "created_at": "2024-01-01T00:00:00",
                "last_accessed": "2024-01-01T12:00:00",
                "expires_at": "2024-02-01T00:00:00",
                "is_active": True
            }
        ]
        
        response = client.get(
            "/api/v1/auth/sessions",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "sessions" in data
        assert "total_sessions" in data
        assert len(data["sessions"]) == 1

def test_revoke_session_success(client, test_user, test_token):
    """Test revoking a specific session"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        
        # Mock session validation
        mock_session = MagicMock()
        mock_session.user_id = test_user.id
        mock_session.device_info = {"browser": "Chrome"}
        mock_service.validate_session.return_value = mock_session
        mock_service.revoke_session.return_value = True
        
        response = client.delete(
            "/api/v1/auth/sessions/session123",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Session revoked successfully"

def test_revoke_session_not_found(client, test_user, test_token):
    """Test revoking a non-existent session"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        mock_service.validate_session.return_value = None
        
        response = client.delete(
            "/api/v1/auth/sessions/nonexistent",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Session not found" in response.json()["detail"]

def test_logout_all_success(client, test_user, test_token):
    """Test logging out from all devices"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        mock_service.get_user_sessions.return_value = [
            {"id": "session1"}, {"id": "session2"}
        ]
        mock_service.invalidate_all_sessions.return_value = True
        
        response = client.post(
            "/api/v1/auth/logout-all",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Logged out from all devices"
        assert data["sessions_revoked"] == 2

def test_get_session_analytics_success(client, test_user, test_token):
    """Test getting session analytics"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        mock_service.get_session_analytics.return_value = {
            "total_sessions": 5,
            "active_sessions": 3,
            "total_duration": 3600,
            "average_session_duration": 720,
            "most_active_device": "Chrome on Windows"
        }
        
        response = client.get(
            "/api/v1/auth/sessions/analytics",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == test_user.id
        assert data["total_sessions"] == 5
        assert data["active_sessions"] == 3

def test_get_session_analytics_by_id_success(client, test_user, test_token):
    """Test getting analytics for a specific session"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        
        # Mock session validation
        mock_session = MagicMock()
        mock_session.user_id = test_user.id
        mock_service.validate_session.return_value = mock_session
        mock_service.get_session_analytics_by_id.return_value = {
            "session_id": "session123",
            "total_activities": 10,
            "last_activity": "2024-01-01T12:00:00"
        }
        
        response = client.get(
            "/api/v1/auth/sessions/session123/analytics",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["session_id"] == "session123"

def test_track_session_activity_success(client, test_user, test_token):
    """Test tracking session activity"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        
        # Mock session validation
        mock_session = MagicMock()
        mock_session.user_id = test_user.id
        mock_service.validate_session.return_value = mock_session
        
        response = client.post(
            "/api/v1/auth/sessions/session123/activity",
            json={"activity_type": "page_view", "details": {"page": "/dashboard"}},
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Activity tracked successfully"
        assert data["activity_type"] == "page_view"

def test_cleanup_expired_sessions_success(client, test_user, test_token):
    """Test cleaning up expired sessions"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        mock_service.cleanup_expired_sessions.return_value = 3
        
        response = client.post(
            "/api/v1/auth/sessions/cleanup",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Session cleanup completed"
        assert data["sessions_cleaned"] == 3

def test_get_session_status_success(client, test_user, test_token):
    """Test getting session status"""
    with patch('app.api.v1.endpoints.auth.get_session_service') as mock_session_service:
        mock_service = MagicMock()
        mock_session_service.return_value = mock_service
        mock_service.get_user_sessions.return_value = [
            {"id": "session1", "is_active": True},
            {"id": "session2", "is_active": False}
        ]
        mock_service.get_session_analytics.return_value = {
            "total_duration": 3600,
            "average_session_duration": 720,
            "most_active_device": "Chrome on Windows",
            "last_activity": "2024-01-01T12:00:00"
        }
        
        response = client.get(
            "/api/v1/auth/sessions/status",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == test_user.id
        assert data["session_stats"]["total_sessions"] == 2
        assert data["session_stats"]["active_sessions"] == 1
        assert data["session_stats"]["expired_sessions"] == 1 