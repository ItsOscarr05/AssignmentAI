from fastapi import Request, HTTPException, status
from app.core.config import settings

async def file_size_limit_middleware(request: Request, call_next):
    """Middleware to check file upload size limits"""
    if request.method == "POST" and request.url.path.startswith("/api/v1/files/upload"):
        content_length = request.headers.get("content-length")
        if content_length:
            content_length = int(content_length)
            if content_length > settings.MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE} bytes"
                )
    response = await call_next(request)
    return response 