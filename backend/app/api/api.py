from fastapi import APIRouter
from app.api.endpoints import (
    auth,
    users,
    assignments,
    submissions,
    feedback,
    completion,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(completion.router, prefix="/completion", tags=["completion"]) 