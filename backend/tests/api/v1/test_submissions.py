import pytest
from fastapi import status
from app.models.submission import Submission
from app.schemas.submission import SubmissionCreate
from unittest.mock import MagicMock, patch
from datetime import datetime

def test_create_submission(client, test_user, test_token, test_assignment):
    submission_data = {
        "content": "Test submission content",
        "attachments": ["file1.pdf", "file2.docx"],
        "assignment_id": test_assignment.id,
    }
    
    response = client.post(
        "/api/v1/submissions/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=submission_data,
    )
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["content"] == submission_data["content"]
    assert data["student_id"] == test_user.id
    assert data["assignment_id"] == test_assignment.id

def test_get_submissions(client, test_user, test_token, test_submission):
    response = client.get(
        "/api/v1/submissions/",
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

def test_submit_after_deadline(client, test_user, test_token, test_assignment, db):
    # Set assignment due date to past in the database
    from datetime import datetime
    test_assignment.due_date = datetime(2020, 1, 1)
    db.add(test_assignment)
    db.commit()
    db.refresh(test_assignment)
    
    submission_data = {
        "content": "Late submission",
        "assignment_id": test_assignment.id,
    }
    
    response = client.post(
        "/api/v1/submissions/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=submission_data,
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["detail"] == "Assignment deadline has passed"

def test_submit_without_required_fields(client, test_token, test_assignment):
    submission_data = {
        "content": "Test content",  # Valid content
        # Missing assignment_id - this should cause a validation error
    }
    
    response = client.post(
        "/api/v1/submissions/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=submission_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 

def test_get_submissions_by_user_mapping_error(client, test_user, test_token, test_submission):
    """Test get_submissions_by_user when user_id mapping fails"""
    # Mock submission without user_id to trigger the missing line
    mock_submission = MagicMock()
    mock_submission.__dict__ = {
        'id': 1,
        'content': 'Test submission',
        'assignment_id': 1,
        'created_at': datetime(2025, 1, 1),
        'updated_at': datetime(2025, 1, 2),
        'status': 'submitted',
        'score': 100.0,
        'feedback_count': 0,
        'submission_metadata': {}
    }
    # Remove user_id to trigger the missing line
    if hasattr(mock_submission.__dict__, 'user_id'):
        del mock_submission.__dict__['user_id']
    
    with patch('app.api.v1.api.submission_crud.get_by_user_sync', return_value=[mock_submission]):
        response = client.get(f"/api/v1/users/{test_user.id}/submissions", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        # Should have student_id as None since user_id was not present
        assert data["items"][0]["student_id"] is None

def test_get_submissions_by_assignment_mapping_error(client, test_user, test_token, test_submission):
    """Test get_submissions_by_assignment when user_id mapping fails"""
    # Mock submission without user_id to trigger the missing line
    mock_submission = MagicMock()
    mock_submission.__dict__ = {
        'id': 1,
        'content': 'Test submission',
        'assignment_id': 1,
        'created_at': datetime(2025, 1, 1),
        'updated_at': datetime(2025, 1, 2),
        'status': 'submitted',
        'score': 100.0,
        'feedback_count': 0,
        'submission_metadata': {}
    }
    # Remove user_id to trigger the missing line
    if hasattr(mock_submission.__dict__, 'user_id'):
        del mock_submission.__dict__['user_id']
    
    with patch('app.api.v1.api.submission_crud.get_by_assignment_sync', return_value=[mock_submission]):
        response = client.get(f"/api/v1/assignments/1/submissions", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        # Should have student_id as None since user_id was not present
        assert data["items"][0]["student_id"] is None 