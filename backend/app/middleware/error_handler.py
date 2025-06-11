from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.logging_service import logging_service

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logging_service.error(
                f"Error in {request.method} {request.url.path}",
                extra={
                    "error": str(e),
                    "method": request.method,
                    "path": request.url.path,
                    "client": request.client.host if request.client else "unknown"
                }
            )
            raise 