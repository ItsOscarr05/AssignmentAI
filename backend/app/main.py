from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from app.core.config import settings
from app.db.database import engine, Base
from app.api.v1.api import api_router
from app.core.middleware import rate_limit_middleware, logging_middleware
from app.core.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler,
    database_error_handler,
    validation_error_handler
)
from app.services.logging_service import LoggingService, logger
from app.api.deps import get_db
from app.api.middleware import file_size_limit_middleware
from datetime import datetime
from app.middleware.security import SecurityMiddleware
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.performance import PerformanceMiddleware, QueryOptimizationMiddleware
import uvicorn

# Initialize logging
LoggingService.setup_logging()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    🎓 AssignmentAI API - Intelligent Educational Platform

    ## Features

    * 👩‍🏫 Teacher Management
        * Create and manage assignments
        * Track student progress
        * Generate AI-powered assignments

    * 👨‍🎓 Student Experience
        * Submit assignments
        * View grades and feedback
        * Track progress

    * 🔐 Authentication
        * Secure JWT-based authentication
        * Role-based access control
        * Email verification

    * 📊 Administration
        * User management
        * System monitoring
        * Activity logging

    ## Getting Started

    1. Create an account using the `/auth/register` endpoint
    2. Log in using the `/auth/login` endpoint
    3. Use the received token in the Authorization header for subsequent requests

    ## Authentication

    All protected endpoints require a valid JWT token in the Authorization header:
    ```
    Authorization: Bearer <your_token>
    ```

    ## Rate Limiting

    The API implements rate limiting to ensure fair usage:
    * 100 requests per minute per IP address
    * Endpoints have individual rate limits based on their resource intensity

    ## Error Handling

    The API uses standard HTTP status codes and returns detailed error messages:
    * 400: Bad Request
    * 401: Unauthorized
    * 403: Forbidden
    * 404: Not Found
    * 422: Validation Error
    * 429: Too Many Requests
    * 500: Internal Server Error
    """,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    terms_of_service="http://example.com/terms/",
    contact={
        "name": "API Support",
        "url": "http://example.com/support",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    }
)

# Add security middleware first
app.add_middleware(SecurityMiddleware)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add other middleware
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)

# Add performance middleware
app.add_middleware(
    PerformanceMiddleware,
    cache_ttl=settings.CACHE_TTL,
    cache_enabled=settings.CACHE_ENABLED,
    query_optimization_enabled=settings.QUERY_OPTIMIZATION_ENABLED
)

app.add_middleware(
    QueryOptimizationMiddleware,
    enabled=settings.QUERY_OPTIMIZATION_ENABLED,
    slow_query_threshold=settings.SLOW_QUERY_THRESHOLD
)

# Add file size limit middleware
app.middleware("http")(file_size_limit_middleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting up AssignmentAI application")
    # Add any additional startup initialization here

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AssignmentAI application")
    # Add any additional cleanup here

@app.get("/")
async def root():
    """
    Root endpoint that provides basic API information.
    """
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": settings.DESCRIPTION,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring the API status.
    
    Returns:
        dict: A simple status response indicating the API is healthy
    """
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=4,
        ssl_keyfile=settings.SSL_KEYFILE,
        ssl_certfile=settings.SSL_CERTFILE,
        log_level="info"
    ) 