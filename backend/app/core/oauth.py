from typing import Any, Dict, Optional
from authlib.integrations.base_client import OAuthError
from authlib.integrations.requests_client import OAuth2Session
from fastapi import HTTPException, status
from app.core.config import settings

class OAuthConfig:
    def __init__(self):
        backend_url = settings.BACKEND_URL.rstrip("/")
        self.providers: Dict[str, Dict[str, Any]] = {
            "google": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
                "scope": "openid email profile",
                "redirect_uri": f"{backend_url}/api/v1/auth/oauth/google/callback",
                "supports_refresh": True,
            },
            "github": {
                "client_id": getattr(settings, "GITHUB_CLIENT_ID", None),
                "client_secret": getattr(settings, "GITHUB_CLIENT_SECRET", None),
                "authorize_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token",
                "userinfo_url": "https://api.github.com/user",
                "scope": "read:user user:email",
                "redirect_uri": f"{backend_url}/api/v1/auth/oauth/github/callback",
                "userinfo_headers": {"Accept": "application/json"},
                "supports_refresh": False,
            },
            "facebook": {
                "client_id": getattr(settings, "FACEBOOK_CLIENT_ID", None),
                "client_secret": getattr(settings, "FACEBOOK_CLIENT_SECRET", None),
                "authorize_url": "https://www.facebook.com/v15.0/dialog/oauth",
                "token_url": "https://graph.facebook.com/v15.0/oauth/access_token",
                "userinfo_url": "https://graph.facebook.com/me?fields=id,name,email,picture",
                "scope": "email public_profile",
                "redirect_uri": f"{backend_url}/api/v1/auth/oauth/facebook/callback",
                "supports_refresh": False,
            },
            "apple": {
                "client_id": getattr(settings, "APPLE_CLIENT_ID", None),
                "client_secret": getattr(settings, "APPLE_CLIENT_SECRET", None),
                "authorize_url": "https://appleid.apple.com/auth/authorize",
                "token_url": "https://appleid.apple.com/auth/token",
                "userinfo_url": "https://appleid.apple.com/auth/token",
                "scope": "name email",
                "redirect_uri": f"{backend_url}/api/v1/auth/oauth/apple/callback",
                "supports_refresh": True,
            },
        }

    def get_provider_config(self, provider: str) -> Dict:
        if provider not in self.providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported OAuth provider: {provider}",
            )
        return self.providers[provider]

    def provider_supports_refresh(self, provider: str) -> bool:
        config = self.get_provider_config(provider)
        return bool(config.get("supports_refresh"))

    def normalize_user_info(self, provider: str, user_info: Dict[str, Any]) -> Dict[str, Optional[str]]:
        normalized_info: Dict[str, Optional[str]] = {
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
        }

        if provider == "google":
            normalized_info["email"] = user_info.get("email")
            normalized_info["name"] = user_info.get("name")
            normalized_info["picture"] = user_info.get("picture")
        elif provider == "github":
            normalized_info["email"] = user_info.get("email")
            normalized_info["name"] = user_info.get("name") or user_info.get("login")
            normalized_info["picture"] = user_info.get("avatar_url")
        elif provider == "facebook":
            normalized_info["email"] = user_info.get("email")
            normalized_info["name"] = user_info.get("name")
            picture = user_info.get("picture") or {}
            if isinstance(picture, dict):
                data = picture.get("data") or {}
                normalized_info["picture"] = data.get("url")
        elif provider == "apple":
            normalized_info["email"] = user_info.get("email")
            name_info = user_info.get("name") or {}
            if isinstance(name_info, dict):
                normalized_info["name"] = name_info.get("firstName") or name_info.get("givenName")
            normalized_info["picture"] = user_info.get("picture")
        return normalized_info

    def get_user_info(self, provider: str, access_token: str) -> Dict[str, Optional[str]]:
        config = self.get_provider_config(provider)
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            scope=config["scope"],
        )
        client.token = {"access_token": access_token, "token_type": "Bearer"}

        try:
            headers = config.get("userinfo_headers")
            resp = client.get(config["userinfo_url"], headers=headers)
            user_info = resp.json()
            return self.normalize_user_info(provider, user_info)

        except OAuthError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get user info from {provider}: {str(e)}",
            )

oauth_config = OAuthConfig() 