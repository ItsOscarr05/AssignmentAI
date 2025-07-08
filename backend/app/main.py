import os
import sys
import logging
import psutil
import redis
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError

from app.core.config import settings
from app.core.logger import logging_service
from app.api.v1.api import api_router
from app.core.error_handlers import (
    http_exception_handler,
    validation_exception_handler,
    database_error_handler,
    general_exception_handler,
    validation_error_handler
)
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.performance import PerformanceMiddleware, QueryOptimizationMiddleware
from app.api.middleware import file_size_limit_middleware
from app.core.rate_limit import init_rate_limiter, close_rate_limiter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logging_service.info("Starting up AssignmentAI application")
    await init_rate_limiter()
    # Add any additional startup initialization here
    
    yield
    
    # Shutdown
    logging_service.info("Shutting down AssignmentAI application")
    await close_rate_limiter()
    # Add any cleanup code here

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    # AssignmentAI API

    A comprehensive AI-powered educational platform for teachers and students.

    ## Features

    * 🤖 AI-Powered Assignment Generation
        * Generate assignments based on subject, grade level, and learning objectives
        * AI-powered feedback and grading
        * Intelligent plagiarism detection
        * Automated rubric generation

    * 📚 Assignment Management
        * Create, edit, and organize assignments
        * Support for multiple file formats
        * Assignment templates and libraries
        * Due date management and notifications

    * 👥 User Management
        * Teacher and student accounts
        * Role-based access control
        * Class and course management
        * Student progress tracking

    * 🔒 Security & Privacy
        * JWT authentication
        * Two-factor authentication
        * Rate limiting and DDoS protection
        * Data encryption and privacy compliance

    * 📊 Analytics & Reporting
        * Student performance analytics
        * Assignment completion statistics
        * Usage analytics and insights
        * Custom report generation

    * 🔗 Integrations
        * File storage integration
        * Email notifications

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
    },
    lifespan=lifespan
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
    allow_origins=[settings.FRONTEND_URL] if settings.FRONTEND_URL else ["*"],
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

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

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
    # Get system information
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Check database connectivity
    try:
        from app.database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check Redis connectivity
    try:
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "redis": redis_status,
        },
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
            "uptime": psutil.boot_time(),
        },
        "uptime": datetime.fromtimestamp(psutil.boot_time()).isoformat(),
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