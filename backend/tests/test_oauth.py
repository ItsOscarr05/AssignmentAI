import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.main import app
from app.core.oauth import oauth_config
from app.models.user import User
from app.core.config import settings

client = TestClient(app)

@pytest.fixture
def mock_oauth_session():
    with patch('requests_oauthlib.OAuth2Session') as mock:
        yield mock

@pytest.fixture
def mock_user_info():
    return {
        "email": "test@example.com",
        "name": "Test User",
        "id": "12345",
        "picture": "https://example.com/avatar.jpg"
    }

@pytest.fixture
def mock_token():
    return {
        "access_token": "mock_access_token",
        "refresh_token": "mock_refresh_token",
        "expires_in": 3600,
        "token_type": "Bearer"
    }

def test_oauth_authorize_google(mock_oauth_session):
    """Test Google OAuth authorization URL generation"""
    mock_session = MagicMock()
    mock_session.create_authorization_url.return_value = (
        "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=test",
        "test_state"
    )
    mock_oauth_session.return_value = mock_session

    response = client.get("/auth/oauth/google/authorize")
    assert response.status_code == 200
    assert "authorization_url" in response.json()
    assert "state" in response.json()

def test_oauth_authorize_github(mock_oauth_session):
    """Test GitHub OAuth authorization URL generation"""
    mock_session = MagicMock()
    mock_session.create_authorization_url.return_value = (
        "https://github.com/login/oauth/authorize?response_type=code&client_id=test",
        "test_state"
    )
    mock_oauth_session.return_value = mock_session

    response = client.get("/auth/oauth/github/authorize")
    assert response.status_code == 200
    assert "authorization_url" in response.json()
    assert "state" in response.json()

def test_oauth_callback_success(mock_oauth_session, mock_user_info, mock_token):
    """Test successful OAuth callback flow"""
    # Mock OAuth session
    mock_session = MagicMock()
    mock_session.fetch_token.return_value = mock_token
    mock_session.get.return_value.json.return_value = mock_user_info
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state"}
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()
    assert "token_type" in response.json()
    assert "expires_in" in response.json()

def test_oauth_callback_invalid_state(mock_oauth_session):
    """Test OAuth callback with invalid state"""
    response = client.post(
        "/auth/oauth/google/callback",
        json={"code": "test_code", "state": "invalid_state"}
    )
    assert response.status_code == 400

def test_oauth_callback_token_error(mock_oauth_session):
    """Test OAuth callback with token fetch error"""
    mock_session = MagicMock()
    mock_session.fetch_token.side_effect = Exception("Token fetch failed")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state"}
    )
    assert response.status_code == 400

def test_oauth_callback_user_info_error(mock_oauth_session, mock_token):
    """Test OAuth callback with user info fetch error"""
    mock_session = MagicMock()
    mock_session.fetch_token.return_value = mock_token
    mock_session.get.side_effect = Exception("User info fetch failed")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state"}
    )
    assert response.status_code == 400

def test_oauth_token_refresh(mock_oauth_session, mock_token):
    """Test OAuth token refresh flow"""
    # Mock OAuth session
    mock_session = MagicMock()
    mock_session.refresh_token.return_value = mock_token
    mock_oauth_session.return_value = mock_session

    # Create a test user with OAuth tokens
    user = User(
        email="test@example.com",
        oauth_provider="google",
        oauth_access_token="old_access_token",
        oauth_refresh_token="old_refresh_token",
        oauth_token_expires_at=datetime.utcnow() - timedelta(hours=1)
    )

    # Test token refresh
    response = client.post(
        "/auth/oauth/google/refresh",
        json={"refresh_token": "old_refresh_token"}
    )

    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()
    assert "expires_in" in response.json()

def test_oauth_token_refresh_expired(mock_oauth_session):
    """Test OAuth token refresh with expired refresh token"""
    mock_session = MagicMock()
    mock_session.refresh_token.side_effect = Exception("Token expired")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/auth/oauth/google/refresh",
        json={"refresh_token": "expired_token"}
    )
    assert response.status_code == 401

def test_oauth_provider_config():
    """Test OAuth provider configuration"""
    # Test Google config
    google_config = oauth_config.get_provider_config("google")
    assert "client_id" in google_config
    assert "client_secret" in google_config
    assert "authorize_url" in google_config
    assert "token_url" in google_config
    assert "userinfo_url" in google_config
    assert "scope" in google_config

    # Test GitHub config
    github_config = oauth_config.get_provider_config("github")
    assert "client_id" in github_config
    assert "client_secret" in github_config
    assert "authorize_url" in github_config
    assert "token_url" in github_config
    assert "userinfo_url" in github_config
    assert "scope" in github_config

    # Test invalid provider
    with pytest.raises(Exception):
        oauth_config.get_provider_config("invalid_provider")

def test_oauth_user_info_normalization(mock_oauth_session, mock_token):
    """Test OAuth user info normalization across providers"""
    # Test Google user info
    google_user_info = {
        "email": "test@example.com",
        "name": "Test User",
        "picture": "https://example.com/avatar.jpg"
    }
    mock_session = MagicMock()
    mock_session.fetch_token.return_value = mock_token
    mock_session.get.return_value.json.return_value = google_user_info
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state"}
    )
    assert response.status_code == 200

    # Test GitHub user info
    github_user_info = {
        "email": "test@example.com",
        "name": "Test User",
        "login": "testuser",
        "avatar_url": "https://example.com/avatar.jpg"
    }
    mock_session.get.return_value.json.return_value = github_user_info

    response = client.post(
        "/auth/oauth/github/callback",
        json={"code": "test_code", "state": "test_state"}
    )
    assert response.status_code == 200

def test_oauth_error_handling(mock_oauth_session):
    """Test OAuth error handling"""
    # Test network error
    mock_session = MagicMock()
    mock_session.fetch_token.side_effect = Exception("Network error")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state"}
    )
    assert response.status_code == 400
    assert "error" in response.json()

    # Test invalid code
    mock_session.fetch_token.side_effect = Exception("Invalid code")
    response = client.post(
        "/auth/oauth/google/callback",
        json={"code": "invalid_code", "state": "test_state"}
    )
    assert response.status_code == 400
    assert "error" in response.json()

    # Test missing required fields
    response = client.post(
        "/auth/oauth/google/callback",
        json={"state": "test_state"}
    )
    assert response.status_code == 422 