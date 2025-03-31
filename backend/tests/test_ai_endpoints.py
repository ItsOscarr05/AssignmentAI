import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from app.main import app
from app.schemas.ai_assignment import AssignmentGenerationRequest
from app.core.config import settings

client = TestClient(app)

@pytest.fixture
def mock_current_user():
    return Mock(
        id=1,
        email="teacher@example.com",
        role="teacher"
    )

@pytest.fixture
def mock_student_user():
    return Mock(
        id=2,
        email="student@example.com",
        role="student"
    )

@pytest.fixture
def sample_assignment_request():
    return {
        "subject": "Mathematics",
        "grade_level": "10",
        "topic": "Quadratic Equations",
        "difficulty": "medium",
        "requirements": {
            "format": "PDF",
            "length": "2-3 pages"
        }
    }

@pytest.fixture
def sample_generated_assignment():
    return {
        "success": True,
        "assignment": {
            "title": "Understanding Quadratic Equations",
            "description": "A comprehensive assignment on solving quadratic equations",
            "content": {
                "objectives": [
                    "Solve quadratic equations using various methods",
                    "Graph quadratic functions",
                    "Apply quadratic equations to real-world problems"
                ],
                "instructions": "Follow these steps to complete the assignment...",
                "requirements": [
                    "Show all work",
                    "Include graphs where applicable",
                    "Provide real-world examples"
                ],
                "evaluation_criteria": [
                    "Correctness of solutions",
                    "Clarity of explanations",
                    "Quality of graphs"
                ],
                "estimated_duration": "2 hours",
                "resources": [
                    "Textbook Chapter 5",
                    "Online graphing calculator"
                ]
            }
        }
    }

def test_generate_assignment_teacher_access(client, mock_current_user, sample_assignment_request, sample_generated_assignment):
    with patch('app.api.deps.get_current_user', return_value=mock_current_user), \
         patch('app.services.ai_service.AIService.generate_assignment', return_value=sample_generated_assignment):
        
        response = client.post(
            f"{settings.API_V1_STR}/ai/generate-assignment",
            json=sample_assignment_request
        )
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert response.json()["assignment"]["title"] == "Understanding Quadratic Equations"

def test_generate_assignment_student_access(client, mock_student_user, sample_assignment_request):
    with patch('app.api.deps.get_current_user', return_value=mock_student_user):
        response = client.post(
            f"{settings.API_V1_STR}/ai/generate-assignment",
            json=sample_assignment_request
        )
        
        assert response.status_code == 403
        assert response.json()["detail"] == "Only teachers can generate assignments"

def test_generate_feedback_teacher_access(client, mock_current_user):
    with patch('app.api.deps.get_current_user', return_value=mock_current_user), \
         patch('app.services.ai_service.AIService.generate_feedback', return_value={
             "content": "Sample feedback",
             "feedback_type": "content",
             "confidence_score": 0.8,
             "metadata": {
                 "model_version": "1.0",
                 "generated_at": "2024-01-01T00:00:00"
             }
         }):
        
        response = client.post(
            f"{settings.API_V1_STR}/ai/generate-feedback",
            json={
                "submission_content": "Sample submission",
                "feedback_type": "content"
            }
        )
        
        assert response.status_code == 200
        assert response.json()["content"] == "Sample feedback"
        assert response.json()["feedback_type"] == "content"

def test_generate_feedback_student_access(client, mock_student_user):
    with patch('app.api.deps.get_current_user', return_value=mock_student_user):
        response = client.post(
            f"{settings.API_V1_STR}/ai/generate-feedback",
            json={
                "submission_content": "Sample submission",
                "feedback_type": "content"
            }
        )
        
        assert response.status_code == 403
        assert response.json()["detail"] == "Only teachers can generate feedback"

def test_analyze_submission_teacher_access(client, mock_current_user):
    with patch('app.api.deps.get_current_user', return_value=mock_current_user), \
         patch('app.services.ai_service.AIService.analyze_submission', return_value={
             "score": 85.0,
             "feedback": "Good work overall",
             "suggestions": ["Add more examples"],
             "strengths": ["Clear explanations"],
             "areas_for_improvement": ["More detailed analysis"]
         }):
        
        response = client.post(
            f"{settings.API_V1_STR}/ai/analyze/1"
        )
        
        assert response.status_code == 200
        assert response.json()["score"] == 85.0
        assert "feedback" in response.json()
        assert "suggestions" in response.json()

def test_analyze_submission_student_access(client, mock_student_user):
    with patch('app.api.deps.get_current_user', return_value=mock_student_user):
        response = client.post(
            f"{settings.API_V1_STR}/ai/analyze/1"
        )
        
        assert response.status_code == 403
        assert response.json()["detail"] == "Only teachers can analyze submissions"

def test_analyze_submission_not_found(client, mock_current_user):
    with patch('app.api.deps.get_current_user', return_value=mock_current_user), \
         patch('app.crud.submission.get', return_value=None):
        
        response = client.post(
            f"{settings.API_V1_STR}/ai/analyze/999"
        )
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Submission not found"

def test_rate_limiting(client, mock_current_user, sample_assignment_request):
    with patch('app.api.deps.get_current_user', return_value=mock_current_user), \
         patch('app.core.rate_limit.check_rate_limit', side_effect=Exception("Rate limit exceeded")):
        
        response = client.post(
            f"{settings.API_V1_STR}/ai/generate-assignment",
            json=sample_assignment_request
        )
        
        assert response.status_code == 429
        assert "Rate limit exceeded" in response.json()["detail"] 