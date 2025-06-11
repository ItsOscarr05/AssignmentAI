from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from app.core.config import settings
from app.db.database import engine, Base
from app.api.v1.api import api_router
from app.core.rate_limit import rate_limit_middleware
from app.core.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    database_error_handler,
    general_exception_handler,
    validation_error_handler
)
from app.services.logging_service import logging_service
from app.api.deps import get_db
from app.api.middleware import file_size_limit_middleware
from datetime import datetime
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.performance import PerformanceMiddleware, QueryOptimizationMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.security import SecurityMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
import uvicorn

# Initialize logging
logging_service.info("Initializing logging service")

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
        * Two-factor authentication
        * Password reset functionality

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

    ## Security Features

    * Rate Limiting
        * 100 requests per minute per IP address
        * 5 login attempts per minute
        * Account lockout after 5 failed attempts
        * 15-minute lockout period

    * Password Requirements
        * Minimum 12 characters
        * Must contain uppercase and lowercase letters
        * Must contain numbers and special characters
        * Password hashing with bcrypt

    * Additional Security
        * CSRF protection
        * XSS protection
        * SQL injection prevention
        * Input validation and sanitization
        * Secure headers
        * CORS protection

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

# Setup error handling
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_error_handler)
app.add_exception_handler(Exception, general_exception_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

# Add other middleware
app.add_middleware(ErrorHandlerMiddleware)
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

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add security headers
app.add_middleware(
    SecurityMiddleware,
    headers={
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logging_service.info("Starting up AssignmentAI application")
    # Add any additional startup initialization here

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logging_service.info("Shutting down AssignmentAI application")
    # Add any cleanup code here

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to AssignmentAI API",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
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