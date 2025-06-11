from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
from app.services.logging_service import logging_service

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        
        logging_service.request(
            request_id=request.state.request_id if hasattr(request.state, "request_id") else "unknown",
            method=request.method,
            path=request.url.path,
            duration=duration,
            status=response.status_code
        )
        
        return response 