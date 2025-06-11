import pytest
from fastapi import status
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate

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