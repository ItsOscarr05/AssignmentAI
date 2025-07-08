import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import HTTPException
from app.core.oauth import OAuthConfig, oauth_config
from authlib.integrations.base_client import OAuthError

@pytest.fixture
def oauth_config_instance():
    return OAuthConfig()

def test_get_provider_config_valid_providers(oauth_config_instance):
    """Test getting valid provider configurations"""
    # Test all supported providers
    providers = ["google", "github", "facebook", "apple"]
    for provider in providers:
        config = oauth_config_instance.get_provider_config(provider)
        assert "client_id" in config
        assert "client_secret" in config
        assert "authorize_url" in config
        assert "token_url" in config
        assert "userinfo_url" in config
        assert "scope" in config
        assert "redirect_uri" in config

def test_get_provider_config_unsupported_provider(oauth_config_instance):
    """Test getting unsupported provider configuration"""
    with pytest.raises(HTTPException) as exc_info:
        oauth_config_instance.get_provider_config("unsupported")
    assert exc_info.value.status_code == 400
    assert "Unsupported OAuth provider: unsupported" in str(exc_info.value.detail)

def test_get_user_info_google(oauth_config_instance):
    """Test getting user info from Google"""
    mock_user_info = {
        "email": "test@example.com",
        "name": "Test User",
        "picture": "https://example.com/avatar.jpg"
    }
    
    with patch('app.core.oauth.OAuth2Session') as mock_session_class:
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.json.return_value = mock_user_info
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        result = oauth_config_instance.get_user_info("google", "test_token")
        
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"
        assert result["picture"] == "https://example.com/avatar.jpg"

def test_get_user_info_github(oauth_config_instance):
    """Test getting user info from GitHub"""
    mock_user_info = {
        "email": "test@example.com",
        "name": "Test User",
        "login": "testuser",
        "avatar_url": "https://example.com/avatar.jpg"
    }
    
    with patch('app.core.oauth.OAuth2Session') as mock_session_class:
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.json.return_value = mock_user_info
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        result = oauth_config_instance.get_user_info("github", "test_token")
        
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"  # Should use name over login
        assert result["picture"] == "https://example.com/avatar.jpg"

def test_get_user_info_github_no_name(oauth_config_instance):
    """Test getting user info from GitHub when name is not available"""
    mock_user_info = {
        "email": "test@example.com",
        "login": "testuser",
        "avatar_url": "https://example.com/avatar.jpg"
    }
    
    with patch('app.core.oauth.OAuth2Session') as mock_session_class:
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.json.return_value = mock_user_info
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        result = oauth_config_instance.get_user_info("github", "test_token")
        
        assert result["email"] == "test@example.com"
        assert result["name"] == "testuser"  # Should use login when name is not available
        assert result["picture"] == "https://example.com/avatar.jpg"

def test_get_user_info_facebook(oauth_config_instance):
    """Test getting user info from Facebook"""
    mock_user_info = {
        "email": "test@example.com",
        "name": "Test User",
        "picture": {
            "data": {
                "url": "https://example.com/avatar.jpg"
            }
        }
    }
    
    with patch('app.core.oauth.OAuth2Session') as mock_session_class:
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.json.return_value = mock_user_info
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        result = oauth_config_instance.get_user_info("facebook", "test_token")
        
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"
        assert result["picture"] == "https://example.com/avatar.jpg"

def test_get_user_info_apple(oauth_config_instance):
    """Test getting user info from Apple"""
    mock_user_info = {
        "email": "test@example.com",
        "name": {
            "firstName": "Test"
        }
    }
    
    with patch('app.core.oauth.OAuth2Session') as mock_session_class:
        mock_session = MagicMock()
        mock_response = MagicMock()
        mock_response.json.return_value = mock_user_info
        mock_session.get.return_value = mock_response
        mock_session_class.return_value = mock_session
        
        result = oauth_config_instance.get_user_info("apple", "test_token")
        
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test"
        assert result["picture"] is None  # Apple doesn't provide profile pictures

def test_get_user_info_oauth_error(oauth_config_instance):
    """Test getting user info when OAuth error occurs"""
    with patch('app.core.oauth.OAuth2Session') as mock_session_class:
        mock_session = MagicMock()
        mock_session.get.side_effect = OAuthError("OAuth error")
        mock_session_class.return_value = mock_session
        
        with pytest.raises(HTTPException) as exc_info:
            oauth_config_instance.get_user_info("google", "test_token")
        
        assert exc_info.value.status_code == 400
        assert "Failed to get user info from google" in str(exc_info.value.detail)

def test_get_user_info_unsupported_provider(oauth_config_instance):
    """Test getting user info with unsupported provider"""
    with pytest.raises(HTTPException) as exc_info:
        oauth_config_instance.get_user_info("unsupported", "test_token")
    
    assert exc_info.value.status_code == 400
    assert "Unsupported OAuth provider: unsupported" in str(exc_info.value.detail)

def test_oauth_config_global_instance():
    """Test the global oauth_config instance"""
    assert isinstance(oauth_config, OAuthConfig)
    assert "google" in oauth_config.providers
    assert "github" in oauth_config.providers
    assert "facebook" in oauth_config.providers
    assert "apple" in oauth_config.providers 