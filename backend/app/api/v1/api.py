from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    assignments,
    submissions,
    ai,
    admin,
    logs,
    files,
    feedback,
    ai_assignment
)

api_router = APIRouter()

# Include routers with tags for better organization
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
api_router.include_router(logs.router, prefix="/logs", tags=["Logs"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
api_router.include_router(ai_assignment.router, prefix="/ai-assignments", tags=["AI Assignments"]) 