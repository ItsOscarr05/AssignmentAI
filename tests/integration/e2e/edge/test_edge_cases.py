import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.src.main import app
from backend.src.database import get_db
from backend.src.models.user import User
from backend.src.models.assignment import Assignment
from backend.src.services.auth import get_password_hash
import json

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

@pytest.fixture
def auth_headers(test_user: User, client: TestClient):
    """Get authentication headers for the test user"""
    response = client.post(
        "/token",
        data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_sql_injection_prevention(client: TestClient, auth_headers: dict):
    """Test prevention of SQL injection attacks"""
    # Try SQL injection in username
    response = client.post(
        "/token",
        data={
            "username": "'; DROP TABLE users; --",
            "password": "anypassword"
        }
    )
    assert response.status_code == 401
    
    # Try SQL injection in search query
    response = client.get(
        "/assignments/search?q=1'; DROP TABLE assignments; --",
        headers=auth_headers
    )
    assert response.status_code == 200  # Should not execute the injection

def test_xss_prevention(client: TestClient, auth_headers: dict):
    """Test prevention of XSS attacks"""
    # Try XSS in assignment title
    xss_title = "<script>alert('xss')</script>"
    response = client.post(
        "/assignments",
        json={
            "title": xss_title,
            "description": "Test description",
            "due_date": "2024-12-31T23:59:59",
            "max_score": 100,
            "course_id": 1
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] != xss_title  # Should be sanitized
    
    # Try XSS in feedback
    xss_feedback = "<img src='x' onerror='alert(1)'>"
    response = client.post(
        f"/submissions/1/feedback",
        json={"feedback": xss_feedback},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["feedback"] != xss_feedback  # Should be sanitized

def test_rate_limiting(client: TestClient, auth_headers: dict):
    """Test rate limiting on API endpoints"""
    # Make multiple rapid requests
    for _ in range(100):
        response = client.get("/me", headers=auth_headers)
    
    # The last request should be rate limited
    assert response.status_code == 429
    assert "rate limit" in response.json()["detail"].lower()

def test_large_payload_handling(client: TestClient, auth_headers: dict):
    """Test handling of large payloads"""
    # Create a large assignment description
    large_description = "x" * (1024 * 1024)  # 1MB of text
    response = client.post(
        "/assignments",
        json={
            "title": "Large Assignment",
            "description": large_description,
            "due_date": "2024-12-31T23:59:59",
            "max_score": 100,
            "course_id": 1
        },
        headers=auth_headers
    )
    assert response.status_code == 413  # Payload Too Large

def test_concurrent_operations(client: TestClient, auth_headers: dict):
    """Test handling of concurrent operations"""
    import threading
    import time
    
    def create_assignment():
        response = client.post(
            "/assignments",
            json={
                "title": f"Concurrent Assignment {time.time()}",
                "description": "Test description",
                "due_date": "2024-12-31T23:59:59",
                "max_score": 100,
                "course_id": 1
            },
            headers=auth_headers
        )
        return response.status_code
    
    # Create multiple threads to submit assignments concurrently
    threads = []
    for _ in range(10):
        thread = threading.Thread(target=create_assignment)
        threads.append(thread)
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    # Verify all assignments were created successfully
    response = client.get("/assignments", headers=auth_headers)
    assert response.status_code == 200
    assignments = response.json()
    assert len(assignments) >= 10

def test_unicode_handling(client: TestClient, auth_headers: dict):
    """Test handling of Unicode characters"""
    # Test with various Unicode characters
    unicode_text = "🌟 Hello 世界! こんにちは! 안녕하세요! 🌍"
    response = client.post(
        "/assignments",
        json={
            "title": unicode_text,
            "description": unicode_text,
            "due_date": "2024-12-31T23:59:59",
            "max_score": 100,
            "course_id": 1
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == unicode_text
    assert data["description"] == unicode_text

def test_timezone_handling(client: TestClient, auth_headers: dict):
    """Test handling of different timezones"""
    # Test with different timezone formats
    timezones = [
        "2024-12-31T23:59:59Z",  # UTC
        "2024-12-31T23:59:59+00:00",  # UTC with offset
        "2024-12-31T23:59:59-05:00",  # EST
        "2024-12-31T23:59:59+09:00"   # JST
    ]
    
    for tz in timezones:
        response = client.post(
            "/assignments",
            json={
                "title": f"Timezone Test {tz}",
                "description": "Test description",
                "due_date": tz,
                "max_score": 100,
                "course_id": 1
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "due_date" in data

def test_special_characters(client: TestClient, auth_headers: dict):
    """Test handling of special characters"""
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`"
    response = client.post(
        "/assignments",
        json={
            "title": special_chars,
            "description": special_chars,
            "due_date": "2024-12-31T23:59:59",
            "max_score": 100,
            "course_id": 1
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == special_chars
    assert data["description"] == special_chars 