import pytest
from fastapi import status
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def test_create_user(client, test_token):
    user_data = {
        "email": "newuser@example.com",
        "password": "testpassword123",
        "full_name": "New User",
        "role": "student",
    }
    
    response = client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {test_token}"},
        json=user_data,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["full_name"] == user_data["full_name"]
    assert data["role"] == user_data["role"]
    assert "password" not in data

def test_get_users(client, test_user, test_token):
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert data["total"] > 0

def test_get_user(client, test_user, test_token):
    response = client.get(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email
    assert "password" not in data

def test_update_user(client, test_user, test_token):
    update_data = {
        "full_name": "Updated Name",
        "role": "teacher",
    }
    
    response = client.put(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["full_name"] == update_data["full_name"]
    assert data["role"] == update_data["role"]

def test_delete_user(client, test_user, test_token):
    response = client.delete(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify user is deleted
    response = client.get(
        f"/api/v1/users/{test_user.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_user_password(client, test_user, test_token):
    password_data = {
        "current_password": "testpassword123",
        "new_password": "newpassword123",
    }
    
    response = client.put(
        f"/api/v1/users/{test_user.id}/password",
        headers={"Authorization": f"Bearer {test_token}"},
        json=password_data,
    )
    assert response.status_code == status.HTTP_200_OK

def test_verify_user_email(client, test_user, test_token):
    response = client.post(
        f"/api/v1/users/{test_user.id}/verify-email",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Verification email sent"

def test_reset_user_password(client, test_user):
    reset_data = {
        "email": test_user.email,
    }
    
    response = client.post(
        "/api/v1/users/reset-password",
        json=reset_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Password reset email sent"

def test_create_user_with_invalid_email(client, test_token):
    user_data = {
        "email": "invalid-email",
        "password": "testpassword123",
        "full_name": "Invalid Email User",
        "role": "student",
    }
    
    response = client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {test_token}"},
        json=user_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_user_with_invalid_role(client, test_token):
    user_data = {
        "email": "newuser@example.com",
        "password": "testpassword123",
        "full_name": "Invalid Role User",
        "role": "invalid_role",
    }
    
    response = client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {test_token}"},
        json=user_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_update_user_password_with_wrong_current_password(client, test_user, test_token):
    password_data = {
        "current_password": "wrongpassword",
        "new_password": "newpassword123",
    }
    
    response = client.put(
        f"/api/v1/users/{test_user.id}/password",
        headers={"Authorization": f"Bearer {test_token}"},
        json=password_data,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Current password is incorrect" 