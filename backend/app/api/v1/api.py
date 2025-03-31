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

api_router = APIRouter(
    title="AssignmentAI API",
    description="""
    AssignmentAI API provides endpoints for managing assignments, submissions, and AI-powered feedback.
    
    ## Features
    * User authentication and authorization
    * Assignment management
    * Submission handling
    * AI-powered assignment generation
    * AI-powered feedback generation
    * File upload and management
    * Rate limiting and caching
    
    ## Authentication
    All endpoints except login and registration require a valid JWT token.
    Include the token in the Authorization header: `Bearer <token>`
    
    ## Rate Limiting
    API requests are rate limited to prevent abuse.
    * Default: 100 requests per minute
    * AI endpoints: 10 requests per minute
    
    ## Caching
    Responses are cached for improved performance.
    * Assignments: 5 minutes
    * User data: 5 minutes
    * AI responses: 1 hour
    """,
    version="1.0.0"
)

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