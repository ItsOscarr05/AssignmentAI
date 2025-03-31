import pytest
from fastapi import status
from app.core.config import settings
from app.schemas.user import UserCreate, UserUpdate

def test_create_user(client, mock_user_data):
    """Test creating a new user"""
    response = client.post(
        f"{settings.API_V1_STR}/users/",
        json=mock_user_data
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == mock_user_data["email"]
    assert data["full_name"] == mock_user_data["full_name"]
    assert data["role"] == mock_user_data["role"]
    assert "id" in data
    assert "created_at" in data

def test_create_existing_user(client, test_user, mock_user_data):
    """Test creating user with existing email"""
    response = client.post(
        f"{settings.API_V1_STR}/users/",
        json=mock_user_data
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "email already registered" in response.json()["detail"]

def test_get_users(client, teacher_token, test_user):
    """Test getting all users"""
    response = client.get(
        f"{settings.API_V1_STR}/users/",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_user.id

def test_get_users_unauthorized(client):
    """Test getting users without authentication"""
    response = client.get(f"{settings.API_V1_STR}/users/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_user(client, teacher_token, test_user):
    """Test getting a specific user"""
    response = client.get(
        f"{settings.API_V1_STR}/users/{test_user.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name
    assert data["role"] == test_user.role

def test_get_user_not_found(client, teacher_token):
    """Test getting non-existent user"""
    response = client.get(
        f"{settings.API_V1_STR}/users/999",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_user(client, teacher_token, test_user):
    """Test updating a user"""
    update_data = {
        "full_name": "Updated Name",
        "role": "student"
    }
    response = client.put(
        f"{settings.API_V1_STR}/users/{test_user.id}",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json=update_data
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["full_name"] == update_data["full_name"]
    assert data["role"] == update_data["role"]
    assert data["id"] == test_user.id

def test_update_user_unauthorized(client, test_user):
    """Test updating user without authentication"""
    update_data = {"full_name": "Updated Name"}
    response = client.put(
        f"{settings.API_V1_STR}/users/{test_user.id}",
        json=update_data
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_delete_user(client, teacher_token, test_user):
    """Test deleting a user"""
    response = client.delete(
        f"{settings.API_V1_STR}/users/{test_user.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify user is deleted
    response = client.get(
        f"{settings.API_V1_STR}/users/{test_user.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_user_unauthorized(client, test_user):
    """Test deleting user without authentication"""
    response = client.delete(f"{settings.API_V1_STR}/users/{test_user.id}")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_user_statistics(client, teacher_token, test_user):
    """Test getting user statistics"""
    response = client.get(
        f"{settings.API_V1_STR}/users/{test_user.id}/statistics",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_assignments" in data
    assert "total_submissions" in data
    assert "average_score" in data
    assert "completion_rate" in data

def test_get_user_statistics_unauthorized(client, test_user):
    """Test getting user statistics without authentication"""
    response = client.get(
        f"{settings.API_V1_STR}/users/{test_user.id}/statistics"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_teacher_statistics(client, teacher_token, test_user):
    """Test getting teacher statistics"""
    response = client.get(
        f"{settings.API_V1_STR}/users/teacher/{test_user.id}/statistics",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_assignments" in data
    assert "total_students" in data
    assert "average_submission_rate" in data
    assert "average_score" in data

def test_get_student_statistics(client, student_token, test_user):
    """Test getting student statistics"""
    response = client.get(
        f"{settings.API_V1_STR}/users/student/{test_user.id}/statistics",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_submissions" in data
    assert "completed_assignments" in data
    assert "average_score" in data
    assert "completion_rate" in data

def test_verify_email(client, test_user):
    """Test email verification"""
    verification_token = "test_verification_token"  # In real app, this would be generated
    response = client.post(
        f"{settings.API_V1_STR}/users/verify-email/{verification_token}"
    )
    assert response.status_code == status.HTTP_200_OK
    assert "Email verified successfully" in response.json()["message"]

def test_resend_verification_email(client, test_user):
    """Test resending verification email"""
    response = client.post(
        f"{settings.API_V1_STR}/users/resend-verification",
        json={"email": test_user.email}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "Verification email sent" in response.json()["message"] 