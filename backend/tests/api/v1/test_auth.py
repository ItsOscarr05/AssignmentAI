import pytest
from fastapi import status
from app.core.security import verify_password
import uuid

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