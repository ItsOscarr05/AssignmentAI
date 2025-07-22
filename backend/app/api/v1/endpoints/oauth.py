from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from typing import Optional
from pydantic import BaseModel

from app.core.oauth import oauth_config
from app.core.security import create_access_token
from app.database import get_db
from app.models.user import User
from app.core.config import settings

router = APIRouter()

# Store OAuth states temporarily (in production, use Redis or database)
oauth_states = {}

class OAuthCallbackRequest(BaseModel):
    code: str
    state: str

class OAuthRefreshRequest(BaseModel):
    refresh_token: str

@router.get("/google/authorize")
async def google_authorize():
    """Generate Google OAuth authorization URL"""
    try:
        # Generate a secure state parameter
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "provider": "google",
            "created_at": datetime.utcnow()
        }
        
        # Get Google OAuth configuration
        config = oauth_config.get_provider_config("google")
        
        # Create authorization URL
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            scope=config["scope"],
            redirect_uri=config["redirect_uri"]
        )
        
        authorization_url, _ = client.create_authorization_url(
            config["authorize_url"],
            state=state
        )
        
        return {
            "url": authorization_url,
            "state": state
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate authorization URL: {str(e)}")

@router.get("/github/authorize")
async def github_authorize():
    """Generate GitHub OAuth authorization URL"""
    try:
        # Generate a secure state parameter
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "provider": "github",
            "created_at": datetime.utcnow()
        }
        
        # Get GitHub OAuth configuration
        config = oauth_config.get_provider_config("github")
        
        # Create authorization URL
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            scope=config["scope"],
            redirect_uri=config["redirect_uri"]
        )
        
        authorization_url, _ = client.create_authorization_url(
            config["authorize_url"],
            state=state
        )
        
        return {
            "url": authorization_url,
            "state": state
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate authorization URL: {str(e)}")

@router.post("/google/callback")
async def google_callback(
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    try:
        # Validate state parameter
        if request.state not in oauth_states or oauth_states[request.state]["provider"] != "google":
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Clean up state
        del oauth_states[request.state]
        
        # Get Google OAuth configuration
        config = oauth_config.get_provider_config("google")
        
        # Exchange code for tokens
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            redirect_uri=config["redirect_uri"]
        )
        
        token = client.fetch_token(
            config["token_url"],
            authorization_response=f"?code={request.code}&state={request.state}"
        )
        
        # Get user info
        user_info = client.get(config["userinfo_url"]).json()
        
        # Find or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if not user:
            # Create new user
            user = User(
                email=user_info["email"],
                name=user_info.get("name", ""),
                hashed_password="oauth_user_no_password",  # Dummy password for OAuth users
                oauth_provider="google",
                oauth_access_token=token["access_token"],
                oauth_refresh_token=token.get("refresh_token"),
                oauth_token_expires_at=datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600)),
                is_verified=True,  # OAuth users are pre-verified
                updated_at=datetime.utcnow()
            )
            db.add(user)
        else:
            # Update existing user's OAuth info
            user.oauth_provider = "google"
            user.oauth_access_token = token["access_token"]
            user.oauth_refresh_token = token.get("refresh_token")
            user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600))
            user.is_verified = True
            user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        # Create access token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": token.get("refresh_token"),
            "token_type": "bearer",
            "expires_in": token.get("expires_in", 3600),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "error": f"OAuth callback failed: {str(e)}"
        }

@router.post("/github/callback")
async def github_callback(
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback"""
    try:
        # Validate state parameter
        if request.state not in oauth_states or oauth_states[request.state]["provider"] != "github":
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Clean up state
        del oauth_states[request.state]
        
        # Get GitHub OAuth configuration
        config = oauth_config.get_provider_config("github")
        
        # Exchange code for tokens
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            redirect_uri=config["redirect_uri"]
        )
        
        token = client.fetch_token(
            config["token_url"],
            authorization_response=f"?code={request.code}&state={request.state}"
        )
        
        # Get user info
        user_info = client.get(config["userinfo_url"]).json()
        
        # Find or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if not user:
            # Create new user
            user = User(
                email=user_info["email"],
                name=user_info.get("name", ""),
                hashed_password="oauth_user_no_password",  # Dummy password for OAuth users
                oauth_provider="github",
                oauth_access_token=token["access_token"],
                oauth_refresh_token=token.get("refresh_token"),
                oauth_token_expires_at=datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600)),
                is_verified=True,  # OAuth users are pre-verified
                updated_at=datetime.utcnow()
            )
            db.add(user)
        else:
            # Update existing user's OAuth info
            user.oauth_provider = "github"
            user.oauth_access_token = token["access_token"]
            user.oauth_refresh_token = token.get("refresh_token")
            user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600))
            user.is_verified = True
            user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        # Create access token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": token.get("refresh_token"),
            "token_type": "bearer",
            "expires_in": token.get("expires_in", 3600),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "error": f"OAuth callback failed: {str(e)}"
        }

@router.post("/facebook/callback")
async def facebook_callback(
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db)
):
    """Handle Facebook OAuth callback"""
    try:
        # Validate state parameter
        if request.state not in oauth_states or oauth_states[request.state]["provider"] != "facebook":
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Clean up state
        del oauth_states[request.state]
        
        # Get Facebook OAuth configuration
        config = oauth_config.get_provider_config("facebook")
        
        # Exchange code for tokens
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            redirect_uri=config["redirect_uri"]
        )
        
        token = client.fetch_token(
            config["token_url"],
            authorization_response=f"?code={request.code}&state={request.state}"
        )
        
        # Get user info
        user_info = client.get(config["userinfo_url"]).json()
        
        # Find or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if not user:
            # Create new user
            user = User(
                email=user_info["email"],
                name=user_info.get("name", ""),
                hashed_password="oauth_user_no_password",  # Dummy password for OAuth users
                oauth_provider="facebook",
                oauth_access_token=token["access_token"],
                oauth_refresh_token=token.get("refresh_token"),
                oauth_token_expires_at=datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600)),
                is_verified=True,  # OAuth users are pre-verified
                updated_at=datetime.utcnow()
            )
            db.add(user)
        else:
            # Update existing user's OAuth info
            user.oauth_provider = "facebook"
            user.oauth_access_token = token["access_token"]
            user.oauth_refresh_token = token.get("refresh_token")
            user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600))
            user.is_verified = True
            user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        # Create access token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": token.get("refresh_token"),
            "token_type": "bearer",
            "expires_in": token.get("expires_in", 3600),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "error": f"OAuth callback failed: {str(e)}"
        }

@router.post("/apple/callback")
async def apple_callback(
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db)
):
    """Handle Apple OAuth callback"""
    try:
        # Validate state parameter
        if request.state not in oauth_states or oauth_states[request.state]["provider"] != "apple":
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Clean up state
        del oauth_states[request.state]
        
        # Get Apple OAuth configuration
        config = oauth_config.get_provider_config("apple")
        
        # Exchange code for tokens
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"],
            redirect_uri=config["redirect_uri"]
        )
        
        token = client.fetch_token(
            config["token_url"],
            authorization_response=f"?code={request.code}&state={request.state}"
        )
        
        # Get user info
        user_info = client.get(config["userinfo_url"]).json()
        
        # Find or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if not user:
            # Create new user
            user = User(
                email=user_info["email"],
                name=user_info.get("name", ""),
                hashed_password="oauth_user_no_password",  # Dummy password for OAuth users
                oauth_provider="apple",
                oauth_access_token=token["access_token"],
                oauth_refresh_token=token.get("refresh_token"),
                oauth_token_expires_at=datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600)),
                is_verified=True,  # OAuth users are pre-verified
                updated_at=datetime.utcnow()
            )
            db.add(user)
        else:
            # Update existing user's OAuth info
            user.oauth_provider = "apple"
            user.oauth_access_token = token["access_token"]
            user.oauth_refresh_token = token.get("refresh_token")
            user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600))
            user.is_verified = True
            user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(user)
        
        # Create access token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": token.get("refresh_token"),
            "token_type": "bearer",
            "expires_in": token.get("expires_in", 3600),
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "error": f"OAuth callback failed: {str(e)}"
        }

@router.get("/google/callback")
async def google_callback_get(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback via GET (for browser redirects)"""
    try:
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state in callback")
        
        # Call the POST callback logic
        from pydantic import BaseModel
        class DummyCallbackRequest(BaseModel):
            code: str
            state: str
        dummy_request = DummyCallbackRequest(code=code, state=state)
        result = await google_callback(dummy_request, db)
        
        # Redirect to frontend with the result
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?provider=google&code={code}&state={state}"
        return RedirectResponse(url=frontend_url)
    except HTTPException:
        raise
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?error=oauth_failed&provider=google"
        return RedirectResponse(url=frontend_url)

@router.get("/github/callback")
async def github_callback_get(request: Request, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback via GET (for browser redirects)"""
    try:
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state in callback")
        
        # Call the POST callback logic
        from pydantic import BaseModel
        class DummyCallbackRequest(BaseModel):
            code: str
            state: str
        dummy_request = DummyCallbackRequest(code=code, state=state)
        result = await github_callback(dummy_request, db)
        
        # Redirect to frontend with the result
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?provider=github&code={code}&state={state}"
        return RedirectResponse(url=frontend_url)
    except HTTPException:
        raise
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?error=oauth_failed&provider=github"
        return RedirectResponse(url=frontend_url)

@router.get("/facebook/callback")
async def facebook_callback_get(request: Request, db: Session = Depends(get_db)):
    """Handle Facebook OAuth callback via GET (for browser redirects)"""
    try:
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state in callback")
        
        # Call the POST callback logic
        from pydantic import BaseModel
        class DummyCallbackRequest(BaseModel):
            code: str
            state: str
        dummy_request = DummyCallbackRequest(code=code, state=state)
        result = await facebook_callback(dummy_request, db)
        
        # Redirect to frontend with the result
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?provider=facebook&code={code}&state={state}"
        return RedirectResponse(url=frontend_url)
    except HTTPException:
        raise
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?error=oauth_failed&provider=facebook"
        return RedirectResponse(url=frontend_url)

@router.get("/apple/callback")
async def apple_callback_get(request: Request, db: Session = Depends(get_db)):
    """Handle Apple OAuth callback via GET (for browser redirects)"""
    try:
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state in callback")
        
        # Call the POST callback logic
        from pydantic import BaseModel
        class DummyCallbackRequest(BaseModel):
            code: str
            state: str
        dummy_request = DummyCallbackRequest(code=code, state=state)
        result = await apple_callback(dummy_request, db)
        
        # Redirect to frontend with the result
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?provider=apple&code={code}&state={state}"
        return RedirectResponse(url=frontend_url)
    except HTTPException:
        raise
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?error=oauth_failed&provider=apple"
        return RedirectResponse(url=frontend_url)

@router.post("/google/refresh")
async def google_refresh(
    request: OAuthRefreshRequest,
    db: Session = Depends(get_db)
):
    """Refresh Google OAuth token"""
    try:
        # Find user with this refresh token
        user = db.query(User).filter(
            User.oauth_provider == "google",
            User.oauth_refresh_token == request.refresh_token
        ).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Get Google OAuth configuration
        config = oauth_config.get_provider_config("google")
        
        # Refresh token
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"]
        )
        
        token = client.refresh_token(
            config["token_url"],
            refresh_token=request.refresh_token
        )
        
        # Update user's token info
        user.oauth_access_token = token["access_token"]
        user.oauth_refresh_token = token.get("refresh_token", request.refresh_token)
        user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600))
        
        db.commit()
        
        # Create new access token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": token.get("refresh_token", request.refresh_token),
            "expires_in": token.get("expires_in", 3600)
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(e)}")

@router.post("/github/refresh")
async def github_refresh(
    request: OAuthRefreshRequest,
    db: Session = Depends(get_db)
):
    """Refresh GitHub OAuth token"""
    try:
        # Find user with this refresh token
        user = db.query(User).filter(
            User.oauth_provider == "github",
            User.oauth_refresh_token == request.refresh_token
        ).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Get GitHub OAuth configuration
        config = oauth_config.get_provider_config("github")
        
        # Refresh token
        from authlib.integrations.requests_client import OAuth2Session
        client = OAuth2Session(
            client_id=config["client_id"],
            client_secret=config["client_secret"]
        )
        
        token = client.refresh_token(
            config["token_url"],
            refresh_token=request.refresh_token
        )
        
        # Update user's token info
        user.oauth_access_token = token["access_token"]
        user.oauth_refresh_token = token.get("refresh_token", request.refresh_token)
        user.oauth_token_expires_at = datetime.utcnow() + timedelta(seconds=token.get("expires_in", 3600))
        
        db.commit()
        
        # Create new access token
        access_token = create_access_token(subject=user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": token.get("refresh_token", request.refresh_token),
            "expires_in": token.get("expires_in", 3600)
        }
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token refresh failed: {str(e)}") 