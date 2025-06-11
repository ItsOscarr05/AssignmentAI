from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.auth import get_current_user_optional
from app.crud import activity as activity_crud
from app.schemas.activity import ActivityCreate
from app.db.session import SessionLocal
import json

class ActivityTrackerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip tracking for certain paths
        if request.url.path in [
            "/api/v1/health",
            "/api/v1/activities",
            "/api/v1/activities/stats",
            "/api/v1/activities/cleanup",
        ]:
            return await call_next(request)

        # Get current user if authenticated
        user = await get_current_user_optional(request)
        if not user:
            return await call_next(request)

        # Get request details
        action = self._get_action(request)
        resource_type = self._get_resource_type(request)
        resource_id = self._get_resource_id(request)
        metadata = self._get_metadata(request)

        # Create activity record
        activity = ActivityCreate(
            user_id=user.id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )

        # Save activity in background
        db = SessionLocal()
        try:
            activity_crud.create_activity(db, activity)
        finally:
            db.close()

        # Process the request
        response = await call_next(request)
        return response

    def _get_action(self, request: Request) -> str:
        """Determine the action based on the HTTP method and path"""
        method = request.method.lower()
        path = request.url.path

        # Map common actions
        if method == "get":
            return "view"
        elif method == "post":
            return "create"
        elif method == "put":
            return "update"
        elif method == "delete":
            return "delete"
        else:
            return method

    def _get_resource_type(self, request: Request) -> str:
        """Determine the resource type from the URL path"""
        path = request.url.path
        parts = path.strip("/").split("/")
        
        # Skip API version and common prefixes
        if len(parts) > 2:
            return parts[2]  # e.g., /api/v1/users -> users
        return None

    def _get_resource_id(self, request: Request) -> str:
        """Extract resource ID from the URL path"""
        path = request.url.path
        parts = path.strip("/").split("/")
        
        # Check if the last part is a UUID or numeric ID
        if len(parts) > 3:
            last_part = parts[-1]
            if last_part.isdigit() or len(last_part) == 36:  # UUID length
                return last_part
        return None

    def _get_metadata(self, request: Request) -> dict:
        """Extract relevant metadata from the request"""
        metadata = {
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
        }

        # Add request body for non-GET requests
        if request.method != "GET":
            try:
                body = await request.json()
                # Remove sensitive data
                if "password" in body:
                    body["password"] = "***"
                metadata["body"] = body
            except:
                pass

        return metadata 