import pytest
from fastapi import status
from app.models.submission import Submission
from app.schemas.submission import SubmissionCreate

def test_create_submission(client, test_user, test_token, test_assignment):
    submission_data = {
        "content": "Test submission content",
        "attachments": ["file1.pdf", "file2.docx"],
        "assignment_id": test_assignment.id,
    }
    
    response = client.post(
        "/api/v1/submissions",
        headers={"Authorization": f"Bearer {test_token}"},
        json=submission_data,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["content"] == submission_data["content"]
    assert data["student_id"] == test_user.id
    assert data["assignment_id"] == test_assignment.id

def test_get_submissions(client, test_user, test_token, test_submission):
    response = client.get(
        "/api/v1/submissions",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert data["total"] > 0

def test_get_submission(client, test_user, test_token, test_submission):
    response = client.get(
        f"/api/v1/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_submission.id

def test_update_submission(client, test_user, test_token, test_submission):
    update_data = {
        "content": "Updated submission content",
        "attachments": ["updated_file.pdf"],
    }
    
    response = client.put(
        f"/api/v1/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["content"] == update_data["content"]
    assert data["attachments"] == update_data["attachments"]

def test_delete_submission(client, test_user, test_token, test_submission):
    response = client.delete(
        f"/api/v1/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify submission is deleted
    response = client.get(
        f"/api/v1/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_submissions_by_assignment(client, test_user, test_token, test_submission):
    response = client.get(
        f"/api/v1/assignments/{test_submission.assignment_id}/submissions",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert all(sub["assignment_id"] == test_submission.assignment_id for sub in data["items"])

def test_get_submissions_by_student(client, test_user, test_token, test_submission):
    response = client.get(
        f"/api/v1/users/{test_user.id}/submissions",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert all(sub["student_id"] == test_user.id for sub in data["items"])

def test_submit_after_deadline(client, test_user, test_token, test_assignment):
    # Set assignment due date to past
    test_assignment.due_date = "2020-01-01"
    
    submission_data = {
        "content": "Late submission",
        "assignment_id": test_assignment.id,
    }
    
    response = client.post(
        "/api/v1/submissions",
        headers={"Authorization": f"Bearer {test_token}"},
        json=submission_data,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Assignment deadline has passed"

def test_submit_without_required_fields(client, test_token):
    submission_data = {
        "content": "",  # Empty content
        "assignment_id": "1",
    }
    
    response = client.post(
        "/api/v1/submissions",
        headers={"Authorization": f"Bearer {test_token}"},
        json=submission_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 