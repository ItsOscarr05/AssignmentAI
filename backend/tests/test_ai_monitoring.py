import time
import pytest
from unittest.mock import patch, MagicMock
from prometheus_client import REGISTRY
from backend.monitoring.metrics import (
    ai_request_duration_seconds,
    ai_tokens_total,
    ai_errors_total,
    ai_model_usage_total
)

class TestAIMonitoring:
    @pytest.mark.asyncio
    async def test_ai_request_metrics(self, client, test_user_token, mock_ai_response):
        """Test AI request metrics collection"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        # Clear existing metrics
        if 'ai_request_duration_seconds' in REGISTRY._names_to_collectors:
            REGISTRY.unregister(ai_request_duration_seconds)
        
        with patch('openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = mock_ai_response
            response = client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == 200
        
        # Verify metrics were recorded
        metric = REGISTRY.get_sample_value(
            'ai_request_duration_seconds_count',
            {'model': 'gpt-4', 'endpoint': '/api/ai/generate'}
        )
        assert metric is not None and metric > 0

    @pytest.mark.asyncio
    async def test_token_usage_tracking(self, client, test_user_token, mock_ai_response):
        """Test token usage metrics collection"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        # Clear existing metrics
        if 'ai_tokens_total' in REGISTRY._names_to_collectors:
            REGISTRY.unregister(ai_tokens_total)

        with patch('openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = mock_ai_response
            response = client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == 200

        # Verify token metrics
        prompt_tokens = REGISTRY.get_sample_value(
            'ai_tokens_total',
            {'model': 'gpt-4', 'type': 'prompt'}
        )
        completion_tokens = REGISTRY.get_sample_value(
            'ai_tokens_total',
            {'model': 'gpt-4', 'type': 'completion'}
        )
        
        assert prompt_tokens == 50  # From mock response
        assert completion_tokens == 100  # From mock response

    @pytest.mark.asyncio
    async def test_error_tracking(self, client, test_user_token):
        """Test AI error metrics collection"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        # Clear existing metrics
        if 'ai_errors_total' in REGISTRY._names_to_collectors:
            REGISTRY.unregister(ai_errors_total)

        with patch('openai.ChatCompletion.create') as mock_openai:
            mock_openai.side_effect = Exception("API Error")
            response = client.post("/api/ai/generate", json=test_data, headers=headers)

        # Verify error metrics
        error_count = REGISTRY.get_sample_value(
            'ai_errors_total',
            {'model': 'gpt-4', 'error_type': 'api_error'}
        )
        assert error_count == 1

    @pytest.mark.asyncio
    async def test_model_usage_tracking(self, client, test_user_token, mock_ai_response):
        """Test AI model usage metrics collection"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        # Clear existing metrics
        if 'ai_model_usage_total' in REGISTRY._names_to_collectors:
            REGISTRY.unregister(ai_model_usage_total)

        with patch('openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = mock_ai_response
            response = client.post("/api/ai/generate", json=test_data, headers=headers)

        assert response.status_code == 200

        # Verify model usage metrics
        usage_count = REGISTRY.get_sample_value(
            'ai_model_usage_total',
            {'model': 'gpt-4', 'subject': 'mathematics'}
        )
        assert usage_count == 1

    @pytest.mark.asyncio
    async def test_performance_degradation_detection(self, client, test_user_token, mock_ai_response):
        """Test detection of AI model performance degradation"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        # Simulate multiple requests with varying latencies
        with patch('openai.ChatCompletion.create') as mock_openai:
            mock_openai.return_value = mock_ai_response
            
            # First request - normal latency
            response1 = client.post("/api/ai/generate", json=test_data, headers=headers)
            
            # Second request - high latency
            mock_openai.side_effect = lambda *args, **kwargs: time.sleep(2) or mock_ai_response
            response2 = client.post("/api/ai/generate", json=test_data, headers=headers)

        # Verify latency metrics
        latency_p95 = REGISTRY.get_sample_value(
            'ai_request_duration_seconds',
            {'model': 'gpt-4', 'endpoint': '/api/ai/generate', 'quantile': '0.95'}
        )
        assert latency_p95 > 1.0  # Should detect the high latency

    @pytest.mark.asyncio
    async def test_quota_tracking(self, client, test_user_token, mock_ai_response):
        """Test AI quota usage tracking"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        test_data = {
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }

        # Make multiple requests to track quota
        for _ in range(3):
            with patch('openai.ChatCompletion.create') as mock_openai:
                mock_openai.return_value = mock_ai_response
                response = client.post("/api/ai/generate", json=test_data, headers=headers)
                assert response.status_code == 200

        # Verify quota metrics
        quota_used = REGISTRY.get_sample_value(
            'ai_quota_used_total',
            {'model': 'gpt-4'}
        )
        assert quota_used == 450  # 3 requests * 150 tokens per request 