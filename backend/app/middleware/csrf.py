from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable
import secrets
from app.core.config import settings

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip CSRF check for GET requests and certain endpoints
        if request.method == "GET" or request.url.path in ["/api/v1/auth/login", "/api/v1/auth/register"]:
            response = await call_next(request)
            # Generate and set CSRF token for GET requests
            if request.method == "GET":
                csrf_token = secrets.token_urlsafe(32)
                response.set_cookie(
                    "csrf_token",
                    csrf_token,
                    httponly=True,
                    secure=settings.SSL_ENABLED,
                    samesite="strict"
                )
            return response

        # Check CSRF token for other requests
        csrf_token = request.cookies.get("csrf_token")
        header_token = request.headers.get("X-CSRF-Token")

        if not csrf_token or not header_token or csrf_token != header_token:
            raise HTTPException(
                status_code=403,
                detail="Invalid CSRF token"
            )

        response = await call_next(request)
        return response 