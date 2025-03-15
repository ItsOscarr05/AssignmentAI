# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, Query, Path, Body, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from grpc import Status
from psutil import process_iter
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import uvicorn
from datetime import datetime
import logging
import os
from dotenv import load_dotenv
from database import check_database_health, create_indexes
import document_routes
from middleware.error_handler import error_handler_middleware
from middleware.rate_limiter import rate_limit_middleware, RateLimiter
from middleware.validation import validation_middleware
from monitoring import MetricsMiddleware, init_metrics, registry
from cache import cache, binary_cache
from prometheus_client import make_asgi_app, Histogram
from config import settings
from tasks import celery, process_document, generate_assignment, analyze_performance
from security import (
    Token, User, authenticate_user, create_access_token,
    get_current_active_user, check_permissions, security_headers_middleware
)
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from monitoring.metrics import (
    track_request_duration,
    track_assignment_creation,
    init_metrics,
    metrics_updater
)
import asyncio
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import time
from contextlib import asynccontextmanager
from monitoring.memory_manager import memory_manager
from database.connection_pool import pool
from database.query_optimizer import query_optimizer
import assignment_routes
import user_routes
import feedback_routes

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Performance metrics
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Rate limiting configuration
RATE_LIMIT = {
    'default': 100,  # requests per minute
    'burst': 50      # burst size
}

class RateLimiter:
    def __init__(self):
        self.requests = {}
        self.last_cleanup = time.time()
    
    async def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        
        # Cleanup old entries every minute
        if now - self.last_cleanup > 60:
            self._cleanup(now)
        
        # Initialize or get client's request history
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Remove requests older than 1 minute
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if now - req_time < 60
        ]
        
        # Check rate limit
        if len(self.requests[client_id]) >= RATE_LIMIT['default']:
            return False
        
        # Add new request
        self.requests[client_id].append(now)
        return True
    
    def _cleanup(self, now: float):
        """Remove old entries from rate limiter"""
        self.requests = {
            client_id: [
                req_time for req_time in requests
                if now - req_time < 60
            ]
            for client_id, requests in self.requests.items()
        }
        self.last_cleanup = now

# Initialize FastAPI with optimizations
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting AssignmentAI...")
    
    # Initialize metrics
    init_metrics(app.version, os.getenv("ENVIRONMENT", "development"))
    
    # Start metrics updater task
    metrics_task = asyncio.create_task(metrics_updater())
    
    # Check database health
    if not await check_database_health():
        logger.error("Database health check failed")
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Create database indexes
    try:
        await create_indexes()
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Failed to create indexes: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create database indexes")
    
    yield
    
    # Shutdown
    metrics_task.cancel()
    try:
        await metrics_task
    except asyncio.CancelledError:
        pass
    logger.info("Shutting down AssignmentAI...")

app = FastAPI(
    title="AssignmentAI API",
    description="API for AssignmentAI educational platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Add compression middleware
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000  # Only compress responses larger than 1KB
)

# Add CORS middleware with optimized settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600  # Cache preflight requests for 1 hour
)

# Add custom middleware
app.middleware("http")(error_handler_middleware)
app.middleware("http")(validation_middleware)
app.middleware("http")(rate_limit_middleware)
app.add_middleware(MetricsMiddleware)
app.middleware("http")(security_headers_middleware)

# Mount Prometheus metrics
metrics_app = make_asgi_app(registry=registry)
app.mount("/metrics", metrics_app)

# Initialize metrics
init_metrics(app.version, os.getenv("ENVIRONMENT", "development"))

# Rate limiter instance
rate_limiter = RateLimiter()

@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    """Middleware for performance monitoring and rate limiting"""
    # Rate limiting
    client_id = request.client.host
    if not await rate_limiter.is_allowed(client_id):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests"}
        )
    
    # Performance monitoring
    start_time = time.time()
    response = await call_next(request)
    elapsed = time.time() - start_time
    
    # Record metrics
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(elapsed)
    
    return response

# Enhanced Pydantic models with documentation
class GradeLevel(str, Enum):
    ELEMENTARY = "elementary"
    MIDDLE_SCHOOL = "middle_school"
    HIGH_SCHOOL = "high_school"
    COLLEGE = "college"
    UNIVERSITY = "university"

class Subject(str, Enum):
    MATHEMATICS = "mathematics"
    SCIENCE = "science"
    ENGLISH = "english"
    HISTORY = "history"
    COMPUTER_SCIENCE = "computer_science"
    OTHER = "other"

class AssignmentRequest(BaseModel):
    subject: Subject = Field(..., description="The subject area of the assignment")
    grade_level: GradeLevel = Field(..., description="The target grade level for the assignment")
    assignment_text: str = Field(..., min_length=10, description="The main text or requirements for the assignment")
    additional_requirements: Optional[List[str]] = Field(default=None, description="Any additional requirements or specifications")
    
    class Config:
        schema_extra = {
            "example": {
                "subject": "mathematics",
                "grade_level": "high_school",
                "assignment_text": "Create a comprehensive lesson plan for teaching quadratic equations",
                "additional_requirements": [
                    "Include real-world applications",
                    "Provide step-by-step solutions"
                ]
            }
        }

class AssignmentResponse(BaseModel):
    id: str = Field(..., description="Unique identifier for the assignment")
    subject: Subject = Field(..., description="The subject area of the assignment")
    grade_level: GradeLevel = Field(..., description="The target grade level for the assignment")
    assignment_text: str = Field(..., description="The main text or requirements for the assignment")
    response: str = Field(..., description="The generated response or status message")
    created_at: datetime = Field(..., description="Timestamp when the assignment was created")
    status: str = Field(..., description="Current status of the assignment processing")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "task-123",
                "subject": "mathematics",
                "grade_level": "high_school",
                "assignment_text": "Create a comprehensive lesson plan for teaching quadratic equations",
                "response": "Task submitted for processing",
                "created_at": "2024-03-11T12:00:00",
                "status": "pending"
            }
        }

class TaskStatus(BaseModel):
    task_id: str = Field(..., description="Unique identifier for the task")
    status: str = Field(..., description="Current status of the task")
    result: Optional[dict] = Field(None, description="Task result if completed")
    error: Optional[str] = Field(None, description="Error message if task failed")
    
    class Config:
        schema_extra = {
            "example": {
                "task_id": "task-123",
                "status": "completed",
                "result": {
                    "status": "success",
                    "assignment_data": {
                        "subject": "mathematics",
                        "grade_level": "high_school",
                        "assignment_text": "Create a comprehensive lesson plan for teaching quadratic equations"
                    }
                }
            }
        }

class HealthStatus(BaseModel):
    status: str = Field(..., description="Overall health status of the system")
    timestamp: datetime = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")
    cache: bool = Field(..., description="Redis cache connection status")
    binary_cache: bool = Field(..., description="Binary cache connection status")
    celery: bool = Field(..., description="Celery worker status")

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    # Initialize metrics
    init_metrics(app.version, os.getenv("ENVIRONMENT", "development"))
    
    # Initialize Redis connections
    await cache.connect()
    await binary_cache.connect()
    logger.info("Application startup completed")

@app.on_event("shutdown")
async def shutdown_event():
    # Close Redis connections
    await cache.disconnect()
    await binary_cache.disconnect()
    logger.info("Application shutdown completed")

@app.get("/")
async def root():
    return {"message": "Welcome to AssignmentAI API"}

@app.post("/api/token",
    response_model=Token,
    summary="Create access token",
    description="Create a new access token for authentication.",
    tags=["authentication"]
)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=Status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "scopes": user.roles},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me",
    response_model=User,
    summary="Get current user",
    description="Get information about the currently authenticated user.",
    tags=["users"]
)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/api/assignments",
    response_model=AssignmentResponse,
    summary="Create a new assignment",
    description="Submit a new assignment for AI-powered generation. Requires authentication.",
    response_description="Returns the created assignment details and task ID for tracking",
    dependencies=[Depends(check_permissions(["teacher", "admin"]))]
)
@track_request_duration
@track_assignment_creation(subject=lambda x: x.subject, grade_level=lambda x: x.grade_level)
async def create_assignment(
    assignment: AssignmentRequest = Body(..., description="The assignment details to process"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new assignment with the following steps:
    1. Validate the input data and user permissions
    2. Submit the assignment for asynchronous processing
    3. Return a task ID for tracking the progress
    """
    try:
        # Submit assignment generation task to Celery
        task = generate_assignment.delay({
            "subject": assignment.subject,
            "grade_level": assignment.grade_level,
            "assignment_text": assignment.assignment_text,
            "additional_requirements": assignment.additional_requirements,
            "created_by": current_user.username
        })
        
        # Return task ID for status tracking
        return {
            "id": task.id,
            "subject": assignment.subject,
            "grade_level": assignment.grade_level,
            "assignment_text": assignment.assignment_text,
            "response": "Task submitted for processing",
            "created_at": datetime.now(),
            "status": "pending"
        }
    except Exception as e:
        logger.error(f"Error submitting assignment task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}",
    response_model=TaskStatus,
    summary="Get task status",
    description="Retrieve the current status and result of a task by its ID. Requires authentication.",
    response_description="Returns the task status and result if available",
    dependencies=[Depends(get_current_active_user)]
)
async def get_task_status(
    task_id: str = Path(..., description="The ID of the task to check")
):
    """Get the status of a Celery task by its ID"""
    task = celery.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task.status,
        "result": task.result if task.ready() else None,
        "error": str(task.error) if task.failed() else None
    }

@app.get("/api/health",
    response_model=HealthStatus,
    summary="Health check",
    description="Check the health status of the API and its dependencies.",
    response_description="Returns the health status of all system components"
)
async def health_check():
    """Enhanced health check endpoint with database pool metrics"""
    db_healthy = await check_database_health()
    cache_healthy = await cache.check_health()
    pool_stats = pool.get_pool_stats()
    
    return {
        "status": "healthy" if db_healthy and cache_healthy else "unhealthy",
        "database": {
            "status": "up" if db_healthy else "down",
            "pool": pool_stats
        },
        "cache": "up" if cache_healthy else "down",
        "memory": memory_manager.get_memory_analytics(),
        "version": settings.VERSION
    }

@app.get("/api/metrics/database")
async def get_database_metrics():
    """Get detailed database performance metrics"""
    async with pool.optimized_session() as session:
        # Get query statistics
        query_stats = await query_optimizer.get_query_stats(session)
        
        # Get pool statistics
        pool_stats = pool.get_pool_stats()
        
        return {
            "pool_metrics": pool_stats,
            "query_metrics": query_stats,
            "optimization_suggestions": await query_optimizer.get_optimization_suggestions(session)
        }

# Include routers
app.include_router(document_routes.router, prefix="/api/v1", tags=["documents"])
app.include_router(assignment_routes.router, prefix="/api/v1", tags=["assignments"])
app.include_router(user_routes.router, prefix="/api/v1", tags=["users"])
app.include_router(feedback_routes.router, prefix="/api/v1", tags=["feedback"])

# Error handling for 404
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Resource not found",
        "path": request.url.path
    }

@app.post("/batch")
async def batch_operations(operations: List[dict]):
    """Handle batch operations efficiently"""
    results = await asyncio.gather(*[
        process_operation(op) for op in operations
    ])
    return {"results": results}

async def process_operation(operation: dict):
    """Process a single operation in the batch"""
    try:
        # Implementation specific to operation type
        op_type = operation.get("type")
        if op_type == "assignment":
            return await process_assignment(operation)
        elif op_type == "user":
            return await process_iter(operation)
        else:
            return {"error": f"Unknown operation type: {op_type}"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Get configuration from environment variables
    host = settings.API_HOST
    port = settings.API_PORT
    debug = settings.DEBUG
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        workers=settings.API_WORKERS
    )
