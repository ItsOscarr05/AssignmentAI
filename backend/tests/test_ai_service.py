import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from app.services.ai_service import AIService
from app.schemas.ai_assignment import (
    AssignmentGenerationRequest,
    AssignmentContent,
    GeneratedAssignment,
    AssignmentGenerationResponse
)
from app.schemas.feedback import FeedbackCreate
from app.core.config import settings

@pytest.fixture
def mock_openai():
    with patch('app.services.ai_service.OpenAI') as mock:
        yield mock

@pytest.fixture
def ai_service(db_session):
    return AIService(db_session)

@pytest.fixture
def sample_assignment_request():
    return AssignmentGenerationRequest(
        subject="Mathematics",
        grade_level="10",
        topic="Quadratic Equations",
        difficulty="medium",
        requirements={
            "format": "PDF",
            "length": "2-3 pages"
        }
    )

@pytest.fixture
def sample_generated_content():
    return """
    Title: Understanding Quadratic Equations
    Description: A comprehensive assignment on solving quadratic equations
    Objectives:
    - Solve quadratic equations using various methods
    - Graph quadratic functions
    - Apply quadratic equations to real-world problems
    Instructions: Follow these steps to complete the assignment...
    Requirements:
    - Show all work
    - Include graphs where applicable
    - Provide real-world examples
    Evaluation Criteria:
    - Correctness of solutions
    - Clarity of explanations
    - Quality of graphs
    Estimated Duration: 2 hours
    Resources:
    - Textbook Chapter 5
    - Online graphing calculator
    """

@pytest.mark.asyncio
async def test_generate_assignment_success(ai_service, mock_openai, sample_assignment_request, sample_generated_content):
    # Mock OpenAI response
    mock_response = Mock()
    mock_response.choices = [
        Mock(message=Mock(content=sample_generated_content))
    ]
    mock_openai.return_value.chat.completions.create.return_value = mock_response

    # Test assignment generation
    response = await ai_service.generate_assignment(sample_assignment_request)

    # Verify response
    assert response.success is True
    assert response.assignment is not None
    assert response.assignment.title == "Understanding Quadratic Equations"
    assert len(response.assignment.content.objectives) == 3
    assert len(response.assignment.content.requirements) == 3
    assert response.assignment.content.estimated_duration == "2 hours"

    # Verify OpenAI was called correctly
    mock_openai.return_value.chat.completions.create.assert_called_once()
    call_args = mock_openai.return_value.chat.completions.create.call_args[1]
    assert call_args['model'] == "gpt-3.5-turbo"
    assert call_args['max_tokens'] == settings.AI_MAX_TOKENS
    assert call_args['temperature'] == settings.AI_TEMPERATURE

@pytest.mark.asyncio
async def test_generate_assignment_failure(ai_service, mock_openai, sample_assignment_request):
    # Mock OpenAI error
    mock_openai.return_value.chat.completions.create.side_effect = Exception("API Error")

    # Test assignment generation
    response = await ai_service.generate_assignment(sample_assignment_request)

    # Verify error response
    assert response.success is False
    assert response.error == "API Error"
    assert response.assignment is None

@pytest.mark.asyncio
async def test_generate_feedback_success(ai_service, mock_openai):
    # Mock OpenAI response
    mock_response = Mock()
    mock_response.choices = [
        Mock(message=Mock(content="Sample feedback content"))
    ]
    mock_openai.return_value.chat.completions.create.return_value = mock_response

    # Test feedback generation
    feedback = await ai_service.generate_feedback(
        submission_content="Sample submission",
        feedback_type="content"
    )

    # Verify feedback
    assert feedback is not None
    assert feedback.content == "Sample feedback content"
    assert feedback.feedback_type == "content"
    assert feedback.confidence_score == 0.8
    assert "model_version" in feedback.metadata
    assert "generated_at" in feedback.metadata

@pytest.mark.asyncio
async def test_generate_feedback_failure(ai_service, mock_openai):
    # Mock OpenAI error
    mock_openai.return_value.chat.completions.create.side_effect = Exception("API Error")

    # Test feedback generation
    feedback = await ai_service.generate_feedback(
        submission_content="Sample submission",
        feedback_type="content"
    )

    # Verify error response
    assert feedback is None

def test_parse_assignment_content(ai_service, sample_generated_content):
    # Test content parsing
    parsed_content = ai_service._parse_assignment_content(sample_generated_content)

    # Verify parsed content
    assert parsed_content["title"] == "Understanding Quadratic Equations"
    assert len(parsed_content["objectives"]) == 3
    assert len(parsed_content["requirements"]) == 3
    assert parsed_content["estimated_duration"] == "2 hours"
    assert len(parsed_content["resources"]) == 2

def test_parse_assignment_content_invalid(ai_service):
    # Test parsing with invalid content
    parsed_content = ai_service._parse_assignment_content("Invalid content")

    # Verify default values
    assert parsed_content["title"] == "Generated Assignment"
    assert len(parsed_content["objectives"]) == 2
    assert len(parsed_content["requirements"]) == 2
    assert parsed_content["estimated_duration"] == "2 hours"
    assert len(parsed_content["resources"]) == 2

def test_construct_assignment_prompt(ai_service, sample_assignment_request):
    # Test prompt construction
    prompt = ai_service._construct_assignment_prompt(sample_assignment_request)

    # Verify prompt content
    assert "Mathematics" in prompt
    assert "10" in prompt
    assert "Quadratic Equations" in prompt
    assert "medium" in prompt
    assert "format" in prompt
    assert "length" in prompt

def test_construct_feedback_prompt(ai_service):
    # Test feedback prompt construction
    prompt = ai_service._construct_feedback_prompt(
        submission_content="Sample submission",
        feedback_type="content"
    )

    # Verify prompt content
    assert "Sample submission" in prompt
    assert "content" in prompt
    assert "Strengths:" in prompt
    assert "Areas for Improvement:" in prompt
    assert "Suggestions:" in prompt
    assert "Examples:" in prompt 