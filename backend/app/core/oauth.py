from typing import Dict, Optional
from authlib.integrations.base_client import OAuthError
from authlib.integrations.requests_client import OAuth2Session
from fastapi import HTTPException, status
from app.core.config import settings

class OAuthConfig:
    def __init__(self):
        self.providers: Dict[str, Dict] = {
            "google": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
                "scope": "openid email profile",
                "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/oauth/google/callback",
            },
        }

    def get_provider_config(self, provider: str) -> Dict:
        if provider not in self.providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported OAuth provider: {provider}",
            )
        return self.providers[provider]

    def get_user_info(self, provider: str, access_token: str) -> Dict:
        config = self.get_provider_config(provider)
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            scope=config["scope"],
        )
        client.token = {"access_token": access_token, "token_type": "Bearer"}

        try:
            if provider == "github":
                # GitHub requires a special header
                resp = client.get(
                    config["userinfo_url"],
                    headers={"Accept": "application/json"},
                )
            else:
                resp = client.get(config["userinfo_url"])
            
            user_info = resp.json()

            # Normalize user info across providers
            normalized_info = {
                "email": None,
                "name": None,
                "picture": None,
            }

            if provider == "google":
                normalized_info.update({
                    "email": user_info.get("email"),
                    "name": user_info.get("name"),
                    "picture": user_info.get("picture"),
                })

            return normalized_info

        except OAuthError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get user info from {provider}: {str(e)}",
            )

oauth_config = OAuthConfig() 