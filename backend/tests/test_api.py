import pytest
from fastapi import status
from datetime import datetime

def test_root_endpoint(client):
    """Test the root endpoint returns welcome message"""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "Welcome to AssignmentAI API"}

def test_health_check(client):
    """Test the health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "version" in data
    assert "cache" in data
    assert "binary_cache" in data
    assert "celery" in data

def test_create_assignment_unauthorized(client):
    """Test creating assignment without authentication fails"""
    response = client.post("/api/assignments", json={
        "subject": "mathematics",
        "grade_level": "high_school",
        "assignment_text": "Test assignment",
        "additional_requirements": ["req1"]
    })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_assignment_authorized(client, test_user_token, test_assignment_data):
    """Test creating assignment with valid authentication"""
    headers = {"Authorization": f"Bearer {test_user_token}"}
    response = client.post(
        "/api/assignments",
        json=test_assignment_data,
        headers=headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "id" in data
    assert data["subject"] == test_assignment_data["subject"]
    assert data["grade_level"] == test_assignment_data["grade_level"]
    assert data["status"] == "pending"

def test_get_task_status_unauthorized(client):
    """Test getting task status without authentication fails"""
    response = client.get("/api/tasks/test-task-id")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_task_status_authorized(client, test_user_token, mock_task_result):
    """Test getting task status with valid authentication"""
    headers = {"Authorization": f"Bearer {test_user_token}"}
    response = client.get(f"/api/tasks/{mock_task_result['id']}", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "task_id" in data
    assert "status" in data

def test_invalid_endpoint(client):
    """Test accessing invalid endpoint returns 404"""
    response = client.get("/api/nonexistent")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert "error" in data
    assert data["error"] == "Resource not found" 