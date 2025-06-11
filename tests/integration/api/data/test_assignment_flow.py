import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.src.main import app
from backend.src.database import get_db
from backend.src.models.user import User
from backend.src.models.assignment import Assignment
from backend.src.services.auth import get_password_hash

# Test data
TEST_USER = {
    "email": "teacher@example.com",
    "username": "teacher",
    "password": "teacherpass123",
    "full_name": "Test Teacher",
    "role": "teacher"
}

TEST_ASSIGNMENT = {
    "title": "Test Assignment",
    "description": "This is a test assignment",
    "due_date": "2024-12-31T23:59:59",
    "max_score": 100,
    "course_id": 1
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
def test_teacher(test_db: Session):
    """Create a test teacher user in the database"""
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

@pytest.fixture
def auth_headers(test_teacher: User, client: TestClient):
    """Get authentication headers for the test teacher"""
    response = client.post(
        "/token",
        data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_assignment(client: TestClient, auth_headers: dict, test_db: Session):
    """Test creating a new assignment"""
    response = client.post(
        "/assignments",
        json=TEST_ASSIGNMENT,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == TEST_ASSIGNMENT["title"]
    assert data["description"] == TEST_ASSIGNMENT["description"]
    assert data["max_score"] == TEST_ASSIGNMENT["max_score"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_get_assignment(client: TestClient, auth_headers: dict, test_db: Session):
    """Test retrieving an assignment"""
    # First create an assignment
    create_response = client.post(
        "/assignments",
        json=TEST_ASSIGNMENT,
        headers=auth_headers
    )
    assignment_id = create_response.json()["id"]
    
    # Then retrieve it
    response = client.get(
        f"/assignments/{assignment_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == assignment_id
    assert data["title"] == TEST_ASSIGNMENT["title"]
    assert data["description"] == TEST_ASSIGNMENT["description"]

def test_update_assignment(client: TestClient, auth_headers: dict, test_db: Session):
    """Test updating an assignment"""
    # First create an assignment
    create_response = client.post(
        "/assignments",
        json=TEST_ASSIGNMENT,
        headers=auth_headers
    )
    assignment_id = create_response.json()["id"]
    
    # Update the assignment
    update_data = {
        "title": "Updated Assignment",
        "description": "This is an updated test assignment",
        "max_score": 150
    }
    response = client.put(
        f"/assignments/{assignment_id}",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == assignment_id
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]
    assert data["max_score"] == update_data["max_score"]

def test_delete_assignment(client: TestClient, auth_headers: dict, test_db: Session):
    """Test deleting an assignment"""
    # First create an assignment
    create_response = client.post(
        "/assignments",
        json=TEST_ASSIGNMENT,
        headers=auth_headers
    )
    assignment_id = create_response.json()["id"]
    
    # Delete the assignment
    response = client.delete(
        f"/assignments/{assignment_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify it's deleted
    get_response = client.get(
        f"/assignments/{assignment_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 404

def test_list_assignments(client: TestClient, auth_headers: dict, test_db: Session):
    """Test listing all assignments"""
    # Create multiple assignments
    for i in range(3):
        assignment_data = TEST_ASSIGNMENT.copy()
        assignment_data["title"] = f"Test Assignment {i+1}"
        client.post(
            "/assignments",
            json=assignment_data,
            headers=auth_headers
        )
    
    # List assignments
    response = client.get(
        "/assignments",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3  # At least the 3 we just created
    assert all("id" in item for item in data)
    assert all("title" in item for item in data) 