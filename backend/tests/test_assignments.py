import pytest
from fastapi import status
from app.core.config import settings
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate

def test_create_assignment(client, teacher_token, mock_assignment_data):
    """Test creating a new assignment"""
    response = client.post(
        f"{settings.API_V1_STR}/assignments/",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json=mock_assignment_data
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == mock_assignment_data["title"]
    assert data["description"] == mock_assignment_data["description"]
    assert data["grade_level"] == mock_assignment_data["grade_level"]
    assert data["subject"] == mock_assignment_data["subject"]
    assert data["difficulty"] == mock_assignment_data["difficulty"]
    assert "id" in data
    assert "created_at" in data

def test_create_assignment_unauthorized(client, mock_assignment_data):
    """Test creating assignment without authentication"""
    response = client.post(
        f"{settings.API_V1_STR}/assignments/",
        json=mock_assignment_data
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_assignments(client, teacher_token, test_assignment):
    """Test getting all assignments"""
    response = client.get(
        f"{settings.API_V1_STR}/assignments/",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_assignment.id

def test_get_assignment(client, teacher_token, test_assignment):
    """Test getting a specific assignment"""
    response = client.get(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_assignment.id
    assert data["title"] == test_assignment.title
    assert data["description"] == test_assignment.description

def test_get_assignment_not_found(client, teacher_token):
    """Test getting non-existent assignment"""
    response = client.get(
        f"{settings.API_V1_STR}/assignments/999",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_assignment(client, teacher_token, test_assignment):
    """Test updating an assignment"""
    update_data = {
        "title": "Updated Title",
        "description": "Updated Description"
    }
    response = client.put(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json=update_data
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]
    assert data["id"] == test_assignment.id

def test_update_assignment_unauthorized(client, test_assignment):
    """Test updating assignment without authentication"""
    update_data = {"title": "Updated Title"}
    response = client.put(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}",
        json=update_data
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_delete_assignment(client, teacher_token, test_assignment):
    """Test deleting an assignment"""
    response = client.delete(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify assignment is deleted
    response = client.get(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_assignment_unauthorized(client, test_assignment):
    """Test deleting assignment without authentication"""
    response = client.delete(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_teacher_assignments(client, teacher_token, test_assignment):
    """Test getting assignments for a specific teacher"""
    response = client.get(
        f"{settings.API_V1_STR}/assignments/teacher/{test_assignment.teacher_id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_assignment.id

def test_get_student_assignments(client, student_token, test_assignment):
    """Test getting assignments for a specific student"""
    response = client.get(
        f"{settings.API_V1_STR}/assignments/student/me",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

def test_get_assignment_statistics(client, teacher_token, test_assignment):
    """Test getting assignment statistics"""
    response = client.get(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}/statistics",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_submissions" in data
    assert "average_score" in data
    assert "completion_rate" in data

def test_get_assignment_statistics_unauthorized(client, test_assignment):
    """Test getting assignment statistics without authentication"""
    response = client.get(
        f"{settings.API_V1_STR}/assignments/{test_assignment.id}/statistics"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED 