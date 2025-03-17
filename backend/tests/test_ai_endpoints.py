"""Tests for AI endpoints."""
import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import status

from ai_models.model_manager import ModelManager
from backend.config import settings


@pytest.fixture
async def mock_ai_response():
    """Mock OpenAI API response."""
    return {
        "id": "chatcmpl-123",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "gpt-4",
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Test assignment content"
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 100,
            "total_tokens": 150
        }
    }


@pytest.fixture
async def mock_anthropic_response():
    """Mock Anthropic API response."""
    return {
        "id": "msg_123",
        "type": "message",
        "role": "assistant",
        "content": [{
            "type": "text",
            "text": "Test assignment content"
        }],
        "model": "claude-3",
        "usage": {
            "input_tokens": 50,
            "output_tokens": 100
        }
    }


@pytest.fixture
async def test_user_token():
    """Test user authentication token."""
    return "test_token"


@pytest.fixture
async def client(test_user_token):
    """Test client with authentication."""
    from fastapi.testclient import TestClient
    from backend.main import app
    
    client = TestClient(app)
    client.headers = {"Authorization": f"Bearer {test_user_token}"}
    return client


class TestAIEndpoints:
    """Test cases for AI endpoints."""

    @pytest.mark.asyncio
    async def test_generate_assignment_success(
        self,
        client,
        test_user_token,
        mock_ai_response
    ):
        """Test successful assignment generation."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Create a calculus problem set",
            "additional_requirements": ["Include derivatives", "Add integration problems"]
        }

        with patch('openai.ChatCompletion.acreate', new_callable=AsyncMock) as mock_openai:
            mock_openai.return_value = mock_ai_response
            response = await client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert "content" in data
        assert "usage" in data
        assert data["status"] == "completed"

    @pytest.mark.asyncio
    async def test_generate_assignment_rate_limit(self, client, test_user_token):
        """Test rate limiting for assignment generation."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        responses = []
        for _ in range(settings.RATE_LIMIT_PER_MINUTE + 1):
            response = await client.post("/api/ai/generate", json=test_data, headers=headers)
            responses.append(response)

        assert any(r.status_code == status.HTTP_429_TOO_MANY_REQUESTS for r in responses)

    @pytest.mark.asyncio
    async def test_generate_assignment_model_fallback(
        self,
        client,
        test_user_token,
        mock_ai_response,
        mock_anthropic_response
    ):
        """Test AI model fallback mechanism."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        with patch('openai.ChatCompletion.acreate', new_callable=AsyncMock) as mock_openai, \
             patch('anthropic.Anthropic.messages.create', new_callable=AsyncMock) as mock_anthropic:
            mock_openai.side_effect = Exception("OpenAI API error")
            mock_anthropic.return_value = mock_anthropic_response

            response = await client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["model"] == "claude-3"
        assert "content" in data

    @pytest.mark.asyncio
    async def test_generate_assignment_validation(self, client, test_user_token):
        """Test input validation for assignment generation."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        test_data = {
            "subject": "mathematics"
        }
        response = await client.post("/api/ai/generate", json=test_data, headers=headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        test_data = {
            "subject": "invalid_subject",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }
        response = await client.post("/api/ai/generate", json=test_data, headers=headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_generate_assignment_token_limits(self, client, test_user_token):
        """Test token limit handling."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment",
            "additional_requirements": ["requirement"] * 100
        }

        response = await client.post("/api/ai/generate", json=test_data, headers=headers)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "token limit" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_assignment_error_handling(self, client, test_user_token):
        """Test error handling for various AI service failures."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        with patch('openai.ChatCompletion.acreate', new_callable=AsyncMock) as mock_openai, \
             patch('anthropic.Anthropic.messages.create', new_callable=AsyncMock) as mock_anthropic, \
             patch('backend.ai_models.google_ai.generate', new_callable=AsyncMock) as mock_google:
            
            mock_openai.side_effect = Exception("OpenAI error")
            mock_anthropic.side_effect = Exception("Anthropic error")
            mock_google.side_effect = Exception("Google AI error")

            response = await client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "all ai services failed" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_assignment_retry_mechanism(
        self,
        client,
        test_user_token,
        mock_ai_response
    ):
        """Test retry mechanism for failed requests."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        with patch('openai.ChatCompletion.acreate', new_callable=AsyncMock) as mock_openai:
            mock_openai.side_effect = [
                Exception("First failure"),
                Exception("Second failure"),
                mock_ai_response
            ]

            response = await client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["retries"] == 2

    @pytest.mark.asyncio
    async def test_generate_assignment_response_validation(self, client, test_user_token):
        """Test AI response validation and formatting."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        invalid_response = {
            "choices": [{
                "message": {
                    "content": "Invalid format response"
                }
            }]
        }

        with patch('openai.ChatCompletion.acreate', new_callable=AsyncMock) as mock_openai:
            mock_openai.return_value = invalid_response
            response = await client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "invalid response format" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_model_selection_logic(
        self,
        client,
        test_user_token,
        mock_ai_response
    ):
        """Test AI model selection logic."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment",
            "model_preference": "gpt-4"
        }

        with patch.object(ModelManager, 'select_model', new_callable=AsyncMock) as mock_select:
            mock_select.return_value = ("gpt-4", mock_ai_response)
            response = await client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["model"] == "gpt-4"