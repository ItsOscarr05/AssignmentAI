import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.ai_service import AIService
from app.schemas.ai_assignment import AssignmentGenerationRequest, AssignmentGenerationResponse, GeneratedAssignment, AssignmentContent
from app.schemas.feedback import FeedbackCreate
from app.models.subscription import Subscription, SubscriptionStatus
from datetime import datetime
from fastapi import HTTPException
import json

@pytest.fixture
def mock_db():
    return AsyncMock()

@pytest.fixture
def ai_service(mock_db):
    with patch('app.services.ai_service.AsyncOpenAI') as mock_openai:
        mock_client = AsyncMock()
        mock_openai.return_value = mock_client
        service = AIService(mock_db)
        service.client = mock_client
        return service

@pytest.fixture
def sample_assignment_request():
    return AssignmentGenerationRequest(
        subject="Mathematics",
        grade_level="10",
        topic="Algebra",
        difficulty="medium"
    )

@pytest.fixture
def mock_openai_response():
    response = MagicMock()
    response.choices = [MagicMock()]
    response.choices[0].message.content = """
Title:
Algebra Problem Set
Description:
A comprehensive set of algebra problems
Objectives:
- Solve linear equations
- Understand variables
Instructions:
Complete all problems showing your work
Requirements:
- Calculator
- Graph paper
Evaluation Criteria:
- Accuracy
- Methodology
Estimated Duration:
60 minutes
Resources:
- Textbook Chapter 5
    """
    return response

class TestAIService:
    
    async def test_get_user_model_with_subscription(self, ai_service, mock_db):
        """Test getting user model when user has active subscription"""
        mock_subscription = MagicMock(spec=Subscription)
        mock_subscription.ai_model = "gpt-4"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_subscription
        mock_db.execute.return_value = mock_result
        
        result = await ai_service.get_user_model(1)
        
        assert result == "gpt-4"
        mock_db.execute.assert_called_once()

    async def test_get_user_model_without_subscription(self, ai_service, mock_db):
        """Test getting default model when user has no subscription"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        result = await ai_service.get_user_model(1)
        
        assert result == "gpt-5-nano"

    async def test_generate_assignment_success(self, ai_service, sample_assignment_request, mock_openai_response):
        """Test successful assignment generation"""
        with patch.object(ai_service, '_call_openai_with_retry', return_value=mock_openai_response.choices[0].message.content):
            result = await ai_service.generate_assignment(sample_assignment_request)
            
            assert result.success is True
            assert result.assignment is not None
            assert result.assignment.title == "Algebra Problem Set"
            assert result.error is None

    async def test_generate_assignment_invalid_request(self, ai_service):
        """Test assignment generation with invalid request"""
        # Create valid request first, then modify it to be invalid
        valid_request = AssignmentGenerationRequest(
            subject="Mathematics",
            grade_level="10",
            topic="Algebra",
            difficulty="medium"
        )
        # Manually set invalid subject to bypass Pydantic validation
        valid_request.subject = ""
        
        result = await ai_service.generate_assignment(valid_request)
        
        assert result.success is False
        assert result.assignment is None
        assert "Invalid request parameters" in result.error

    async def test_generate_assignment_openai_error(self, ai_service, sample_assignment_request):
        """Test assignment generation when OpenAI API fails"""
        with patch.object(ai_service, '_call_openai_with_retry', side_effect=Exception("OpenAI API error")):
            result = await ai_service.generate_assignment(sample_assignment_request)
            
            assert result.success is False
            assert result.assignment is None
            assert "Failed to generate assignment" in result.error

    async def test_generate_feedback_success(self, ai_service, mock_db):
        """Test successful feedback generation"""
        mock_subscription = MagicMock(spec=Subscription)
        mock_subscription.ai_model = "gpt-4"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_subscription
        mock_db.execute.return_value = mock_result
        
        mock_openai_response = MagicMock()
        mock_openai_response.choices = [MagicMock()]
        mock_openai_response.choices[0].message.content = "Great work! Your solution is correct."
        
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_openai_response)
        
        result = await ai_service.generate_feedback(
            user_id=1,
            submission_content="2x + 3 = 7, x = 2",
            feedback_type="general",
            submission_id=1
        )
        
        assert result is not None
        assert isinstance(result, FeedbackCreate)
        assert result.content == "Great work! Your solution is correct."
        assert result.feedback_type == "general"
        assert result.submission_id == 1

    async def test_generate_feedback_openai_error(self, ai_service, mock_db):
        """Test feedback generation when OpenAI API fails"""
        mock_subscription = MagicMock(spec=Subscription)
        mock_subscription.ai_model = "gpt-4"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_subscription
        mock_db.execute.return_value = mock_result
        
        ai_service.client.chat.completions.create = AsyncMock(side_effect=Exception("OpenAI API error"))
        
        result = await ai_service.generate_feedback(
            user_id=1,
            submission_content="2x + 3 = 7, x = 2",
            feedback_type="general",
            submission_id=1
        )
        
        assert result is None

    async def test_analyze_submission_success(self, ai_service, mock_db):
        """Test successful submission analysis"""
        mock_subscription = MagicMock(spec=Subscription)
        mock_subscription.ai_model = "gpt-4"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_subscription
        mock_db.execute.return_value = mock_result
        
        mock_openai_response = MagicMock()
        mock_openai_response.choices = [MagicMock()]
        mock_openai_response.choices[0].message.content = """
        Score: 85
        Feedback: Good work overall
        Strengths:
        - Clear methodology
        Areas for improvement:
        - Show more steps
        """
        
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_openai_response)
        
        result = await ai_service.analyze_submission(
            submission_content="2x + 3 = 7, x = 2",
            assignment_requirements={"type": "algebra", "difficulty": "medium"},
            user_id=1
        )
        
        assert result is not None
        assert "score" in result
        assert result["score"] == 85.0

    async def test_analyze_submission_error(self, ai_service, mock_db):
        """Test submission analysis when OpenAI API fails"""
        mock_subscription = MagicMock(spec=Subscription)
        mock_subscription.ai_model = "gpt-4"
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_subscription
        mock_db.execute.return_value = mock_result
        
        ai_service.client.chat.completions.create = AsyncMock(side_effect=Exception("OpenAI API error"))
        
        with pytest.raises(Exception) as exc_info:
            await ai_service.analyze_submission(
                submission_content="2x + 3 = 7, x = 2",
                assignment_requirements={"type": "algebra", "difficulty": "medium"},
                user_id=1
            )
        assert "OpenAI API error" in str(exc_info.value)

    def test_validate_request_valid(self, ai_service, sample_assignment_request):
        """Test valid request validation"""
        result = ai_service._validate_request(sample_assignment_request)
        assert result is True

    def test_validate_request_invalid_subject(self, ai_service):
        """Test invalid subject validation"""
        # Create valid request first, then modify it
        valid_request = AssignmentGenerationRequest(
            subject="Mathematics",
            grade_level="10",
            topic="Algebra",
            difficulty="medium"
        )
        valid_request.subject = ""  # Manually set invalid subject
        
        result = ai_service._validate_request(valid_request)
        assert result is False

    def test_validate_request_invalid_grade_level(self, ai_service):
        """Test invalid grade level validation"""
        # Create valid request first, then modify it
        valid_request = AssignmentGenerationRequest(
            subject="Mathematics",
            grade_level="10",
            topic="Algebra",
            difficulty="medium"
        )
        valid_request.grade_level = "invalid"  # Manually set invalid grade level
        
        result = ai_service._validate_request(valid_request)
        assert result is False

    def test_validate_request_invalid_difficulty(self, ai_service):
        """Test invalid difficulty validation"""
        # Create valid request first, then modify it
        valid_request = AssignmentGenerationRequest(
            subject="Mathematics",
            grade_level="10",
            topic="Algebra",
            difficulty="medium"
        )
        valid_request.difficulty = "invalid"  # Manually set invalid difficulty
        
        result = ai_service._validate_request(valid_request)
        assert result is False

    def test_validate_generated_content_valid(self, ai_service):
        """Test valid generated content validation"""
        valid_content = {
            "title": "Math Problem",
            "description": "Solve this equation",
            "objectives": ["Learn algebra"],
            "instructions": "Show your work",
            "requirements": ["Calculator"]
        }
        
        result = ai_service._validate_generated_content(valid_content)
        assert result is True

    def test_validate_generated_content_invalid(self, ai_service):
        """Test invalid generated content validation"""
        invalid_content = {
            "title": "Math Problem"
            # Missing required fields
        }
        
        result = ai_service._validate_generated_content(invalid_content)
        assert result is False

    def test_estimate_time(self, ai_service):
        """Test time estimation"""
        easy_time = ai_service._estimate_time("easy")
        medium_time = ai_service._estimate_time("medium")
        hard_time = ai_service._estimate_time("hard")
        
        assert easy_time < medium_time < hard_time
        assert all(isinstance(t, int) for t in [easy_time, medium_time, hard_time])

    async def test_call_openai_with_retry_success(self, ai_service, mock_openai_response):
        """Test successful OpenAI API call with retry"""
        ai_service.client.chat.completions.create = AsyncMock(return_value=mock_openai_response)
        
        result = await ai_service._call_openai_with_retry("Test prompt")
        
        assert result == mock_openai_response.choices[0].message.content

    async def test_call_openai_with_retry_failure_then_success(self, ai_service, mock_openai_response):
        """Test OpenAI API call with initial failure then success"""
        ai_service.client.chat.completions.create = AsyncMock(side_effect=[Exception("API error"), mock_openai_response])
        
        result = await ai_service._call_openai_with_retry("Test prompt")
        
        assert result == mock_openai_response.choices[0].message.content

    async def test_call_openai_with_retry_all_failures(self, ai_service):
        """Test OpenAI API call with all retries failing"""
        ai_service.client.chat.completions.create = AsyncMock(side_effect=Exception("API error"))
        
        with pytest.raises(Exception):
            await ai_service._call_openai_with_retry("Test prompt") 