import pytest
from fastapi import status
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate
from unittest.mock import MagicMock, patch
from datetime import datetime
from types import SimpleNamespace

def test_create_feedback(client, test_user, test_token, test_submission):
    feedback_data = {
        "submission_id": test_submission.id,
        "content": "Great work!",
        "score": 85,
        "feedback_type": "grading",
    }
    
    response = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {test_token}"},
        json=feedback_data,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["content"] == feedback_data["content"]
    assert data["submission_id"] == test_submission.id
    assert data["score"] == feedback_data["score"]

def test_get_feedback(client, test_user, test_token, test_feedback):
    response = client.get(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert data["total"] > 0

def test_get_feedback_by_id(client, test_user, test_token, test_feedback):
    response = client.get(
        f"/api/v1/feedback/{test_feedback.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == test_feedback.id

def test_update_feedback(client, test_user, test_token, test_feedback):
    update_data = {
        "content": "Updated feedback",
        "score": 90,
    }
    
    response = client.put(
        f"/api/v1/feedback/{test_feedback.id}",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["content"] == update_data["content"]
    assert data["score"] == update_data["score"]

def test_delete_feedback(client, test_user, test_token, test_feedback):
    response = client.delete(
        f"/api/v1/feedback/{test_feedback.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify feedback is deleted
    response = client.get(
        f"/api/v1/feedback/{test_feedback.id}",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_feedback_by_submission(client, test_user, test_token, test_feedback):
    response = client.get(
        f"/api/v1/submissions/{test_feedback.submission_id}/feedback",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert all(fb["submission_id"] == test_feedback.submission_id for fb in data["items"])

def test_get_feedback_by_user(client, test_user, test_token, test_feedback):
    response = client.get(
        f"/api/v1/users/{test_user.id}/feedback",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["items"]) > 0
    assert all(fb["user_id"] == test_user.id for fb in data["items"])

def test_create_feedback_with_invalid_score(client, test_user, test_token, test_submission):
    feedback_data = {
        "submission_id": test_submission.id,
        "content": "Invalid score",
        "score": 150,  # Invalid score value
        "feedback_type": "grading",
    }
    
    response = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {test_token}"},
        json=feedback_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_feedback_with_invalid_type(client, test_user, test_token, test_submission):
    feedback_data = {
        "submission_id": test_submission.id,
        "content": "Invalid type",
        "score": 85,
        "feedback_type": "invalid_type",  # Invalid feedback type
    }
    
    response = client.post(
        "/api/v1/feedback",
        headers={"Authorization": f"Bearer {test_token}"},
        json=feedback_data,
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 

def test_get_feedback_by_user_with_submission_no_user_id(client, test_user, test_token, test_feedback):
    """Test get_feedback_by_user when feedback has submission but no user_id"""
    # Mock feedback with submission that has no user_id
    mock_feedback = SimpleNamespace(
        id=1,
        content='Test feedback',
        feedback_type='general',
        submission_id=1,
        created_at=datetime(2025, 1, 1),
        updated_at=datetime(2025, 1, 2),
        confidence_score=0.95,
        score=100.0,
        feedback_metadata={}
    )
    mock_feedback.submission = SimpleNamespace()
    # Remove user_id from submission to trigger the missing line
    if hasattr(mock_feedback.submission, 'user_id'):
        delattr(mock_feedback.submission, 'user_id')
    
    with patch('app.api.v1.api.feedback_crud.get_feedback_by_user', return_value=[mock_feedback]):
        response = client.get(f"/api/v1/users/{test_user.id}/feedback", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        # Should not have user_id in the result since submission has no user_id
        assert "user_id" not in data["items"][0]

def test_get_feedback_by_user_with_submission_none(client, test_user, test_token, test_feedback):
    """Test get_feedback_by_user when feedback has no submission"""
    # Mock feedback with no submission
    mock_feedback = SimpleNamespace(
        id=1,
        content='Test feedback',
        feedback_type='general',
        submission_id=1,
        created_at=datetime(2025, 1, 1),
        updated_at=datetime(2025, 1, 2),
        confidence_score=0.95,
        score=100.0,
        feedback_metadata={}
    )
    mock_feedback.submission = None
    
    with patch('app.api.v1.api.feedback_crud.get_feedback_by_user', return_value=[mock_feedback]):
        response = client.get(f"/api/v1/users/{test_user.id}/feedback", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        # Should not have user_id in the result since submission is None
        assert "user_id" not in data["items"][0]

def test_get_feedback_by_user_with_submission_no_hasattr(client, test_user, test_token, test_feedback):
    """Test get_feedback_by_user when feedback submission doesn't have hasattr"""
    # Mock feedback with submission that doesn't have hasattr
    mock_feedback = SimpleNamespace(
        id=1,
        content='Test feedback',
        feedback_type='general',
        submission_id=1,
        created_at=datetime(2025, 1, 1),
        updated_at=datetime(2025, 1, 2),
        confidence_score=0.95,
        score=100.0,
        feedback_metadata={}
    )
    class NoUserId:
        pass
    mock_feedback.submission = NoUserId()
    
    with patch('app.api.v1.api.feedback_crud.get_feedback_by_user', return_value=[mock_feedback]):
        response = client.get(f"/api/v1/users/{test_user.id}/feedback", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 1
        # Should not have user_id in the result since submission doesn't have user_id attribute
        assert "user_id" not in data["items"][0] 

def test_get_feedback_not_found(client, test_user, test_token, test_feedback):
    """Test get_feedback when feedback not found"""
    with patch('app.api.v1.endpoints.feedback.feedback_crud.get_feedback', return_value=None):
        response = client.get("/api/v1/feedback/999", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data["detail"] == "Feedback not found"

def test_update_feedback_not_found(client, test_user, test_token, test_feedback):
    """Test update_feedback when feedback not found"""
    feedback_update = {
        "content": "Updated feedback content",
        "feedback_type": "general",
        "score": 85.0
    }
    
    with patch('app.api.v1.endpoints.feedback.feedback_crud.update_feedback', return_value=None):
        response = client.put("/api/v1/feedback/999", json=feedback_update, headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data["detail"] == "Feedback not found"

def test_delete_feedback_not_found(client, test_user, test_token, test_feedback):
    """Test delete_feedback when feedback not found"""
    with patch('app.api.v1.endpoints.feedback.feedback_crud.delete_feedback', return_value=False):
        response = client.delete("/api/v1/feedback/999", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert data["detail"] == "Feedback not found" 