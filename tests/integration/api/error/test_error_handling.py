import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.src.main import app
from backend.src.database import get_db
from backend.src.models.user import User
from backend.src.services.auth import get_password_hash

# Test data
TEST_USER = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "full_name": "Test User",
    "role": "student"
}

@pytest.fixture
def client():
    """Create a test client with a test database"""
    return TestClient(app)

@pytest.fixture
def test_db():
    """Create a test database session"""
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_user(test_db: Session):
    """Create a test user in the database"""
    user = User(
        email=TEST_USER["email"],
        username=TEST_USER["username"],
        hashed_password=get_password_hash(TEST_USER["password"]),
        full_name=TEST_USER["full_name"],
        role=TEST_USER["role"],
        is_active=True,
        is_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

def test_invalid_authentication(client: TestClient):
    """Test authentication with invalid token"""
    response = client.get(
        "/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]

def test_missing_authentication(client: TestClient):
    """Test accessing protected endpoint without authentication"""
    response = client.get("/me")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]

def test_invalid_registration_data(client: TestClient):
    """Test registration with invalid data"""
    # Test missing required fields
    response = client.post("/register", json={})
    assert response.status_code == 422
    
    # Test invalid email format
    invalid_user = TEST_USER.copy()
    invalid_user["email"] = "invalid-email"
    response = client.post("/register", json=invalid_user)
    assert response.status_code == 422
    
    # Test password too short
    invalid_user = TEST_USER.copy()
    invalid_user["password"] = "short"
    response = client.post("/register", json=invalid_user)
    assert response.status_code == 422

def test_duplicate_registration(client: TestClient, test_user: User):
    """Test registration with duplicate email/username"""
    # Try to register with existing email
    response = client.post("/register", json=TEST_USER)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]
    
    # Try to register with existing username
    duplicate_user = TEST_USER.copy()
    duplicate_user["email"] = "different@example.com"
    response = client.post("/register", json=duplicate_user)
    assert response.status_code == 400
    assert "Username already taken" in response.json()["detail"]

def test_invalid_password_reset(client: TestClient):
    """Test password reset with invalid data"""
    # Test invalid email format
    response = client.post(
        "/password-reset-request",
        json={"email": "invalid-email"}
    )
    assert response.status_code == 422
    
    # Test invalid reset token
    reset_data = {
        "email": TEST_USER["email"],
        "token": "invalid_token",
        "new_password": "newpass123"
    }
    response = client.post("/password-reset", json=reset_data)
    assert response.status_code == 400
    assert "Invalid or expired reset token" in response.json()["detail"]

def test_invalid_assignment_data(client: TestClient, test_user: User):
    """Test creating assignment with invalid data"""
    # Get authentication token
    login_response = client.post(
        "/token",
        data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test missing required fields
    response = client.post("/assignments", json={}, headers=headers)
    assert response.status_code == 422
    
    # Test invalid date format
    invalid_assignment = {
        "title": "Test Assignment",
        "description": "Test Description",
        "due_date": "invalid-date",
        "max_score": 100,
        "course_id": 1
    }
    response = client.post("/assignments", json=invalid_assignment, headers=headers)
    assert response.status_code == 422
    
    # Test invalid score
    invalid_assignment = {
        "title": "Test Assignment",
        "description": "Test Description",
        "due_date": "2024-12-31T23:59:59",
        "max_score": -100,  # Negative score
        "course_id": 1
    }
    response = client.post("/assignments", json=invalid_assignment, headers=headers)
    assert response.status_code == 422

def test_nonexistent_resource(client: TestClient, test_user: User):
    """Test accessing nonexistent resources"""
    # Get authentication token
    login_response = client.post(
        "/token",
        data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test getting nonexistent assignment
    response = client.get("/assignments/999999", headers=headers)
    assert response.status_code == 404
    
    # Test updating nonexistent assignment
    response = client.put(
        "/assignments/999999",
        json={"title": "Updated Title"},
        headers=headers
    )
    assert response.status_code == 404
    
    # Test deleting nonexistent assignment
    response = client.delete("/assignments/999999", headers=headers)
    assert response.status_code == 404 