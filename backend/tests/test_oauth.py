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
    with patch('authlib.integrations.requests_client.OAuth2Session') as mock:
        yield mock

@pytest.fixture
def mock_redis():
    with patch('app.api.v1.endpoints.oauth.redis_client') as mock:
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

def test_oauth_authorize_google(mock_oauth_session, mock_redis):
    """Test Google OAuth authorization URL generation"""
    # Mock Redis operations
    mock_redis.setex.return_value = True
    
    mock_session = MagicMock()
    mock_session.create_authorization_url.return_value = (
        "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=test",
        "test_state"
    )
    mock_oauth_session.return_value = mock_session

    response = client.get("/api/v1/auth/oauth/google/authorize")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "state" in data

def test_oauth_authorize_github(mock_oauth_session, mock_redis):
    """Test GitHub OAuth authorization URL generation"""
    # Mock Redis operations
    mock_redis.setex.return_value = True
    
    mock_session = MagicMock()
    mock_session.create_authorization_url.return_value = (
        "https://github.com/login/oauth/authorize?response_type=code&client_id=test",
        "test_state"
    )
    mock_oauth_session.return_value = mock_session

    response = client.get("/api/v1/auth/oauth/github/authorize")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "state" in data

def test_oauth_callback_success(mock_oauth_session, mock_redis, mock_user_info, mock_token):
    """Test successful OAuth callback flow"""
    # Mock Redis operations
    mock_redis.get.return_value = "google"
    mock_redis.delete.return_value = True
    
    # Mock OAuth session
    mock_session = MagicMock()
    mock_session.fetch_token.return_value = mock_token
    
    # Create a proper mock response object
    mock_response = MagicMock()
    mock_response.json.return_value = mock_user_info
    mock_session.get.return_value = mock_response
    
    mock_oauth_session.return_value = mock_session

    # Mock database operations
    with patch('app.api.v1.endpoints.oauth.get_db') as mock_get_db:
        mock_db = MagicMock()
        # Mock that no user exists initially
        mock_db.query.return_value.filter.return_value.first.return_value = None
        # Mock the add and commit operations
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/v1/auth/oauth/google/callback",
            json={"code": "test_code", "state": "test_state_1"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert "expires_in" in data

def test_oauth_callback_invalid_state(mock_oauth_session, mock_redis):
    """Test OAuth callback with invalid state"""
    # Mock Redis to return None (invalid state)
    mock_redis.get.return_value = None
    
    response = client.post(
        "/api/v1/auth/oauth/google/callback",
        json={"code": "test_code", "state": "invalid_state"}
    )
    assert response.status_code == 400

def test_oauth_callback_token_error(mock_oauth_session, mock_redis):
    """Test OAuth callback with token fetch error"""
    # Mock Redis operations
    mock_redis.get.return_value = "google"
    mock_redis.delete.return_value = True
    
    mock_session = MagicMock()
    mock_session.fetch_token.side_effect = Exception("Token fetch failed")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/api/v1/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state_2"}
    )
    assert response.status_code == 200
    assert "error" in response.json()

def test_oauth_callback_user_info_error(mock_oauth_session, mock_redis, mock_token):
    """Test OAuth callback with user info fetch error"""
    # Mock Redis operations
    mock_redis.get.return_value = "google"
    mock_redis.delete.return_value = True
    
    mock_session = MagicMock()
    mock_session.fetch_token.return_value = mock_token
    mock_session.get.side_effect = Exception("User info fetch failed")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/api/v1/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state_3"}
    )
    assert response.status_code == 200
    assert "error" in response.json()



def test_oauth_token_refresh_expired(mock_oauth_session, mock_redis):
    """Test OAuth token refresh with expired token"""
    # Mock Redis operations
    mock_redis.get.return_value = "google"
    mock_redis.delete.return_value = True
    
    mock_session = MagicMock()
    mock_session.refresh_token.side_effect = Exception("Token expired")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/api/v1/auth/oauth/google/refresh",
        json={"refresh_token": "expired_refresh_token"}
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

def test_oauth_user_info_normalization(mock_oauth_session, mock_redis, mock_token, mock_user_info):
    """Test OAuth user info normalization"""
    # Mock Redis operations
    mock_redis.get.return_value = "google"
    mock_redis.delete.return_value = True
    
    mock_session = MagicMock()
    mock_session.fetch_token.return_value = mock_token
    
    # Create a proper mock response object
    mock_response = MagicMock()
    mock_response.json.return_value = mock_user_info
    mock_session.get.return_value = mock_response
    
    mock_oauth_session.return_value = mock_session

    # Mock database operations
    with patch('app.api.v1.endpoints.oauth.get_db') as mock_get_db:
        mock_db = MagicMock()
        # Mock that no user exists initially
        mock_db.query.return_value.filter.return_value.first.return_value = None
        # Mock the add and commit operations
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        mock_get_db.return_value = mock_db

        response = client.post(
            "/api/v1/auth/oauth/google/callback",
            json={"code": "test_code", "state": "test_state_5"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "email" in data["user"]
        assert "name" in data["user"]

def test_oauth_error_handling(mock_oauth_session, mock_redis):
    """Test OAuth error handling"""
    # Mock Redis operations
    mock_redis.get.return_value = "google"
    mock_redis.delete.return_value = True
    
    # Test network error
    mock_session = MagicMock()
    mock_session.fetch_token.side_effect = Exception("Network error")
    mock_oauth_session.return_value = mock_session

    response = client.post(
        "/api/v1/auth/oauth/google/callback",
        json={"code": "test_code", "state": "test_state_7"}
    )
    assert response.status_code == 200
    assert "error" in response.json()

    # Test invalid code
    mock_session.fetch_token.side_effect = Exception("Invalid code")
    response = client.post(
        "/api/v1/auth/oauth/google/callback",
        json={"code": "invalid_code", "state": "test_state_8"}
    )
    assert response.status_code == 200
    assert "error" in response.json()

    # Test missing required fields
    response = client.post(
        "/api/v1/auth/oauth/google/callback",
        json={"state": "test_state"}
    )
    assert response.status_code == 422 