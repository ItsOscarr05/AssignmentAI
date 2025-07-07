import pytest
import uuid
from fastapi import status
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def test_create_user(client, test_token):
    token = test_token
    unique_email = f"newuser-{uuid.uuid4()}@example.com"
    user_data = {
        "email": unique_email,
        "password": "testpassword123",
        "name": "New User",
    }
    
    response = client.post(
        "/api/v1/users/users",
        headers={"Authorization": f"Bearer {token}"},
        json=user_data,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["name"] == user_data["name"]
    assert "password" not in data

def test_get_users(client, test_user, test_token):
    user = test_user
    token = test_token
    
    response = client.get(
        "/api/v1/users/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) > 0

def test_get_current_user(client, test_user, test_token):
    user = test_user
    token = test_token
    
    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == user.id
    assert data["email"] == user.email
    assert "password" not in data

def test_update_current_user(client, test_user, test_token):
    user = test_user
    token = test_token
    
    update_data = {
        "name": "Updated Name",
    }
    
    response = client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == update_data["name"]

def test_delete_current_user_account(client, test_user, test_token):
    user = test_user
    token = test_token
    
    response = client.delete(
        "/api/v1/users/account",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Account deleted successfully"

def test_change_password(client, test_user, test_token):
    user = test_user
    token = test_token
    
    password_data = {
        "current_password": "testpassword",
        "new_password": "newpassword123",
    }
    
    response = client.post(
        "/api/v1/users/change-password",
        headers={"Authorization": f"Bearer {token}"},
        data=password_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Password changed successfully"

def test_get_user_profile(client, test_user, test_token):
    user = test_user
    token = test_token
    
    response = client.get(
        "/api/v1/users/profile",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "name" in data

def test_create_user_with_invalid_email(client, test_token):
    token = test_token
    
    user_data = {
        "email": "invalid-email",
        "password": "testpassword123",
        "name": "Invalid Email User",
    }
    
    response = client.post(
        "/api/v1/users/users",
        headers={"Authorization": f"Bearer {token}"},
        json=user_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_change_password_with_wrong_current_password(client, test_user, test_token):
    user = test_user
    token = test_token
    
    password_data = {
        "current_password": "wrongpassword",
        "new_password": "newpassword123",
    }
    
    response = client.post(
        "/api/v1/users/change-password",
        headers={"Authorization": f"Bearer {token}"},
        data=password_data,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Current password is incorrect" 