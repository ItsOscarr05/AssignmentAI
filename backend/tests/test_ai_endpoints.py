import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.schemas.ai_assignment import AssignmentGenerationRequest, AssignmentGenerationResponse
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.main import app
from app.core.deps import get_current_user
from fastapi import HTTPException

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
    return AssignmentGenerationResponse(
        success=True,
        assignment={
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
        },
        error=None
    )

@pytest.fixture
def mock_user():
    """Create a mock user for testing"""
    user = Mock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.is_active = True
    return user

@pytest.fixture
def auth_headers():
    """Create authentication headers for testing with a mock user ID"""
    token = create_access_token(subject=1)  # Use a fixed user ID for testing
    return {"Authorization": f"Bearer {token}"}

def test_generate_assignment_authenticated(client, auth_headers, sample_assignment_request, sample_generated_assignment, mock_user):
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.services.ai_service.AIService.generate_assignment', new_callable=AsyncMock, return_value=sample_generated_assignment), \
             patch('app.services.ai_service.AIService.enforce_token_limit', new_callable=AsyncMock), \
             patch('app.core.rate_limit.check_rate_limit', return_value=100):
            
            response = client.post(
                f"{settings.API_V1_STR}/ai/generate-assignment",
                json=sample_assignment_request,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            assert response.json()["success"] is True
            assert response.json()["assignment"]["title"] == "Understanding Quadratic Equations"
    finally:
        app.dependency_overrides.clear()

def test_generate_assignment_unauthenticated(client, sample_assignment_request):
    response = client.post(
        f"{settings.API_V1_STR}/ai/generate-assignment",
        json=sample_assignment_request
    )
    
    assert response.status_code == 401

def test_generate_feedback_authenticated(client, auth_headers, mock_user):
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.services.ai_service.AIService.generate_feedback', new_callable=AsyncMock, return_value={
            "id": 1,
            "submission_id": 1,
            "content": "Sample feedback",
            "feedback_type": "content",
            "confidence_score": 0.8,
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00",
            "metadata": {
                "model_version": "1.0",
                "generated_at": "2024-01-01T00:00:00"
            }
        }), \
        patch('app.services.ai_service.AIService.enforce_token_limit', new_callable=AsyncMock), \
        patch('app.core.rate_limit.check_rate_limit', return_value=100):
            
            response = client.post(
                f"{settings.API_V1_STR}/ai/generate-feedback",
                json={
                    "submission_content": "Sample submission",
                    "feedback_type": "content",
                    "submission_id": 1
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200
            assert response.json()["content"] == "Sample feedback"
            assert response.json()["feedback_type"] == "content"
    finally:
        app.dependency_overrides.clear()

def test_generate_feedback_unauthenticated(client):
    response = client.post(
        f"{settings.API_V1_STR}/ai/generate-feedback",
        json={
            "submission_content": "Sample submission",
            "feedback_type": "content",
            "submission_id": 1
        }
    )
    
    assert response.status_code == 401

def test_analyze_submission_authenticated(client, auth_headers, mock_user):
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.services.ai_service.AIService.analyze_submission', new_callable=AsyncMock, return_value={
            "score": 85.0,
            "feedback": "Good work overall",
            "suggestions": ["Add more examples"],
            "strengths": ["Clear explanations"],
            "areas_for_improvement": ["More detailed analysis"]
        }), \
        patch('app.services.ai_service.AIService.enforce_token_limit', new_callable=AsyncMock), \
        patch('app.crud.submission.get_sync', return_value=Mock(content="Test content", assignment=Mock(content="Test requirements"))):
            
            response = client.post(
                f"{settings.API_V1_STR}/ai/analyze/1",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            assert response.json()["score"] == 85.0
            assert "feedback" in response.json()
            assert "suggestions" in response.json()
    finally:
        app.dependency_overrides.clear()

def test_analyze_submission_unauthenticated(client):
    response = client.post(
        f"{settings.API_V1_STR}/ai/analyze/1"
    )
    
    assert response.status_code == 401

def test_analyze_submission_not_found(client, auth_headers, mock_user):
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.crud.submission.get_sync', return_value=None):
            
            response = client.post(
                f"{settings.API_V1_STR}/ai/analyze/999",
                headers=auth_headers
            )
            
            assert response.status_code == 404
            assert response.json()["detail"] == "Submission not found"
    finally:
        app.dependency_overrides.clear()

def test_rate_limiting(client, auth_headers, sample_assignment_request, mock_user):
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        # Mock the rate limit to raise an exception that should be caught
        def mock_check_rate_limit(client_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        with patch('app.api.v1.endpoints.ai.check_rate_limit', side_effect=mock_check_rate_limit), \
             patch('app.services.ai_service.AIService.enforce_token_limit', new_callable=AsyncMock), \
             patch('app.services.ai_service.AIService.generate_assignment', new_callable=AsyncMock, return_value=AssignmentGenerationResponse(success=True, assignment=None, error=None)):
            
            response = client.post(
                f"{settings.API_V1_STR}/ai/generate-assignment",
                json=sample_assignment_request,
                headers=auth_headers
            )
            
            assert response.status_code == 429
            assert "Rate limit exceeded" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear() 

def test_get_ai_assignments_by_assignment_success(client, auth_headers, mock_user):
    """Test successful retrieval of AI assignments by assignment"""
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.api.v1.api.ai_assignment_crud.get_ai_assignment_by_assignment') as mock_get, \
             patch('app.api.v1.api.ai_assignment_crud.count_ai_assignments_by_assignment') as mock_count:
            
            # Mock valid AI assignments with all required schema fields
            mock_assignments = [
                {
                    "id": 1,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Test prompt",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Test content",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                },
                {
                    "id": 2,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Test prompt 2",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Test content 2",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            ]
            mock_get.return_value = mock_assignments
            mock_count.return_value = 2
            
            response = client.get(
                f"{settings.API_V1_STR}/assignments/1/ai-assignments",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert "total" in data
            assert "skip" in data
            assert "limit" in data
            assert len(data["items"]) == 2
            assert data["total"] == 2
    finally:
        app.dependency_overrides.clear()

def test_get_ai_assignments_by_assignment_with_invalid_data(client, auth_headers, mock_user):
    """Test AI assignments endpoint with invalid data that causes validation exception"""
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.api.v1.api.ai_assignment_crud.get_ai_assignment_by_assignment') as mock_get, \
             patch('app.api.v1.api.ai_assignment_crud.count_ai_assignments_by_assignment') as mock_count:
            
            # Mock assignments with invalid data that will cause validation to fail
            mock_assignments = [
                {
                    "id": 1,
                    "assignment_id": 1,
                    "user_id": 1,
                    # Missing required fields to cause validation exception
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                },
                {
                    "id": 2,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Valid prompt",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Valid content",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            ]
            mock_get.return_value = mock_assignments
            mock_count.return_value = 2
            
            response = client.get(
                f"{settings.API_V1_STR}/assignments/1/ai-assignments",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            # Should only include valid items (the second one)
            assert len(data["items"]) == 1
            assert data["total"] == 1
    finally:
        app.dependency_overrides.clear()

def test_get_ai_assignments_by_user_success(client, auth_headers, mock_user):
    """Test successful retrieval of AI assignments by user"""
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.api.v1.api.ai_assignment_crud.get_ai_assignments_by_user') as mock_get, \
             patch('app.api.v1.api.ai_assignment_crud.count_ai_assignments_by_user') as mock_count:
            
            # Mock valid AI assignments with all required schema fields
            mock_assignments = [
                {
                    "id": 1,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Test prompt",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Test content",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                },
                {
                    "id": 2,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Test prompt 2",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Test content 2",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            ]
            mock_get.return_value = mock_assignments
            mock_count.return_value = 2
            
            response = client.get(
                f"{settings.API_V1_STR}/users/1/ai-assignments",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert "total" in data
            assert "skip" in data
            assert "limit" in data
            assert len(data["items"]) == 2
            assert data["total"] == 2
    finally:
        app.dependency_overrides.clear()

def test_get_ai_assignments_by_user_with_invalid_data(client, auth_headers, mock_user):
    """Test AI assignments by user endpoint with invalid data that causes validation exception"""
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.api.v1.api.ai_assignment_crud.get_ai_assignments_by_user') as mock_get, \
             patch('app.api.v1.api.ai_assignment_crud.count_ai_assignments_by_user') as mock_count:
            
            # Mock assignments with invalid data that will cause validation to fail
            mock_assignments = [
                {
                    "id": 1,
                    "assignment_id": 1,
                    "user_id": 1,
                    # Missing required fields to cause validation exception
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                },
                {
                    "id": 2,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Valid prompt",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Valid content",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            ]
            mock_get.return_value = mock_assignments
            mock_count.return_value = 2
            
            response = client.get(
                f"{settings.API_V1_STR}/users/1/ai-assignments",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            # Should only include valid items (the second one)
            assert len(data["items"]) == 1
            assert data["total"] == 1
    finally:
        app.dependency_overrides.clear()

def test_get_ai_assignments_by_assignment_pagination(client, auth_headers, mock_user):
    """Test AI assignments by assignment with pagination parameters"""
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.api.v1.api.ai_assignment_crud.get_ai_assignment_by_assignment') as mock_get, \
             patch('app.api.v1.api.ai_assignment_crud.count_ai_assignments_by_assignment') as mock_count:
            
            mock_assignments = [
                {
                    "id": 1,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Test prompt",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Test content",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            ]
            mock_get.return_value = mock_assignments
            mock_count.return_value = 1
            
            response = client.get(
                f"{settings.API_V1_STR}/assignments/1/ai-assignments?skip=0&limit=10",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["skip"] == 0
            assert data["limit"] == 10
    finally:
        app.dependency_overrides.clear()

def test_get_ai_assignments_by_user_pagination(client, auth_headers, mock_user):
    """Test AI assignments by user with pagination parameters"""
    # Override the dependency
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    try:
        with patch('app.api.v1.api.ai_assignment_crud.get_ai_assignments_by_user') as mock_get, \
             patch('app.api.v1.api.ai_assignment_crud.count_ai_assignments_by_user') as mock_count:
            
            mock_assignments = [
                {
                    "id": 1,
                    "assignment_id": 1,
                    "user_id": 1,
                    "prompt": "Test prompt",
                    "model": "gpt-4",
                    "max_tokens": 1000,
                    "temperature": 0.7,
                    "status": "completed",
                    "generated_content": "Test content",
                    "model_version": "1.0",
                    "confidence_score": 0.8,
                    "generation_metadata": {},
                    "generated_at": "2024-01-01T00:00:00",
                    "created_at": "2024-01-01T00:00:00",
                    "updated_at": "2024-01-01T00:00:00"
                }
            ]
            mock_get.return_value = mock_assignments
            mock_count.return_value = 1
            
            response = client.get(
                f"{settings.API_V1_STR}/users/1/ai-assignments?skip=0&limit=10",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["skip"] == 0
            assert data["limit"] == 10
    finally:
        app.dependency_overrides.clear() 