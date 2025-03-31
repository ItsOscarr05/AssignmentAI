import pytest
from fastapi import status
from app.core.config import settings
from app.schemas.ai_assignment import AIAssignmentCreate, AIAssignmentUpdate

def test_generate_assignment(client, teacher_token, mock_ai_assignment_data):
    """Test generating an AI assignment"""
    response = client.post(
        f"{settings.API_V1_STR}/ai/assignments/generate",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json=mock_ai_assignment_data
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == mock_ai_assignment_data["title"]
    assert data["description"] == mock_ai_assignment_data["description"]
    assert data["prompt"] == mock_ai_assignment_data["prompt"]
    assert "generated_content" in data
    assert "confidence_score" in data
    assert "id" in data
    assert "created_at" in data

def test_generate_assignment_unauthorized(client, mock_ai_assignment_data):
    """Test generating AI assignment without authentication"""
    response = client.post(
        f"{settings.API_V1_STR}/ai/assignments/generate",
        json=mock_ai_assignment_data
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_ai_assignments(client, teacher_token, test_ai_assignment):
    """Test getting all AI assignments"""
    response = client.get(
        f"{settings.API_V1_STR}/ai/assignments/",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_ai_assignment.id

def test_get_ai_assignment(client, teacher_token, test_ai_assignment):
    """Test getting a specific AI assignment"""
    response = client.get(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_ai_assignment.id
    assert data["title"] == test_ai_assignment.title
    assert data["description"] == test_ai_assignment.description
    assert "generated_content" in data
    assert "confidence_score" in data

def test_get_ai_assignment_not_found(client, teacher_token):
    """Test getting non-existent AI assignment"""
    response = client.get(
        f"{settings.API_V1_STR}/ai/assignments/999",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_ai_assignment(client, teacher_token, test_ai_assignment):
    """Test updating an AI assignment"""
    update_data = {
        "title": "Updated AI Title",
        "description": "Updated AI Description"
    }
    response = client.put(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"},
        json=update_data
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]
    assert data["id"] == test_ai_assignment.id

def test_update_ai_assignment_unauthorized(client, test_ai_assignment):
    """Test updating AI assignment without authentication"""
    update_data = {"title": "Updated Title"}
    response = client.put(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}",
        json=update_data
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_delete_ai_assignment(client, teacher_token, test_ai_assignment):
    """Test deleting an AI assignment"""
    response = client.delete(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify AI assignment is deleted
    response = client.get(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_ai_assignment_unauthorized(client, test_ai_assignment):
    """Test deleting AI assignment without authentication"""
    response = client.delete(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_teacher_ai_assignments(client, teacher_token, test_ai_assignment):
    """Test getting AI assignments for a specific teacher"""
    response = client.get(
        f"{settings.API_V1_STR}/ai/assignments/teacher/{test_ai_assignment.teacher_id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_ai_assignment.id

def test_regenerate_assignment_content(client, teacher_token, test_ai_assignment):
    """Test regenerating AI assignment content"""
    response = client.post(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}/regenerate",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_ai_assignment.id
    assert "generated_content" in data
    assert "confidence_score" in data

def test_regenerate_assignment_content_unauthorized(client, test_ai_assignment):
    """Test regenerating AI assignment content without authentication"""
    response = client.post(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}/regenerate"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_ai_assignment_analytics(client, teacher_token, test_ai_assignment):
    """Test getting AI assignment analytics"""
    response = client.get(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}/analytics",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "generation_time" in data
    assert "confidence_score" in data
    assert "usage_count" in data
    assert "feedback_rating" in data

def test_get_ai_assignment_analytics_unauthorized(client, test_ai_assignment):
    """Test getting AI assignment analytics without authentication"""
    response = client.get(
        f"{settings.API_V1_STR}/ai/assignments/{test_ai_assignment.id}/analytics"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED 