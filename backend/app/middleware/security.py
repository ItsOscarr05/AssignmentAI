from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable
import re
from app.core.config import settings

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https:;"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # Note: These headers can interfere with CORS, so we'll be more permissive
        # Cross-Origin-Embedder-Policy and Cross-Origin-Resource-Policy are commented out
        # to allow CORS requests from the frontend
        # response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        # response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        
        # Sanitize response headers - create a list of invalid headers first
        invalid_headers = []
        for header in response.headers:
            if not re.match(r'^[a-zA-Z0-9\-_]+$', header):
                invalid_headers.append(header)
        
        # Remove invalid headers
        for header in invalid_headers:
            del response.headers[header]
        
        # Prevent caching of sensitive endpoints
        sensitive_paths = ["/auth", "/admin", "/api/v1/auth", "/api/v1/admin"]
        if any(request.url.path.startswith(path) for path in sensitive_paths):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers to response
        for header, value in settings.SECURITY_HEADERS.items():
            response.headers[header] = value
            
        return response 