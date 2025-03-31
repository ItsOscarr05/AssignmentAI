import pytest
from fastapi import status
from app.core.config import settings
from app.schemas.user import UserCreate, UserResponse
from app.core.security import verify_password

def test_register_user(client, mock_user_data):
    """Test user registration"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=mock_user_data
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == mock_user_data["email"]
    assert data["full_name"] == mock_user_data["full_name"]
    assert data["role"] == mock_user_data["role"]
    assert "id" in data
    assert "created_at" in data

def test_register_existing_user(client, test_user, mock_user_data):
    """Test registration with existing email"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json=mock_user_data
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "email already registered" in response.json()["detail"]

def test_login_user(client, test_user, mock_user_data):
    """Test user login"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": mock_user_data["email"],
            "password": mock_user_data["password"]
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client, mock_user_data):
    """Test login with invalid credentials"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": mock_user_data["email"],
            "password": "wrongpassword"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect email or password" in response.json()["detail"]

def test_get_current_user(client, test_user, teacher_token):
    """Test getting current user"""
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name
    assert data["role"] == test_user.role

def test_get_current_user_invalid_token(client):
    """Test getting current user with invalid token"""
    response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_refresh_token(client, test_user, teacher_token):
    """Test token refresh"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/refresh",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"

def test_change_password(client, test_user, teacher_token, mock_user_data):
    """Test password change"""
    new_password = "newpassword123"
    response = client.post(
        f"{settings.API_V1_STR}/auth/change-password",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "current_password": mock_user_data["password"],
            "new_password": new_password
        }
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verify new password works
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": mock_user_data["email"],
            "password": new_password
        }
    )
    assert response.status_code == status.HTTP_200_OK

def test_change_password_invalid_current(client, test_user, teacher_token):
    """Test password change with invalid current password"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/change-password",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect current password" in response.json()["detail"]

def test_forgot_password(client, test_user):
    """Test forgot password flow"""
    response = client.post(
        f"{settings.API_V1_STR}/auth/forgot-password",
        json={"email": test_user.email}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "Password reset email sent" in response.json()["message"]

def test_reset_password(client, test_user):
    """Test password reset flow"""
    # First request password reset
    response = client.post(
        f"{settings.API_V1_STR}/auth/forgot-password",
        json={"email": test_user.email}
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Then reset password with token
    reset_token = "test_reset_token"  # In real app, this would come from email
    new_password = "resetpassword123"
    response = client.post(
        f"{settings.API_V1_STR}/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": new_password
        }
    )
    assert response.status_code == status.HTTP_200_OK
    
    # Verify new password works
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": test_user.email,
            "password": new_password
        }
    )
    assert response.status_code == status.HTTP_200_OK 