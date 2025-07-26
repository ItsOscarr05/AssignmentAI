from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable
import secrets
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, exempt_paths=None):
        super().__init__(app)
        self.exempt_paths = exempt_paths or [
            "/api/v1/auth/login",
            "/api/v1/auth/register", 
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/csrf-token"
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip CSRF check for GET requests and exempt endpoints
        if request.method == "GET" or request.url.path in self.exempt_paths:
            response = await call_next(request)
            # Generate and set CSRF token for GET requests to protected pages
            if request.method == "GET" and not request.url.path.startswith("/api/"):
                csrf_token = secrets.token_urlsafe(32)
                response.set_cookie(
                    "csrf_token",
                    csrf_token,
                    httponly=True,
                    secure=settings.SSL_ENABLED,
                    samesite="strict",
                    max_age=3600  # 1 hour
                )
            return response

        # For login endpoint, validate CSRF token if provided
        if request.url.path == "/api/v1/auth/login":
            csrf_token = request.cookies.get("csrf_token")
            header_token = request.headers.get("X-CSRF-Token")
            
            # If CSRF token is provided, validate it
            if header_token:
                if not csrf_token or csrf_token != header_token:
                    logger.warning(f"Invalid CSRF token for login attempt from {request.client.host}")
                    raise HTTPException(
                        status_code=403,
                        detail="Invalid CSRF token"
                    )
            # If no CSRF token provided, allow but log for monitoring
            else:
                logger.info(f"Login attempt without CSRF token from {request.client.host}")

        # Check CSRF token for other protected requests
        else:
            csrf_token = request.cookies.get("csrf_token")
            header_token = request.headers.get("X-CSRF-Token")

            if not csrf_token or not header_token or csrf_token != header_token:
                logger.warning(f"Missing or invalid CSRF token for {request.url.path} from {request.client.host}")
                raise HTTPException(
                    status_code=403,
                    detail="Invalid CSRF token"
                )

        response = await call_next(request)
        return response 