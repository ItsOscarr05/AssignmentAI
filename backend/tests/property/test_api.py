"""
Property-based tests for API endpoints using Hypothesis.

These tests verify that our API endpoints handle a wide range of inputs correctly,
including edge cases and unexpected values. They focus on testing the API's
robustness and error handling capabilities.
"""

import pytest
from hypothesis import given, strategies as st, settings
from hypothesis.provisional import domains
from typing import Dict, List, Optional
import json
from datetime import datetime, timedelta

from fastapi.testclient import TestClient
from backend.main import app
from backend.models import TaskStatus
from .test_models import assignment_data, user_data

# Extend test timeout for complex API operations
settings.register_profile("api_tests", deadline=1000)
settings.load_profile("api_tests")

@pytest.fixture
def client():
    """Get test client."""
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    """Get authentication headers."""
    response = client.post(
        "/api/token",
        data={
            "username": "test@example.com",
            "password": "testpassword123"
        }
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

class TestAssignmentAPI:
    """Property-based tests for assignment endpoints."""
    
    @given(data=assignment_data())
    def test_create_assignment(self, client, auth_headers, data: Dict):
        """Test assignment creation with various valid inputs."""
        response = client.post(
            "/api/v1/assignments",
            headers=auth_headers,
            json=data
        )
        assert response.status_code == 200
        result = response.json()
        assert "id" in result
        assert result["title"] == data["title"]
        assert result["subject"] == data["subject"]
        assert result["grade_level"] == data["grade_level"]
    
    @given(
        st.lists(assignment_data(), min_size=1, max_size=5),
        st.integers(min_value=1, max_value=100)
    )
    def test_list_assignments(self, client, auth_headers, assignments: List[Dict], page_size: int):
        """Test assignment listing with various pagination parameters."""
        # Create test assignments
        created_ids = []
        for assignment in assignments:
            response = client.post(
                "/api/v1/assignments",
                headers=auth_headers,
                json=assignment
            )
            created_ids.append(response.json()["id"])
        
        # Test listing
        response = client.get(
            f"/api/v1/assignments?page=1&page_size={page_size}",
            headers=auth_headers
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results["items"]) <= page_size
    
    @given(st.text(min_size=1))
    def test_search_assignments(self, client, auth_headers, query: str):
        """Test assignment search with various query strings."""
        response = client.get(
            f"/api/v1/assignments/search?q={query}",
            headers=auth_headers
        )
        assert response.status_code == 200
        results = response.json()
        assert "items" in results
        assert isinstance(results["items"], list)

class TestUserAPI:
    """Property-based tests for user endpoints."""
    
    @given(data=user_data())
    def test_create_user(self, client, data: Dict):
        """Test user creation with various valid inputs."""
        response = client.post(
            "/api/v1/users",
            json=data
        )
        assert response.status_code in [200, 409]  # 409 if email already exists
        if response.status_code == 200:
            result = response.json()
            assert result["email"] == data["email"]
            assert result["first_name"] == data["first_name"]
            assert result["last_name"] == data["last_name"]
            assert result["role"] == data["role"]
    
    @given(
        email=domains().map(lambda d: f"invalid_{d}"),
        password=st.text(max_size=7)
    )
    def test_invalid_user_creation(self, client, email: str, password: str):
        """Test user creation with invalid inputs."""
        response = client.post(
            "/api/v1/users",
            json={
                "email": email,
                "password": password,
                "first_name": "Test",
                "last_name": "User",
                "role": "student"
            }
        )
        assert response.status_code == 422  # Validation error

class TestTaskAPI:
    """Property-based tests for task endpoints."""
    
    @given(st.integers(min_value=1))
    def test_get_task_status(self, client, auth_headers, task_id: int):
        """Test task status retrieval with various task IDs."""
        response = client.get(
            f"/api/v1/tasks/{task_id}",
            headers=auth_headers
        )
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            result = response.json()
            assert "status" in result
            assert result["status"] in [status.value for status in TaskStatus]

class TestErrorHandling:
    """Property-based tests for API error handling."""
    
    @given(
        st.text(min_size=1),
        st.text(min_size=1)
    )
    def test_invalid_auth(self, client, username: str, password: str):
        """Test authentication with invalid credentials."""
        response = client.post(
            "/api/token",
            data={
                "username": username,
                "password": password
            }
        )
        assert response.status_code in [401, 422]
    
    @given(st.integers(min_value=1000000))
    def test_nonexistent_resources(self, client, auth_headers, id: int):
        """Test accessing non-existent resources."""
        endpoints = [
            f"/api/v1/assignments/{id}",
            f"/api/v1/users/{id}",
            f"/api/v1/tasks/{id}"
        ]
        
        for endpoint in endpoints:
            response = client.get(
                endpoint,
                headers=auth_headers
            )
            assert response.status_code == 404
    
    @given(st.text())
    def test_malformed_json(self, client, auth_headers, invalid_json: str):
        """Test handling of malformed JSON data."""
        headers = {**auth_headers, "Content-Type": "application/json"}
        response = client.post(
            "/api/v1/assignments",
            headers=headers,
            content=invalid_json
        )
        assert response.status_code in [400, 422]  # Bad request or validation error 