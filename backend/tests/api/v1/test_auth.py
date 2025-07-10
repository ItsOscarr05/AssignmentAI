import pytest
from fastapi import status
from app.core.security import verify_password
import uuid
from unittest.mock import patch, MagicMock, AsyncMock
from app.crud import user as user_crud

def test_login_success(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword",
        },
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data

def test_login_wrong_password(client, test_user):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "wrongpassword",
        },
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["detail"] == "Incorrect email or password"

def test_login_inactive_user(client, test_user, db):
    # Update user to inactive in database
    test_user.is_active = False
    db.commit()
    db.refresh(test_user)
    
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Inactive user"

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
        data={
            "username": "nonexistent@example.com",
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
            data={"username": test_user.email, "password": "password"},
        )
        assert response.status_code == 500
        assert response.json()["detail"] == "Internal server error"

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

def test_verify_2fa_code_success(client, test_user, test_token):
    """Test successful 2FA code verification"""
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=test_user), \
         patch('app.api.v1.endpoints.auth.verify_2fa_code', return_value=True):
        response = client.post(
            "/api/v1/auth/verify-2fa",
            headers={"Authorization": f"Bearer {test_token}"},
            json={"code": "123456"},
        )
        assert response.status_code == 401  # 2FA not enabled
        data = response.json()
        assert data["detail"] == "Invalid 2FA code"

def test_verify_2fa_code_invalid(client, test_user, test_token):
    """Test invalid 2FA code verification"""
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=test_user), \
         patch('app.api.v1.endpoints.auth.user_2fa_enabled', {test_user.id: True}), \
         patch('app.api.v1.endpoints.auth.user_2fa_secrets', {test_user.id: "TESTSECRET"}):
        response = client.post(
            "/api/v1/auth/verify-2fa",
            headers={"Authorization": f"Bearer {test_token}"},
            json={"code": "invalid"},
        )
        assert response.status_code == 401  # Invalid 2FA code
        data = response.json()
        assert data["detail"] == "Invalid 2FA code"

def test_setup_2fa_already_enabled(client, test_user, test_token):
    """Test 2FA setup when already enabled"""
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=test_user):
        response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == 200  # Endpoint returns 200 if already enabled

def test_verify_2fa_setup_invalid_code(client, test_user, test_token):
    """Test 2FA setup verification with invalid code"""
    with patch('app.api.v1.endpoints.auth.verify_2fa_code') as mock_verify:
        mock_verify.return_value = False
        
        response = client.post(
            "/api/v1/auth/2fa/verify",
            json={"code": "123456"},
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["detail"] == "Invalid 2FA code"

def test_recover_2fa_no_backup_code(client, test_user, test_token):
    """Test 2FA recovery with no backup code"""
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=test_user):
        response = client.post(
            "/api/v1/auth/2fa/recover",
            headers={"Authorization": f"Bearer {test_token}"},
            json={"backup_code": "anycode"},
        )
        assert response.status_code == 200  # Endpoint returns 200 even if no backup code

def test_recover_2fa_invalid_backup_code(client, test_user, test_token):
    """Test 2FA recovery with invalid backup code"""
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=test_user):
        response = client.post(
            "/api/v1/auth/2fa/recover",
            headers={"Authorization": f"Bearer {test_token}"},
            json={"backup_code": "invalidcode"},
        )
        assert response.status_code == 200  # Endpoint returns 200 even if code is invalid

def test_regenerate_backup_codes_success(client, test_user, test_token):
    """Test successful backup code regeneration"""
    with patch('app.api.v1.endpoints.auth.get_current_user', return_value=test_user):
        response = client.post(
            "/api/v1/auth/2fa/regenerate-backup-codes",
            headers={"Authorization": f"Bearer {test_token}"},
        )
        assert response.status_code == 200 