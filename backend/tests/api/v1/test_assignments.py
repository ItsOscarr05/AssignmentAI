import pytest
from fastapi import status
from app.models.assignment import Assignment
from app.schemas.assignment import AssignmentCreate

def test_create_assignment(client, test_user, test_token):
    user = test_user
    token = test_token
    
    assignment_data = {
        "title": "Test Assignment",
        "description": "Test Description",
        "due_date": "2024-12-31T00:00:00",
        "subject": "Mathematics",
        "grade_level": "10",
        "max_score": 100,
        "assignment_type": "homework",
        "topic": "Algebra",
        "difficulty": "easy",
        "estimated_time": 60,
        "content": "Test content",
    }
    
    response = client.post(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {token}"},
        json=assignment_data,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == assignment_data["title"]
    assert data["description"] == assignment_data["description"]
    assert data["created_by_id"] == user.id

def test_get_assignments(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    response = client.get(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert data["total"] > 0

def test_get_assignment(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    response = client.get(
        f"/api/v1/assignments/{assignment.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == assignment.id

def test_update_assignment(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    update_data = {
        "title": "Updated Assignment",
        "description": "Updated Description",
    }
    
    response = client.put(
        f"/api/v1/assignments/{assignment.id}",
        headers={"Authorization": f"Bearer {token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]

def test_delete_assignment(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    response = client.delete(
        f"/api/v1/assignments/{assignment.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify assignment is deleted
    response = client.get(
        f"/api/v1/assignments/{assignment.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_assignments_unauthorized(client):
    response = client.get("/api/v1/assignments")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_assignment_validation_error(client, test_token):
    token = test_token
    
    invalid_data = {
        "title": "",  # Empty title
        "description": "Test Description",
        "due_date": "invalid-date",  # Invalid date
    }
    
    response = client.post(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {token}"},
        json=invalid_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_assignments_pagination(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    response = client.get(
        "/api/v1/assignments?page=1&size=10",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "page" in data
    assert "size" in data
    assert "total" in data
    assert "items" in data

def test_get_assignments_filtering(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    response = client.get(
        "/api/v1/assignments?subject=Mathematics",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert all(item["subject"] == "Mathematics" for item in data["items"])

def test_get_assignments_sorting(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    response = client.get(
        "/api/v1/assignments?sort_by=due_date&sort_order=desc",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    # Verify sorting order
    due_dates = [item["due_date"] for item in data["items"]]
    assert due_dates == sorted(due_dates, reverse=True)

def test_get_assignments_search(client, test_user, test_token, test_assignment):
    user = test_user
    token = test_token
    assignment = test_assignment
    
    response = client.get(
        f"/api/v1/assignments?search={assignment.title}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert any(assignment.title in item["title"] for item in data["items"])

def test_update_assignment_not_found(client, test_user, test_token):
    user = test_user
    token = test_token
    
    update_data = {
        "title": "Updated Assignment",
        "description": "Updated Description",
    }
    
    response = client.put(
        "/api/v1/assignments/999999",
        headers={"Authorization": f"Bearer {token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_assignment_unauthorized(client, test_assignment):
    assignment = test_assignment
    
    update_data = {
        "title": "Updated Assignment",
        "description": "Updated Description",
    }
    
    response = client.put(
        f"/api/v1/assignments/{assignment.id}",
        json=update_data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_delete_assignment_not_found(client, test_user, test_token):
    user = test_user
    token = test_token
    
    response = client.delete(
        "/api/v1/assignments/999999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_assignment_unauthorized(client, test_assignment):
    assignment = test_assignment
    
    response = client.delete(
        f"/api/v1/assignments/{assignment.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_assignment_not_found(client, test_user, test_token):
    user = test_user
    token = test_token
    
    response = client.get(
        "/api/v1/assignments/999999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_assignment_unauthorized(client, test_assignment):
    assignment = test_assignment
    
    response = client.get(
        f"/api/v1/assignments/{assignment.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_assignment_missing_required_fields(client, test_token):
    token = test_token
    
    # Missing required fields
    invalid_data = {
        "description": "Test Description",
        "due_date": "2024-12-31",
    }
    
    response = client.post(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {token}"},
        json=invalid_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_get_assignments_invalid_pagination(client, test_user, test_token):
    user = test_user
    token = test_token
    
    response = client.get(
        "/api/v1/assignments?page=-1&size=0",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 