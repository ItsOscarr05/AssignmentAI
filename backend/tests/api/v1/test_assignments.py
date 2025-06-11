import pytest
from fastapi import status
from app.models.assignment import Assignment
from app.schemas.assignment import AssignmentCreate

@pytest.mark.asyncio
async def test_create_assignment(client, test_user, test_token):
    assignment_data = {
        "title": "Test Assignment",
        "description": "Test Description",
        "due_date": "2024-12-31",
        "subject": "Mathematics",
        "grade_level": "10",
    }
    
    response = await client.post(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {test_token}"},
        json=assignment_data,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == assignment_data["title"]
    assert data["description"] == assignment_data["description"]
    assert data["teacher_id"] == test_user.id

@pytest.mark.asyncio
async def test_get_assignments(client, test_user, test_token, test_assignment):
    response = await client.get(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert data["total"] > 0

@pytest.mark.asyncio
async def test_get_assignment(client, test_user, test_token, test_assignment):
    response = await client.get(
        f"/api/v1/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_assignment.id

@pytest.mark.asyncio
async def test_update_assignment(client, test_user, test_token, test_assignment):
    update_data = {
        "title": "Updated Assignment",
        "description": "Updated Description",
    }
    
    response = await client.put(
        f"/api/v1/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]

@pytest.mark.asyncio
async def test_delete_assignment(client, test_user, test_token, test_assignment):
    response = await client.delete(
        f"/api/v1/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify assignment is deleted
    response = await client.get(
        f"/api/v1/assignments/{test_assignment.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_get_assignments_unauthorized(client):
    response = await client.get("/api/v1/assignments")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.asyncio
async def test_create_assignment_validation_error(client, test_token):
    invalid_data = {
        "title": "",  # Empty title
        "description": "Test Description",
        "due_date": "invalid-date",  # Invalid date
    }
    
    response = await client.post(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {test_token}"},
        json=invalid_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_get_assignments_pagination(client, test_user, test_token, test_assignment):
    response = await client.get(
        "/api/v1/assignments?page=1&size=10",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "page" in data
    assert "size" in data
    assert "total" in data
    assert "items" in data

@pytest.mark.asyncio
async def test_get_assignments_filtering(client, test_user, test_token, test_assignment):
    response = await client.get(
        "/api/v1/assignments?subject=Mathematics",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert all(item["subject"] == "Mathematics" for item in data["items"])

@pytest.mark.asyncio
async def test_get_assignments_sorting(client, test_user, test_token, test_assignment):
    response = await client.get(
        "/api/v1/assignments?sort_by=due_date&sort_order=desc",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    # Verify sorting order
    due_dates = [item["due_date"] for item in data["items"]]
    assert due_dates == sorted(due_dates, reverse=True)

@pytest.mark.asyncio
async def test_get_assignments_search(client, test_user, test_token, test_assignment):
    response = await client.get(
        f"/api/v1/assignments?search={test_assignment.title}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert any(test_assignment.title in item["title"] for item in data["items"])

@pytest.mark.asyncio
async def test_update_assignment_not_found(client, test_user, test_token):
    update_data = {
        "title": "Updated Assignment",
        "description": "Updated Description",
    }
    
    response = await client.put(
        "/api/v1/assignments/999999",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_update_assignment_unauthorized(client, test_assignment):
    update_data = {
        "title": "Updated Assignment",
        "description": "Updated Description",
    }
    
    response = await client.put(
        f"/api/v1/assignments/{test_assignment.id}",
        json=update_data,
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.asyncio
async def test_delete_assignment_not_found(client, test_user, test_token):
    response = await client.delete(
        "/api/v1/assignments/999999",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_delete_assignment_unauthorized(client, test_assignment):
    response = await client.delete(
        f"/api/v1/assignments/{test_assignment.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.asyncio
async def test_get_assignment_not_found(client, test_user, test_token):
    response = await client.get(
        "/api/v1/assignments/999999",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_get_assignment_unauthorized(client, test_assignment):
    response = await client.get(
        f"/api/v1/assignments/{test_assignment.id}",
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.asyncio
async def test_create_assignment_missing_required_fields(client, test_token):
    invalid_data = {
        "title": "Test Assignment",
        # Missing required fields
    }
    
    response = await client.post(
        "/api/v1/assignments",
        headers={"Authorization": f"Bearer {test_token}"},
        json=invalid_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@pytest.mark.asyncio
async def test_get_assignments_invalid_pagination(client, test_user, test_token):
    response = await client.get(
        "/api/v1/assignments?page=0&size=0",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 