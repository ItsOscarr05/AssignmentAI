import pytest
from unittest.mock import Mock, patch, AsyncMock
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

@pytest.fixture(autouse=True)
def patch_openai():
    with patch('app.services.ai_service.AsyncOpenAI') as mock:
        mock_client = AsyncMock()
        mock.return_value = mock_client
        yield mock_client

@pytest.fixture
def ai_service(patch_openai):
    mock_db = AsyncMock()
    return AIService(mock_db)

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
    # Format content to match the parser's expectations
    # Section headers must be on separate lines ending with ":"
    return (
        "Title:\n"
        "Understanding Quadratic Equations\n"
        "Description:\n"
        "A comprehensive assignment on solving quadratic equations\n"
        "Objectives:\n"
        "- Solve quadratic equations using various methods\n"
        "- Graph quadratic functions\n"
        "- Apply quadratic equations to real-world problems\n"
        "Instructions:\n"
        "Follow these steps to complete the assignment...\n"
        "Requirements:\n"
        "- Show all work\n"
        "- Include graphs where applicable\n"
        "- Provide real-world examples\n"
        "Evaluation Criteria:\n"
        "- Correctness of solutions\n"
        "- Clarity of explanations\n"
        "- Quality of graphs\n"
        "Estimated Duration:\n"
        "2 hours\n"
        "Resources:\n"
        "- Textbook Chapter 5\n"
        "- Online graphing calculator\n"
    )

@pytest.mark.asyncio
async def test_generate_assignment_success(ai_service, patch_openai, sample_assignment_request, sample_generated_content):
    mock_response = Mock()
    mock_response.choices = [
        Mock(message=Mock(content=sample_generated_content))
    ]
    patch_openai.chat.completions.create.return_value = mock_response

    response = await ai_service.generate_assignment(sample_assignment_request)

    assert response.success is True
    assert response.assignment is not None
    assert response.assignment.title == "Understanding Quadratic Equations"
    assert len(response.assignment.content.objectives) == 3
    assert len(response.assignment.content.requirements) == 3
    assert response.assignment.content.estimated_duration == "2 hours"

    patch_openai.chat.completions.create.assert_called_once()
    call_args = patch_openai.chat.completions.create.call_args[1]
    assert call_args['model'] == settings.OPENAI_MODEL
    assert call_args['max_tokens'] == settings.AI_MAX_TOKENS
    assert call_args['temperature'] == settings.AI_TEMPERATURE

@pytest.mark.asyncio
async def test_generate_assignment_failure(ai_service, patch_openai, sample_assignment_request):
    patch_openai.chat.completions.create.side_effect = Exception("API Error")

    response = await ai_service.generate_assignment(sample_assignment_request)

    assert response.success is False
    assert "API Error" in response.error
    assert response.assignment is None

@pytest.mark.asyncio
async def test_generate_feedback_success(ai_service, patch_openai):
    mock_response = Mock()
    mock_response.choices = [
        Mock(message=Mock(content="Sample feedback content"))
    ]
    patch_openai.chat.completions.create.return_value = mock_response

    with patch.object(ai_service, 'get_user_model', return_value="gpt-3.5-turbo"):
        feedback = await ai_service.generate_feedback(
            user_id=1,
            submission_content="Sample submission",
            feedback_type="content",
            submission_id=1
        )
        assert feedback is not None
        assert feedback.content == "Sample feedback content"
        assert feedback.feedback_type == "content"
        assert feedback.confidence_score == 0.8
        assert "model_version" in feedback.feedback_metadata
        assert "generated_at" in feedback.feedback_metadata

@pytest.mark.asyncio
async def test_generate_feedback_failure(ai_service, patch_openai):
    patch_openai.chat.completions.create.side_effect = Exception("API Error")

    with patch.object(ai_service, 'get_user_model', return_value="gpt-3.5-turbo"):
        feedback = await ai_service.generate_feedback(
            user_id=1,
            submission_content="Sample submission",
            feedback_type="content",
            submission_id=1
        )
        assert feedback is None

def test_parse_assignment_content(ai_service, sample_generated_content):
    parsed_content = ai_service._parse_assignment_content(sample_generated_content)
    assert parsed_content["title"] == "Understanding Quadratic Equations"
    assert len(parsed_content["objectives"]) == 3
    assert len(parsed_content["requirements"]) == 3
    assert parsed_content["estimated_duration"] == "2 hours"
    assert len(parsed_content["resources"]) == 2

def test_parse_assignment_content_invalid(ai_service):
    parsed_content = ai_service._parse_assignment_content("Invalid content")
    # The parser successfully parses but finds no sections, so returns empty values
    assert parsed_content["title"] == "Generated Assignment"
    assert parsed_content["description"] == ""
    assert parsed_content["objectives"] == []
    assert parsed_content["instructions"] == ""
    assert parsed_content["requirements"] == []
    assert parsed_content["evaluation_criteria"] == []
    assert parsed_content["estimated_duration"] == "1 hour"
    assert parsed_content["resources"] == []

def test_construct_assignment_prompt(ai_service, sample_assignment_request):
    prompt = ai_service._construct_assignment_prompt(sample_assignment_request)
    assert "Mathematics" in prompt
    assert "10" in prompt
    assert "Quadratic Equations" in prompt
    assert "medium" in prompt
    assert "format" in prompt
    assert "length" in prompt

def test_construct_feedback_prompt(ai_service):
    prompt = ai_service._construct_feedback_prompt(
        submission_content="Sample submission",
        feedback_type="content"
    )
    assert "Sample submission" in prompt
    assert "content" in prompt
    assert "Strengths:" in prompt
    assert "Areas for Improvement:" in prompt
    assert "Suggestions:" in prompt
    assert "Examples:" in prompt 