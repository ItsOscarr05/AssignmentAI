from datetime import datetime, timedelta
import logging
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.oauth import oauth_config
from app.core.redis_client import redis_client
from app.core.security import create_access_token
from app.database import get_db
from app.models.user import User

OAUTH_STATE_TTL = 600  # 10 minutes

router = APIRouter()
logger = logging.getLogger(__name__)


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str


class OAuthRefreshRequest(BaseModel):
    refresh_token: str


def _store_oauth_state(state: str, provider: str) -> bool:
    """Store OAuth state in Redis with error handling."""
    try:
        redis_client.setex(f"oauth_state:{state}", OAUTH_STATE_TTL, provider)
        logger.debug("Stored OAuth state %s for provider %s", state, provider)
        return True
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Failed to store OAuth state: %s", exc)
        return False


def _get_oauth_state(state: str) -> Optional[str]:
    """Retrieve and clear OAuth state from Redis."""
    try:
        provider = redis_client.get(f"oauth_state:{state}")
        if provider:
            redis_client.delete(f"oauth_state:{state}")
            logger.debug("Retrieved OAuth state %s for provider %s", state, provider)
        return provider
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("Failed to retrieve OAuth state: %s", exc)
        return None


@router.get("/{provider}/authorize")
async def authorize(provider: str):
    """Generate an authorization URL for the given provider."""
    provider = provider.lower()
    config = oauth_config.get_provider_config(provider)

    state_seed = secrets.token_urlsafe(32)
    try:
        from authlib.integrations.requests_client import OAuth2Session

        client_kwargs = {
            "client_id": config["client_id"],
            "scope": config["scope"],
        }
        if config.get("redirect_uri"):
            client_kwargs["redirect_uri"] = config["redirect_uri"]

        client = OAuth2Session(**client_kwargs)
        authorization_url, returned_state = client.create_authorization_url(
            config["authorize_url"],
            state=state_seed,
        )
        state = returned_state or state_seed
    except Exception as exc:
        logger.error("Failed to create authorization URL for %s: %s", provider, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate authorization URL: {str(exc)}",
        ) from exc

    if not _store_oauth_state(state, provider):
        raise HTTPException(status_code=500, detail="Failed to store OAuth state")

    return {"url": authorization_url, "state": state}


@router.post("/{provider}/callback")
async def oauth_callback(
    provider: str,
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db),
):
    """Handle OAuth callback for the given provider."""
    provider = provider.lower()
    stored_provider = _get_oauth_state(request.state)
    if not stored_provider:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    if stored_provider != provider:
        raise HTTPException(status_code=400, detail="State does not match provider")

    config = oauth_config.get_provider_config(provider)
    try:
        from authlib.integrations.requests_client import OAuth2Session

        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config.get("client_secret"),
            redirect_uri=config.get("redirect_uri"),
            scope=config.get("scope"),
        )

        try:
            token = client.fetch_token(
                config["token_url"],
                code=request.code,
                grant_type="authorization_code",
                redirect_uri=config.get("redirect_uri"),
            )
        except Exception as exc:
            logger.error("%s token exchange failed: %s", provider, exc)
            return {"error": f"Token exchange failed: {str(exc)}"}

        try:
            headers = config.get("userinfo_headers")
            raw_user_info = client.get(config["userinfo_url"], headers=headers).json()
        except Exception as exc:
            logger.error("%s user info fetch failed: %s", provider, exc)
            return {"error": f"Failed to fetch user info: {str(exc)}"}

        normalized_info = oauth_config.normalize_user_info(provider, raw_user_info)
        email = normalized_info.get("email")
        if not email:
            return {"error": "Email not provided by OAuth provider"}

        user = db.query(User).filter(User.email == email).first()
        expires_in = int(token.get("expires_in", 3600))
        token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)

        if not user:
            user = User(
                email=email,
                name=normalized_info.get("name"),
                avatar=normalized_info.get("picture"),
                hashed_password="oauth_user_no_password",
                oauth_provider=provider,
                oauth_access_token=token.get("access_token"),
                oauth_refresh_token=token.get("refresh_token"),
                oauth_token_expires_at=token_expiry,
                is_active=True,
                is_verified=True,
            )
            db.add(user)
        else:
            user.oauth_provider = provider
            user.oauth_access_token = token.get("access_token")
            if token.get("refresh_token"):
                user.oauth_refresh_token = token["refresh_token"]
            user.oauth_token_expires_at = token_expiry
            user.is_verified = True
            user.updated_at = datetime.utcnow()
            if not user.name and normalized_info.get("name"):
                user.name = normalized_info["name"]
            if normalized_info.get("picture"):
                user.avatar = normalized_info["picture"]

        db.commit()
        db.refresh(user)

        access_token = create_access_token(subject=user.id)
        response = {
            "access_token": access_token,
            "refresh_token": token.get("refresh_token"),
            "token_type": "bearer",
            "expires_in": expires_in,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
            },
        }
        return response

    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.exception("OAuth callback failed for %s", provider)
        return {"error": f"OAuth callback failed: {str(exc)}"}


@router.post("/{provider}/refresh")
async def oauth_refresh(
    provider: str,
    request: OAuthRefreshRequest,
    db: Session = Depends(get_db),
):
    """Refresh an OAuth token for providers that support it."""
    provider = provider.lower()
    if not oauth_config.provider_supports_refresh(provider):
        raise HTTPException(
            status_code=400,
            detail=f"{provider} does not support token refresh",
        )

    user = (
        db.query(User)
        .filter(
            User.oauth_provider == provider,
            User.oauth_refresh_token == request.refresh_token,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    config = oauth_config.get_provider_config(provider)
    try:
        from authlib.integrations.requests_client import OAuth2Session

        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config.get("client_secret"),
        )
        token = client.refresh_token(
            config["token_url"],
            refresh_token=request.refresh_token,
        )
    except Exception as exc:
        logger.error("%s token refresh failed: %s", provider, exc)
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(exc)}") from exc

    expires_in = int(token.get("expires_in", 3600))
    user.oauth_access_token = token.get("access_token")
    user.oauth_refresh_token = token.get("refresh_token", request.refresh_token)
    user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    db.commit()

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": user.oauth_refresh_token,
        "expires_in": expires_in,
    }
