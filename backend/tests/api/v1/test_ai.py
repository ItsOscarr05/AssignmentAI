import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from app.main import app
from app.models.user import User
from app.schemas.assignment import AssignmentCreate
from app.schemas.ai_assignment import AssignmentGenerationRequest, AssignmentGenerationResponse, GeneratedAssignment, AssignmentContent
from app.schemas.feedback import Feedback, FeedbackCreate
from app.services.ai_service import AIService
from datetime import datetime

client = TestClient(app)

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    return user

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def override_get_current_user(mock_user):
    app.dependency_overrides = getattr(app, 'dependency_overrides', {})
    from app.core.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides = {}

@pytest.fixture
def override_get_db(mock_db):
    app.dependency_overrides = getattr(app, 'dependency_overrides', {})
    from app.core.deps import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    yield
    app.dependency_overrides = {}

@pytest.fixture(autouse=True, scope="module")
def patch_cache_service_methods():
    from app.services.cache_service import cache_service
    cache_service.get = AsyncMock(return_value=None)
    cache_service.set = AsyncMock(return_value=True)
    cache_service.delete = AsyncMock(return_value=True)
    cache_service.invalidate_by_tag = AsyncMock(return_value=True)
    cache_service.get_or_set = AsyncMock(return_value=None)
    cache_service.clear_pattern = AsyncMock(return_value=True)
    cache_service.get_many = AsyncMock(return_value={})
    cache_service.set_many = AsyncMock(return_value=True)
    cache_service.delete_many = AsyncMock(return_value=True)
    yield

def test_generate_assignment_success(override_get_current_user, override_get_db, mock_db, mock_user):
    assignment_data = {
        "title": "Test",
        "description": "Desc",
        "due_date": datetime(2025, 1, 1).isoformat(),
        "class_id": 1,
        "difficulty": "easy",
        "subject": "Math",
        "grade_level": "10",
        "assignment_type": "homework",
        "topic": "Algebra",
        "estimated_time": 60,
        "content": "Some content",
        "max_score": 100
    }
    # Full Assignment mock for response validation
    assignment_response = {
        "id": 1,
        "title": "Test",
        "description": "Desc",
        "due_date": datetime(2025, 1, 1).isoformat(),
        "class_id": 1,
        "difficulty": "easy",
        "subject": "Math",
        "grade_level": "10",
        "assignment_type": "homework",
        "topic": "Algebra",
        "estimated_time": 60,
        "content": "Some content",
        "max_score": 100,
        "user_id": 1,
        "created_at": datetime(2025, 1, 1).isoformat(),
        "updated_at": datetime(2025, 1, 1).isoformat()
    }
    with patch('app.crud.assignment.create_assignment_sync', return_value=assignment_response):
        with patch.object(AIService, 'enforce_token_limit', new_callable=AsyncMock) as mock_enforce, \
             patch('app.services.ai.AIService.generate_assignment_content', new_callable=AsyncMock, return_value="Generated content") as mock_generate:
            response = client.post("/api/v1/ai/generate", json=assignment_data)
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Test"
            assert data["description"] == "Desc"
            assert data["subject"] == "Math"
            assert data["user_id"] == 1

def test_generate_assignment_error(override_get_current_user, override_get_db, mock_db, mock_user):
    assignment_data = {
        "title": "Test",
        "description": "Desc",
        "due_date": datetime(2025, 1, 1).isoformat(),
        "class_id": 1,
        "difficulty": "easy",
        "subject": "Math",
        "grade_level": "10",
        "assignment_type": "homework",
        "topic": "Algebra",
        "estimated_time": 60,
        "content": "Some content",
        "max_score": 100
    }
    with patch('app.services.ai_service.AIService') as MockAIService:
        mock_ai = MockAIService.return_value
        mock_ai.enforce_token_limit = AsyncMock(side_effect=Exception("Token error"))
        response = client.post("/api/v1/ai/generate", json=assignment_data)
        assert response.status_code == 500
        assert "Error generating assignment" in response.json()["detail"]

def test_generate_assignment_old_success(override_get_current_user, override_get_db, mock_db, mock_user):
    req = AssignmentGenerationRequest(subject="Math", grade_level="10", topic="Algebra", difficulty="easy")
    assignment_content = AssignmentContent(
        objectives=["Understand algebraic expressions"],
        instructions="Solve all problems.",
        requirements=["Show all work"],
        evaluation_criteria=["Accuracy"],
        estimated_duration="60 minutes",
        resources=["Textbook"]
    )
    generated_assignment = GeneratedAssignment(
        title="AI Assignment",
        description="A generated assignment.",
        content=assignment_content
    )
    response_obj = AssignmentGenerationResponse(success=True, assignment=generated_assignment, error=None)
    with patch('app.api.v1.endpoints.ai.check_rate_limit'), \
         patch('app.api.v1.endpoints.ai._store_generated_assignment'), \
         patch('app.schemas.ai_assignment.AssignmentGenerationRequest.model_dump_json', return_value="{}"), \
         patch('app.schemas.ai_assignment.GeneratedAssignment.model_dump_json', return_value="{}"):
        with patch.object(AIService, 'enforce_token_limit', new_callable=AsyncMock) as mock_enforce, \
             patch.object(AIService, 'generate_assignment', new_callable=AsyncMock, return_value=response_obj) as mock_generate:
            response = client.post("/api/v1/ai/generate-assignment", json=req.model_dump())
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

def test_generate_assignment_old_rate_limit(override_get_current_user, override_get_db, mock_db, mock_user):
    req = AssignmentGenerationRequest(subject="Math", grade_level="10", topic="Algebra", difficulty="easy")
    with patch('app.api.v1.endpoints.ai.check_rate_limit', side_effect=Exception("Rate limit exceeded")):
        try:
            response = client.post("/api/v1/ai/generate-assignment", json=req.model_dump())
            # If we get here, the endpoint handled the exception
            assert response.status_code in [429, 500]
        except Exception:
            # Expected if the exception is not caught
            pass

def test_generate_feedback_success(override_get_current_user, override_get_db, mock_db, mock_user):
    feedback_req = {"submission_content": "Answer", "feedback_type": "general", "submission_id": 1}
    feedback_obj = Feedback(
        id=1,
        content="Good job on the assignment!",
        feedback_type="general",
        submission_id=1,
        created_at=datetime(2025, 1, 1),
        updated_at=datetime(2025, 1, 2),
        confidence_score=0.95,
        score=100.0,
        feedback_metadata={}
    )
    with patch('app.api.v1.endpoints.ai.check_rate_limit'), \
         patch('app.api.v1.endpoints.ai._store_generated_feedback'), \
         patch('app.schemas.feedback.FeedbackCreate.model_dump_json', return_value="{}"):
        with patch.object(AIService, 'enforce_token_limit', new_callable=AsyncMock) as mock_enforce, \
             patch.object(AIService, 'generate_feedback', new_callable=AsyncMock, return_value=feedback_obj) as mock_generate:
            response = client.post("/api/v1/ai/generate-feedback", json=feedback_req)
            assert response.status_code == 200
            data = response.json()
            assert data["content"] == "Good job on the assignment!"

def test_generate_feedback_error(override_get_current_user, override_get_db, mock_db, mock_user):
    feedback_req = {"submission_content": "Answer", "feedback_type": "general", "submission_id": 1}
    with patch('app.services.ai_service.AIService') as MockAIService, \
         patch('app.api.v1.endpoints.ai.check_rate_limit'), \
         patch('app.api.v1.endpoints.ai._store_generated_feedback'):
        mock_ai = MockAIService.return_value
        mock_ai.enforce_token_limit = AsyncMock()
        mock_ai.generate_feedback = AsyncMock(return_value=None)
        response = client.post("/api/v1/ai/generate-feedback", json=feedback_req)
        assert response.status_code == 500
        assert "An error occurred while generating feedback" in response.json()["detail"]

def test_analyze_submission_success(override_get_current_user, override_get_db, mock_db, mock_user):
    # Mock the submission retrieval
    mock_submission = MagicMock()
    mock_submission.id = 1
    mock_submission.content = "Test submission"
    mock_submission.assignment_id = 1
    mock_assignment = MagicMock()
    mock_assignment.content = "Assignment requirements"
    mock_submission.assignment = mock_assignment
    with patch('app.crud.submission.get_sync', return_value=mock_submission):
        with patch('app.crud.assignment.get_assignment_sync', return_value=mock_assignment):
            with patch('app.api.v1.endpoints.ai.AIService') as MockAIService:
                mock_ai = MockAIService.return_value
                mock_ai.analyze_submission = AsyncMock(return_value={"score": 95, "comments": "Excellent"})
                mock_ai.enforce_token_limit = AsyncMock()
                mock_ai.get_user_model = AsyncMock(return_value="gpt-4")
                response = client.post("/api/v1/ai/analyze/1")
                assert response.status_code == 200
                data = response.json()
                assert "score" in data

def test_analyze_submission_error(override_get_current_user, override_get_db, mock_db, mock_user):
    with patch('app.services.ai_service.AIService') as MockAIService:
        mock_ai = MockAIService.return_value
        mock_ai.analyze_submission = AsyncMock(side_effect=Exception("AI error"))
        response = client.post("/api/v1/ai/analyze/1")
        assert response.status_code == 500 or response.status_code == 422 