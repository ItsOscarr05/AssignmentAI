import pytest
from fastapi import status
from app.core.config import settings
from app.schemas.submission import SubmissionCreate, SubmissionUpdate

def test_create_submission(client, student_token, test_assignment, mock_submission_data):
    """Test creating a new submission"""
    response = client.post(
        f"{settings.API_V1_STR}/submissions/",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "assignment_id": test_assignment.id,
            **mock_submission_data
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["assignment_id"] == test_assignment.id
    assert data["content"] == mock_submission_data["content"]
    assert data["file_path"] == mock_submission_data["file_path"]
    assert "id" in data
    assert "created_at" in data

def test_create_submission_unauthorized(client, test_assignment, mock_submission_data):
    """Test creating submission without authentication"""
    response = client.post(
        f"{settings.API_V1_STR}/submissions/",
        json={
            "assignment_id": test_assignment.id,
            **mock_submission_data
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_submission(client, student_token, test_submission):
    """Test getting a specific submission"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_submission.id
    assert data["content"] == test_submission.content
    assert data["file_path"] == test_submission.file_path

def test_get_submission_not_found(client, student_token):
    """Test getting non-existent submission"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/999",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_submission(client, student_token, test_submission):
    """Test updating a submission"""
    update_data = {
        "content": "Updated submission content",
        "file_path": "updated_file.pdf"
    }
    response = client.put(
        f"{settings.API_V1_STR}/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {student_token}"},
        json=update_data
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["content"] == update_data["content"]
    assert data["file_path"] == update_data["file_path"]
    assert data["id"] == test_submission.id

def test_update_submission_unauthorized(client, test_submission):
    """Test updating submission without authentication"""
    update_data = {"content": "Updated content"}
    response = client.put(
        f"{settings.API_V1_STR}/submissions/{test_submission.id}",
        json=update_data
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_delete_submission(client, student_token, test_submission):
    """Test deleting a submission"""
    response = client.delete(
        f"{settings.API_V1_STR}/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify submission is deleted
    response = client.get(
        f"{settings.API_V1_STR}/submissions/{test_submission.id}",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_submission_unauthorized(client, test_submission):
    """Test deleting submission without authentication"""
    response = client.delete(
        f"{settings.API_V1_STR}/submissions/{test_submission.id}"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_assignment_submissions(client, teacher_token, test_assignment, test_submission):
    """Test getting submissions for an assignment"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/assignment/{test_assignment.id}",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_submission.id

def test_get_assignment_submissions_unauthorized(client, test_assignment):
    """Test getting assignment submissions without authentication"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/assignment/{test_assignment.id}"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_student_submissions(client, student_token, test_submission):
    """Test getting submissions for a student"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/student/me",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == test_submission.id

def test_get_student_submissions_unauthorized(client):
    """Test getting student submissions without authentication"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/student/me"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_upload_submission_file(client, student_token, test_assignment):
    """Test uploading a submission file"""
    files = {
        "file": ("test.pdf", b"test content", "application/pdf")
    }
    response = client.post(
        f"{settings.API_V1_STR}/submissions/upload",
        headers={"Authorization": f"Bearer {student_token}"},
        data={"assignment_id": test_assignment.id},
        files=files
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "file_path" in data
    assert data["assignment_id"] == test_assignment.id

def test_upload_submission_file_unauthorized(client, test_assignment):
    """Test uploading submission file without authentication"""
    files = {
        "file": ("test.pdf", b"test content", "application/pdf")
    }
    response = client.post(
        f"{settings.API_V1_STR}/submissions/upload",
        data={"assignment_id": test_assignment.id},
        files=files
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_submission_statistics(client, teacher_token, test_assignment):
    """Test getting submission statistics"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/assignment/{test_assignment.id}/statistics",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_submissions" in data
    assert "submission_rate" in data
    assert "average_score" in data
    assert "completion_rate" in data

def test_get_submission_statistics_unauthorized(client, test_assignment):
    """Test getting submission statistics without authentication"""
    response = client.get(
        f"{settings.API_V1_STR}/submissions/assignment/{test_assignment.id}/statistics"
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED 