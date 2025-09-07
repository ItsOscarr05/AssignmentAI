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
    assert "Inactive user" in data["detail"]

def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
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

def test_login_missing_credentials(client):
    """Test login with missing credentials"""
    response = client.post(
        "/api/v1/auth/login",
        json={},
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_login_invalid_email_format(client):
    """Test login with invalid email format"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "invalid-email",
            "password": "testpassword",
        },
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_login_rate_limiting(client, test_user):
    """Test rate limiting for login attempts"""
    # Make multiple failed login attempts
    for i in range(10):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrongpassword",
            },
        )
        if response.status_code == 429:
            break
    
    # Should eventually hit rate limit
    assert response.status_code == 429
    assert "Too many login attempts" in response.json()["detail"]

def test_logout_success(client, test_user, test_token):
    """Test successful logout"""
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

def test_me_endpoint_invalid_token(client):
    """Test /me endpoint with invalid token"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_me_endpoint_no_token(client):
    """Test /me endpoint without token"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_register_success(client):
    """Test successful user registration"""
    user_data = {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "full_name": "New User"
    }
    
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert "id" in data

def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email"""
    user_data = {
        "email": test_user.email,
        "password": "newpassword123",
        "full_name": "Another User"
    }
    
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "already registered" in data["detail"].lower()

def test_register_weak_password(client):
    """Test registration with weak password"""
    user_data = {
        "email": "weakuser@example.com",
        "password": "123",
        "full_name": "Weak User"
    }
    
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_register_missing_fields(client):
    """Test registration with missing required fields"""
    user_data = {
        "email": "incomplete@example.com"
        # Missing password and full_name
    }
    
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_refresh_token_success(client, test_user, test_refresh_token):
    """Test successful token refresh"""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": test_refresh_token}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_refresh_token_invalid(client):
    """Test refresh with invalid token"""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_refresh_token_missing(client):
    """Test refresh without token"""
    response = client.post("/api/v1/auth/refresh", json={})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_password_reset_request_success(client, test_user):
    """Test successful password reset request"""
    response = client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": test_user.email}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data

def test_password_reset_request_nonexistent_email(client):
    """Test password reset request with non-existent email"""
    response = client.post(
        "/api/v1/auth/password-reset-request",
        json={"email": "nonexistent@example.com"}
    )
    # Should still return 200 to prevent email enumeration
    assert response.status_code == status.HTTP_200_OK

def test_password_reset_success(client, test_user, db):
    """Test successful password reset"""
    # Generate a reset token (this would normally be done by the reset request endpoint)
    reset_token = "valid_reset_token"
    
    # Mock the token verification
    with patch('app.api.v1.endpoints.auth.verify_password_reset_token') as mock_verify:
        mock_verify.return_value = test_user.email
        
        response = client.post(
            "/api/v1/auth/password-reset",
            json={
                "token": reset_token,
                "new_password": "newpassword123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

def test_password_reset_invalid_token(client):
    """Test password reset with invalid token"""
    response = client.post(
        "/api/v1/auth/password-reset",
        json={
            "token": "invalid_token",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_password_reset_weak_password(client, test_user):
    """Test password reset with weak password"""
    reset_token = "valid_reset_token"
    
    with patch('app.api.v1.endpoints.auth.verify_password_reset_token') as mock_verify:
        mock_verify.return_value = test_user.email
        
        response = client.post(
            "/api/v1/auth/password-reset",
            json={
                "token": reset_token,
                "new_password": "123"
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_change_password_success(client, test_user, test_token):
    """Test successful password change"""
    response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {test_token}"},
        json={
            "current_password": "testpassword",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data

def test_change_password_wrong_current(client, test_user, test_token):
    """Test password change with wrong current password"""
    response = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {test_token}"},
        json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_change_password_unauthorized(client):
    """Test password change without authentication"""
    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "testpassword",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_verify_email_success(client, test_user, db):
    """Test successful email verification"""
    # Generate a verification token
    verification_token = "valid_verification_token"
    
    with patch('app.api.v1.endpoints.auth.verify_email_token') as mock_verify:
        mock_verify.return_value = test_user.email
        
        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": verification_token}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

def test_verify_email_invalid_token(client):
    """Test email verification with invalid token"""
    response = client.post(
        "/api/v1/auth/verify-email",
        json={"token": "invalid_token"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_resend_verification_success(client, test_user, test_token):
    """Test successful verification email resend"""
    response = client.post(
        "/api/v1/auth/resend-verification",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data

def test_resend_verification_unauthorized(client):
    """Test resend verification without authentication"""
    response = client.post("/api/v1/auth/resend-verification")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_2fa_setup_success(client, test_user, test_token):
    """Test successful 2FA setup"""
    response = client.post(
        "/api/v1/auth/2fa/setup",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "qr_code" in data
    assert "secret" in data

def test_2fa_verify_success(client, test_user, test_token):
    """Test successful 2FA verification"""
    with patch('app.api.v1.endpoints.auth.totp.verify') as mock_verify:
        mock_verify.return_value = True
        
        response = client.post(
            "/api/v1/auth/2fa/verify",
            headers={"Authorization": f"Bearer {test_token}"},
            json={"code": "123456"}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

def test_2fa_verify_invalid_code(client, test_user, test_token):
    """Test 2FA verification with invalid code"""
    with patch('app.api.v1.endpoints.auth.totp.verify') as mock_verify:
        mock_verify.return_value = False
        
        response = client.post(
            "/api/v1/auth/2fa/verify",
            headers={"Authorization": f"Bearer {test_token}"},
            json={"code": "000000"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_2fa_disable_success(client, test_user, test_token):
    """Test successful 2FA disable"""
    # First enable 2FA
    test_user.two_factor_enabled = True
    test_user.two_factor_secret = "test_secret"
    
    response = client.post(
        "/api/v1/auth/2fa/disable",
        headers={"Authorization": f"Bearer {test_token}"},
        json={"password": "testpassword"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data

def test_2fa_disable_wrong_password(client, test_user, test_token):
    """Test 2FA disable with wrong password"""
    test_user.two_factor_enabled = True
    test_user.two_factor_secret = "test_secret"
    
    response = client.post(
        "/api/v1/auth/2fa/disable",
        headers={"Authorization": f"Bearer {test_token}"},
        json={"password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_2fa_status_enabled(client, test_user, test_token):
    """Test 2FA status when enabled"""
    test_user.two_factor_enabled = True
    
    response = client.get(
        "/api/v1/auth/2fa/status",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["enabled"] == True

def test_2fa_status_disabled(client, test_user, test_token):
    """Test 2FA status when disabled"""
    test_user.two_factor_enabled = False
    
    response = client.get(
        "/api/v1/auth/2fa/status",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["enabled"] == False