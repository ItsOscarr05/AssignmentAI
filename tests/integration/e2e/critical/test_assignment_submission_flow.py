import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.src.main import app
from backend.src.database import get_db
from backend.src.models.user import User
from backend.src.models.assignment import Assignment
from backend.src.models.submission import Submission
from backend.src.services.auth import get_password_hash

# Test data
TEST_TEACHER = {
    "email": "teacher@example.com",
    "username": "teacher",
    "password": "teacherpass123",
    "full_name": "Test Teacher",
    "role": "teacher"
}

TEST_STUDENT = {
    "email": "student@example.com",
    "username": "student",
    "password": "studentpass123",
    "full_name": "Test Student",
    "role": "student"
}

TEST_ASSIGNMENT = {
    "title": "Test Assignment",
    "description": "This is a test assignment",
    "due_date": "2024-12-31T23:59:59",
    "max_score": 100,
    "course_id": 1
}

TEST_SUBMISSION = {
    "content": "This is my submission",
    "files": ["file1.pdf", "file2.pdf"]
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
        email=TEST_TEACHER["email"],
        username=TEST_TEACHER["username"],
        hashed_password=get_password_hash(TEST_TEACHER["password"]),
        full_name=TEST_TEACHER["full_name"],
        role=TEST_TEACHER["role"],
        is_active=True,
        is_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def test_student(test_db: Session):
    """Create a test student user in the database"""
    user = User(
        email=TEST_STUDENT["email"],
        username=TEST_STUDENT["username"],
        hashed_password=get_password_hash(TEST_STUDENT["password"]),
        full_name=TEST_STUDENT["full_name"],
        role=TEST_STUDENT["role"],
        is_active=True,
        is_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user

@pytest.fixture
def teacher_auth_headers(test_teacher: User, client: TestClient):
    """Get authentication headers for the test teacher"""
    response = client.post(
        "/token",
        data={
            "username": TEST_TEACHER["username"],
            "password": TEST_TEACHER["password"]
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def student_auth_headers(test_student: User, client: TestClient):
    """Get authentication headers for the test student"""
    response = client.post(
        "/token",
        data={
            "username": TEST_STUDENT["username"],
            "password": TEST_STUDENT["password"]
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_assignment(client: TestClient, teacher_auth_headers: dict):
    """Create a test assignment"""
    response = client.post(
        "/assignments",
        json=TEST_ASSIGNMENT,
        headers=teacher_auth_headers
    )
    return response.json()

def test_complete_submission_flow(
    client: TestClient,
    test_db: Session,
    test_teacher: User,
    test_student: User,
    teacher_auth_headers: dict,
    student_auth_headers: dict,
    test_assignment: dict
):
    """Test the complete flow of assignment submission"""
    # 1. Student views the assignment
    response = client.get(
        f"/assignments/{test_assignment['id']}",
        headers=student_auth_headers
    )
    assert response.status_code == 200
    assignment_data = response.json()
    assert assignment_data["title"] == TEST_ASSIGNMENT["title"]
    
    # 2. Student submits the assignment
    submission_response = client.post(
        f"/assignments/{test_assignment['id']}/submit",
        json=TEST_SUBMISSION,
        headers=student_auth_headers
    )
    assert submission_response.status_code == 200
    submission_data = submission_response.json()
    assert submission_data["content"] == TEST_SUBMISSION["content"]
    assert submission_data["files"] == TEST_SUBMISSION["files"]
    assert submission_data["status"] == "submitted"
    
    # 3. Teacher views the submission
    teacher_view_response = client.get(
        f"/assignments/{test_assignment['id']}/submissions",
        headers=teacher_auth_headers
    )
    assert teacher_view_response.status_code == 200
    submissions = teacher_view_response.json()
    assert len(submissions) == 1
    assert submissions[0]["content"] == TEST_SUBMISSION["content"]
    
    # 4. Teacher grades the submission
    grade_data = {
        "score": 85,
        "feedback": "Good work!",
        "status": "graded"
    }
    grade_response = client.post(
        f"/submissions/{submission_data['id']}/grade",
        json=grade_data,
        headers=teacher_auth_headers
    )
    assert grade_response.status_code == 200
    graded_submission = grade_response.json()
    assert graded_submission["score"] == grade_data["score"]
    assert graded_submission["feedback"] == grade_data["feedback"]
    assert graded_submission["status"] == grade_data["status"]
    
    # 5. Student views their graded submission
    student_view_response = client.get(
        f"/submissions/{submission_data['id']}",
        headers=student_auth_headers
    )
    assert student_view_response.status_code == 200
    viewed_submission = student_view_response.json()
    assert viewed_submission["score"] == grade_data["score"]
    assert viewed_submission["feedback"] == grade_data["feedback"]
    assert viewed_submission["status"] == grade_data["status"]

def test_submission_validation(
    client: TestClient,
    student_auth_headers: dict,
    test_assignment: dict
):
    """Test submission validation rules"""
    # Test empty submission
    response = client.post(
        f"/assignments/{test_assignment['id']}/submit",
        json={"content": "", "files": []},
        headers=student_auth_headers
    )
    assert response.status_code == 422
    
    # Test submission after deadline
    # First, update assignment deadline to past date
    client.put(
        f"/assignments/{test_assignment['id']}",
        json={"due_date": "2020-01-01T00:00:00"},
        headers=student_auth_headers
    )
    
    # Try to submit
    response = client.post(
        f"/assignments/{test_assignment['id']}/submit",
        json=TEST_SUBMISSION,
        headers=student_auth_headers
    )
    assert response.status_code == 400
    assert "deadline" in response.json()["detail"].lower()

def test_submission_file_handling(
    client: TestClient,
    student_auth_headers: dict,
    test_assignment: dict
):
    """Test file upload and handling in submissions"""
    # Test file size limit
    large_file = "x" * (10 * 1024 * 1024)  # 10MB file
    response = client.post(
        f"/assignments/{test_assignment['id']}/submit",
        json={
            "content": "Test submission",
            "files": [large_file]
        },
        headers=student_auth_headers
    )
    assert response.status_code == 413  # Payload Too Large
    
    # Test invalid file type
    response = client.post(
        f"/assignments/{test_assignment['id']}/submit",
        json={
            "content": "Test submission",
            "files": ["invalid.exe"]
        },
        headers=student_auth_headers
    )
    assert response.status_code == 400
    assert "file type" in response.json()["detail"].lower() 