import pytest
from fastapi import status
from app.models.ai_assignment import AIAssignment
from app.schemas.ai_assignment import AIAssignmentCreate

def test_create_ai_assignment(client, test_user, test_token, test_assignment):
    ai_assignment_data = {
        "assignment_id": test_assignment.id,
        "prompt": "Test AI prompt",
        "model": "gpt-4",
        "max_tokens": 1000,
        "temperature": 0.7,
    }
    
    response = client.post(
        "/api/v1/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
        json=ai_assignment_data,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["prompt"] == ai_assignment_data["prompt"]
    assert data["assignment_id"] == test_assignment.id
    assert data["status"] == "pending"

def test_get_ai_assignments(client, test_user, test_token, test_ai_assignment):
    response = client.get(
        "/api/v1/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert data["total"] > 0

def test_get_ai_assignment(client, test_user, test_token, test_ai_assignment):
    response = client.get(
        f"/api/v1/ai-assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_ai_assignment.id

def test_update_ai_assignment(client, test_user, test_token, test_ai_assignment):
    update_data = {
        "prompt": "Updated AI prompt",
        "model": "gpt-3.5-turbo",
    }
    
    response = client.put(
        f"/api/v1/ai-assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["prompt"] == update_data["prompt"]
    assert data["model"] == update_data["model"]

def test_delete_ai_assignment(client, test_user, test_token, test_ai_assignment):
    response = client.delete(
        f"/api/v1/ai-assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify AI assignment is deleted
    response = client.get(
        f"/api/v1/ai-assignments/{test_ai_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_ai_assignments_by_assignment(client, test_user, test_token, test_ai_assignment):
    response = client.get(
        f"/api/v1/assignments/{test_ai_assignment.assignment_id}/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert all(ai["assignment_id"] == test_ai_assignment.assignment_id for ai in data["items"])

def test_get_ai_assignments_by_user(client, test_user, test_token, test_ai_assignment):
    response = client.get(
        f"/api/v1/users/{test_user.id}/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert all(ai["user_id"] == test_user.id for ai in data["items"])

def test_create_ai_assignment_with_invalid_model(client, test_user, test_token, test_assignment):
    ai_assignment_data = {
        "assignment_id": test_assignment.id,
        "prompt": "Test AI prompt",
        "model": "invalid-model",
        "max_tokens": 1000,
        "temperature": 0.7,
    }
    
    response = client.post(
        "/api/v1/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
        json=ai_assignment_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_ai_assignment_with_invalid_temperature(client, test_user, test_token, test_assignment):
    ai_assignment_data = {
        "assignment_id": test_assignment.id,
        "prompt": "Test AI prompt",
        "model": "gpt-4",
        "max_tokens": 1000,
        "temperature": 2.1,  # Invalid temperature value (should be > 2.0)
    }
    
    response = client.post(
        "/api/v1/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
        json=ai_assignment_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 

def test_get_ai_assignment_not_found(client, test_user, test_token):
    response = client.get(
        f"/api/v1/ai-assignments/999999",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_ai_assignment_not_found(client, test_user, test_token):
    update_data = {"prompt": "Updated", "model": "gpt-4"}
    response = client.put(
        f"/api/v1/ai-assignments/999999",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_ai_assignment_not_found(client, test_user, test_token):
    response = client.delete(
        f"/api/v1/ai-assignments/999999",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_create_ai_assignment_invalid_payload(client, test_user, test_token):
    # Missing required fields
    ai_assignment_data = {"prompt": "Test"}
    response = client.post(
        "/api/v1/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
        json=ai_assignment_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_ai_assignments_empty(client, test_user, test_token):
    # Assuming a user with no AI assignments
    response = client.get(
        "/api/v1/ai-assignments",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list) 