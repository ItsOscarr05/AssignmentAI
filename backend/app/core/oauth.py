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
            "github": {
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "authorize_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token",
                "userinfo_url": "https://api.github.com/user",
                "scope": "user:email",
                "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/oauth/github/callback",
            },
            "facebook": {
                "client_id": settings.FACEBOOK_CLIENT_ID,
                "client_secret": settings.FACEBOOK_CLIENT_SECRET,
                "authorize_url": "https://www.facebook.com/v12.0/dialog/oauth",
                "token_url": "https://graph.facebook.com/v12.0/oauth/access_token",
                "userinfo_url": "https://graph.facebook.com/v12.0/me",
                "scope": "email public_profile",
                "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/oauth/facebook/callback",
            },
            "apple": {
                "client_id": settings.APPLE_CLIENT_ID,
                "client_secret": settings.APPLE_CLIENT_SECRET,
                "authorize_url": "https://appleid.apple.com/auth/authorize",
                "token_url": "https://appleid.apple.com/auth/token",
                "userinfo_url": "https://appleid.apple.com/auth/userinfo",
                "scope": "email name",
                "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/oauth/apple/callback",
            },
        }

    def get_provider_config(self, provider: str) -> Dict:
        if provider not in self.providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported OAuth provider: {provider}",
            )
        return self.providers[provider]

    async def get_user_info(self, provider: str, access_token: str) -> Dict:
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
                resp = await client.get(
                    config["userinfo_url"],
                    headers={"Accept": "application/json"},
                )
            else:
                resp = await client.get(config["userinfo_url"])
            
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
            elif provider == "github":
                normalized_info.update({
                    "email": user_info.get("email"),
                    "name": user_info.get("name") or user_info.get("login"),
                    "picture": user_info.get("avatar_url"),
                })
            elif provider == "facebook":
                normalized_info.update({
                    "email": user_info.get("email"),
                    "name": user_info.get("name"),
                    "picture": user_info.get("picture", {}).get("data", {}).get("url"),
                })
            elif provider == "apple":
                normalized_info.update({
                    "email": user_info.get("email"),
                    "name": user_info.get("name", {}).get("firstName"),
                    "picture": None,  # Apple doesn't provide profile pictures
                })

            return normalized_info

        except OAuthError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get user info from {provider}: {str(e)}",
            )

oauth_config = OAuthConfig() 