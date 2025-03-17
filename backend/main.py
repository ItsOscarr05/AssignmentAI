"""Main FastAPI application module."""
import asyncio
import logging
import os
import time
import uuid
from asyncio import Event, TaskGroup
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import (BackgroundTasks, Body, Depends, FastAPI, HTTPException,
                    Path, Query, Request, Response, WebSocket,
                    WebSocketDisconnect)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from grpc import Status
from prometheus_client import Counter, Histogram, make_asgi_app, start_http_server
from psutil import process_iter
from pydantic import BaseModel, Field, ValidationError

import assignment_routes
import document_routes
import feedback_routes
import user_routes
from backend.core.cache.multi_level_cache import (CacheLevel, cache,
                                                cache_instance)
from backend.core.communication.event_manager import event_store
from backend.core.communication.graphql_manager import graphql_router
from backend.core.communication.grpc_manager import grpc_manager
from backend.core.communication.service_mesh import service_mesh
from backend.core.communication.websocket_manager import websocket_manager
from backend.core.database.connection_pool import pool as db_pool
from backend.core.error_handling.error_manager import error_manager
from backend.core.monitoring.telemetry import monitor, telemetry
from backend.core.scaling.resource_manager import resource_manager
from backend.core.security.security_manager import security_manager
from backend.docs.documentation_manager import documentation_manager
from backend.tests.test_manager import test_manager
from cache import binary_cache, cache
from config import settings
from database import check_database_health, create_indexes
from middleware import rate_limiter
from middleware.error_handler import error_handler_middleware
from middleware.rate_limiter import RateLimiter, rate_limit_middleware
from middleware.validation import validation_middleware
from monitoring import MetricsMiddleware, init_metrics, registry
from monitoring.memory_manager import memory_manager
from monitoring.metrics import (init_metrics, metrics_updater,
                              track_assignment_creation,
                              track_request_duration)
from schemas import AssignmentCreate
from security import (Token, User, authenticate_user, check_permissions,
                     create_access_token, get_current_active_user,
                     get_current_user, security_headers_middleware)
from tasks import (analyze_performance, celery, generate_assignment,
                  process_document)

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

# Initialize metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status']
)
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

# Rate limiting configuration
RATE_LIMIT = {
    'default': 100,  # requests per minute
    'burst': 50      # burst size
}

# Models
class AssignmentSubmission(BaseModel):
    """Model for assignment submission."""
    content: str = Field(..., description="The content of the assignment submission")
    attachments: Optional[List[str]] = Field(default=None, description="List of attachment URLs")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

async def get_system_config() -> Dict[str, Any]:
    """Get system configuration settings.
    
    Returns:
        Dict containing system configuration settings.
    """
    async with db_pool.get_connection(read_only=True) as conn:
        config = await conn.fetchrow("SELECT * FROM system_config WHERE active = true")
        return dict(config) if config else {}

async def get_active_users() -> List[Dict[str, Any]]:
    """Get list of active users.
    
    Returns:
        List of active user records.
    """
    async with db_pool.get_connection(read_only=True) as conn:
        users = await conn.fetch(
            """
            SELECT id, username, email, last_active
            FROM users
            WHERE status = 'active'
            AND last_active > NOW() - INTERVAL '30 days'
            """
        )
        return [dict(user) for user in users]

# Initialize components
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager with enhanced startup and shutdown."""
    # Startup
    logger.info("Starting AssignmentAI API...")
    
    try:
        # Initialize database pools
        await db_pool.initialize()
        
        # Initialize cache connections
        await cache_instance.connect()
        await binary_cache.connect()
        
        # Initialize metrics
        init_metrics(app.version, os.getenv("ENVIRONMENT", "development"))
        
        # Start metrics updater task
        metrics_task = asyncio.create_task(metrics_updater())
        
        # Create database indexes
        await create_indexes()
        
        # Warm up cache for frequently accessed data
        asyncio.create_task(warm_up_cache())
        
        # Initialize memory manager
        memory_manager.start()
        
        # Start resource monitoring
        monitoring_task = asyncio.create_task(resource_manager.monitor_resources())
        
        # Initialize security manager
        app.state.security = security_manager
        await app.state.security.initialize()
        
        # Initialize telemetry
        app.state.telemetry = telemetry
        await app.state.telemetry.initialize()
        
        # Initialize resource manager
        app.state.resources = resource_manager
        await app.state.resources.initialize()
        
        # Generate documentation
        await documentation_manager.generate_all_documentation()
        
        # Run initial tests
        test_results = await test_manager.run_test_suite(
            categories=["unit", "integration"]
        )
        if not all(result.success for results in test_results.values() 
                  for result in results):
            logger.error("Initial tests failed")
        
        # Initialize core components
        await grpc_manager.initialize()
        await service_mesh.initialize()
        
        yield
        
        # Shutdown
        logger.info("Shutting down AssignmentAI API...")
        
        # Cancel background tasks
        metrics_task.cancel()
        try:
            await metrics_task
        except asyncio.CancelledError:
            pass
        
        # Close connections
        await db_pool.close()
        await cache_instance.disconnect()
        await binary_cache.disconnect()
        
        # Stop memory manager
        memory_manager.stop()
        
        # Cancel resource monitoring
        monitoring_task.cancel()
        
        # Cleanup
        await grpc_manager.close()
        await service_mesh.close()
        
    except Exception as e:
        logger.error(f"Startup/shutdown error: {str(e)}")
        raise


app = FastAPI(
    title="AssignmentAI API",
    description="Advanced AI-powered assignment management system",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
    openapi_url="/api/openapi.json",
    default_response_class=JSONResponse
)

# Middleware configuration with optimal ordering
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Compress responses larger than 1KB
    compresslevel=6     # Balanced compression level
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    max_age=3600  # Cache preflight requests for 1 hour
)


# Custom middleware for security and performance
@app.middleware("http")
async def performance_middleware(request: Request, call_next):
    """Enhanced performance monitoring and optimization middleware."""
    # Track request timing
    start_time = time.time()
    
    # Rate limiting
    client_id = request.client.host
    if not await rate_limiter.is_allowed(client_id):
        return JSONResponse(
            status_code=429,
            content={
                "error": "Too many requests",
                "retry_after": rate_limiter.get_retry_after(client_id)
            }
        )
    
    # Process request
    try:
        # Set request ID for tracing
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Add correlation ID header if provided
        correlation_id = request.headers.get("X-Correlation-ID", request_id)
        
        # Memory usage check
        if memory_manager.is_memory_critical():
            return JSONResponse(
                status_code=503,
                content={"error": "Service temporarily unavailable"}
            )
        
        # Process request with timeout
        try:
            async with asyncio.timeout(settings.REQUEST_TIMEOUT):
                response = await call_next(request)
        except asyncio.TimeoutError:
            return JSONResponse(
                status_code=504,
                content={"error": "Request timeout"}
            )
        
        # Add response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = correlation_id
        
        # Track response time
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Update metrics
        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(process_time)
        
        return response
        
    except Exception as e:
        logger.error(f"Request processing error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )


# Error handling middleware
@app.middleware("http")
async def error_handler(request: Request, call_next):
    """Enhanced error handling middleware."""
    try:
        return await call_next(request)
    except ValidationError as e:
        return JSONResponse(
            status_code=422,
            content={"error": "Validation error", "details": e.errors()}
        )
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail}
        )
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )


# Security middleware
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Enhanced security middleware."""
    # Add security headers
    response = await call_next(request)
    response.headers.update({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": settings.CSP_POLICY,
        "Referrer-Policy": "strict-origin-when-cross-origin"
    })
    return response


# Cache warming function
async def warm_up_cache():
    """Warm up cache with frequently accessed data."""
    try:
        # Cache common configurations
        config = await get_system_config()
        await cache_instance.set("system:config", config, expire=3600)
        
        # Cache frequently accessed user data
        active_users = await get_active_users()
        for user in active_users:
            await cache_instance.set(f"user:{user.get('id')}", user, expire=1800)
        
        logger.info("Cache warm-up completed")
    except Exception as e:
        logger.error(f"Cache warm-up error: {str(e)}")


# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app(registry=registry)
app.mount("/metrics", metrics_app)

# Include routers with versioning
app.include_router(
    document_routes.router,
    prefix="/api/v1",
    tags=["documents"]
)
app.include_router(
    assignment_routes.router,
    prefix="/api/v1",
    tags=["assignments"]
)
app.include_router(
    user_routes.router,
    prefix="/api/v1",
    tags=["users"]
)
app.include_router(
    feedback_routes.router,
    prefix="/api/v1",
    tags=["feedback"]
)

# Mount GraphQL router
app.include_router(graphql_router, prefix="/graphql")


# WebSocket endpoint
@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    """WebSocket endpoint for real-time communication."""
    user = await get_current_user(websocket)
    if not user:
        await websocket.close(code=4001)
        return
        
    await websocket_manager.connect(websocket, channel, user.id)
    
    try:
        while True:
            data = await websocket.receive_json()
            await websocket_manager.handle_message(
                websocket, channel, user.id, data
            )
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket, channel, user.id)


# Event sourcing endpoint
@app.post("/events")
@monitor("create_event")
async def create_event(event_data: Dict[str, Any]):
    """Create a new event in the event store."""
    event = Event(
        id=str(uuid.uuid4()),
        type=event_data["type"],
        aggregate_id=event_data["aggregate_id"],
        data=event_data["data"],
        metadata=event_data.get("metadata", {}),
        timestamp=datetime.now(),
        version=event_data.get("version", 1)
    )
    await event_store.append(event)
    return {"status": "success", "event_id": event.id}


# Service mesh routing
@app.post("/route/{service}")
@monitor("route_request")
async def route_request(
    service: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Route request through service mesh."""
    data = await request.json()
    return await service_mesh.route_request(
        service,
        request.method,
        request.url.path,
        data,
        dict(request.headers)
    )


# Error handling for 404
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors."""
    return {
        "error": "Resource not found",
        "path": request.url.path
    }


@app.post("/batch", response_model=List[dict])
async def batch_operations(operations: List[dict], background_tasks: BackgroundTasks):
    """Handle batch operations efficiently with improved concurrency and error handling."""
    # Validate batch size
    MAX_BATCH_SIZE = 100
    if len(operations) > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Batch size exceeds maximum limit of {MAX_BATCH_SIZE}"
        )

    # Group operations by type for efficient processing
    operation_groups = defaultdict(list)
    for op in operations:
        operation_groups[op.get("type")].append(op)

    results = []
    async with asyncio.TaskGroup() as tg:
        for op_type, ops in operation_groups.items():
            if op_type == "assignment":
                results.extend(await process_assignment_batch(ops, tg))
            elif op_type == "user":
                results.extend(await process_user_batch(ops, tg))
            else:
                results.extend([{"error": f"Unknown operation type: {op_type}"} for _ in ops])

    # Schedule cleanup task
    background_tasks.add_task(cleanup_batch_resources, operation_groups)
    
    return results


async def process_assignment_batch(operations: List[dict], tg: asyncio.TaskGroup) -> List[dict]:
    """Process a batch of assignment operations concurrently."""
    results = []
    semaphore = asyncio.Semaphore(10)  # Limit concurrent assignment processing
    
    async def process_single_assignment(op: dict) -> dict:
        async with semaphore:
            try:
                if "data" not in op:
                    return {"error": "Missing operation data"}
                
                # Use connection from pool
                async with db_pool.acquire() as conn:
                    # Process with timeout
                    async with asyncio.timeout(30):
                        result = await assignment_routes.process_assignment_operation(
                            op["data"],
                            conn=conn
                        )
                        
                        # Cache successful results
                        if result.get("success"):
                            cache_key = f"assignment:{result['id']}"
                            await cache_instance.set(cache_key, result, expire=3600)
                        
                        return {"success": True, "result": result}
                        
            except asyncio.TimeoutError:
                return {
                    "error": "Operation timed out",
                    "operation_id": op.get("id"),
                    "status": "failed"
                }
            except ValidationError as e:
                return {"error": "Validation failed", "details": str(e)}
            except Exception as e:
                logger.error(f"Assignment processing error: {str(e)}", exc_info=True)
                return {"error": f"Failed to process assignment: {str(e)}"}

    # Create tasks for each operation
    tasks = [
        tg.create_task(
            process_single_assignment(op),
            name=f"assignment-{op.get('id', 'unknown')}"
        )
        for op in operations
    ]
    
    # Wait for all tasks to complete
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle any exceptions in results
    processed_results = []
    for result in results:
        if isinstance(result, Exception):
            processed_results.append({
                "error": f"Operation failed: {str(result)}",
                "status": "failed"
            })
        else:
            processed_results.append(result)
    
    return processed_results


async def process_user_batch(operations: List[dict], tg: asyncio.TaskGroup) -> List[dict]:
    """Process a batch of user operations concurrently."""
    results = []
    semaphore = asyncio.Semaphore(5)  # More restrictive limit for user operations
    
    async def process_single_user(op: dict) -> dict:
        async with semaphore:
            try:
                async with db_pool.acquire() as conn:
                    async with asyncio.timeout(15):
                        result = await user_routes.process_user_operation(
                            op,
                            conn=conn
                        )
                        return {"success": True, "result": result}
            except Exception as e:
                logger.error(f"User processing error: {str(e)}", exc_info=True)
                return {"error": f"Failed to process user operation: {str(e)}"}

    tasks = [
        tg.create_task(
            process_single_user(op),
            name=f"user-{op.get('id', 'unknown')}"
        )
        for op in operations
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [
        {"error": f"Operation failed: {str(result)}"} if isinstance(result, Exception) else result
        for result in results
    ]


async def cleanup_batch_resources(operation_groups: Dict[str, List[dict]]):
    """Cleanup resources after batch processing."""
    try:
        # Release any held connections
        await db_pool.cleanup()
        
        # Clear temporary cache entries
        cleanup_tasks = []
        for op_type, ops in operation_groups.items():
            if op_type == "assignment":
                cleanup_tasks.extend([
                    cache_instance.delete(f"temp:assignment:{op.get('id')}")
                    for op in ops
                    if op.get('id')
                ])
        
        if cleanup_tasks:
            await asyncio.gather(*cleanup_tasks)
            
    except Exception as e:
        logger.error(f"Cleanup error: {str(e)}", exc_info=True)


# Health check endpoint
@app.get("/health")
@monitor("health_check")
@cache(ttl=60, level=CacheLevel.L1)
async def health_check():
    """Enhanced health check endpoint."""
    status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": settings.VERSION,
        "components": {}
    }
    
    # Check database
    try:
        await db_pool.health_check()
        status["components"]["database"] = "healthy"
    except Exception as e:
        status["components"]["database"] = str(e)
        status["status"] = "degraded"
    
    # Check cache
    try:
        await cache_instance.get("health_check")
        status["components"]["cache"] = "healthy"
    except Exception as e:
        status["components"]["cache"] = str(e)
        status["status"] = "degraded"
    
    # Check service mesh
    try:
        services = await service_mesh._get_service_instance("health")
        status["components"]["service_mesh"] = "healthy"
    except Exception as e:
        status["components"]["service_mesh"] = str(e)
        status["status"] = "degraded"
    
    return status


# Assignment endpoints
@app.post("/api/v1/assignments")
@monitor("create_assignment")
async def create_assignment(assignment: AssignmentCreate, user = Depends(get_current_user)):
    """Create a new assignment."""
    # Check permissions
    if not await security_manager.check_permission(user.id, "assignments", "create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    async with db_pool.get_connection() as conn:
        result = await conn.fetchrow(
            """
            INSERT INTO assignments (title, description, due_date, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            assignment.title,
            assignment.description,
            assignment.due_date,
            user.id
        )
        
    # Invalidate relevant caches
    await cache_instance.invalidate("assignments_list")
    
    # Track metrics
    telemetry.metrics.assignments_created.inc()
    
    return {"id": result["id"]}


@app.get("/api/v1/assignments")
@monitor("list_assignments")
@cache(ttl=300, level=CacheLevel.L2)
async def list_assignments(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    user = Depends(get_current_user)
):
    """List assignments with pagination and search."""
    # Check permissions
    if not await security_manager.check_permission(user.id, "assignments", "read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Build query
    query = "SELECT * FROM assignments WHERE 1=1"
    params = []
    
    if search:
        query += " AND (title ILIKE $1 OR description ILIKE $1)"
        params.append(f"%{search}%")
    
    # Add pagination
    query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    params.extend([limit, (page - 1) * limit])
    
    # Execute query
    async with db_pool.get_connection(read_only=True) as conn:
        results = await conn.fetch(query, *params)
    
    return {
        "items": [dict(row) for row in results],
        "page": page,
        "limit": limit,
        "total": await _get_total_assignments()
    }


@app.post("/api/v1/assignments/{assignment_id}/submit")
@monitor("submit_assignment")
async def submit_assignment(
    assignment_id: int,
    submission: AssignmentSubmission,
    user = Depends(get_current_user)
):
    """Submit an assignment."""
    # Check permissions
    if not await security_manager.check_permission(user.id, "assignments", "submit"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Create task for processing
    task = {
        "id": str(uuid.uuid4()),
        "type": "assignment_submission",
        "data": {
            "assignment_id": assignment_id,
            "user_id": user.id,
            "content": submission.content
        }
    }
    
    # Distribute task to workers
    await resource_manager.distribute_tasks([task])
    
    return {"task_id": task["id"]}


@app.get("/api/v1/tasks/{task_id}")
@monitor("get_task_status")
@cache(ttl=30, level=CacheLevel.L1)
async def get_task_status(task_id: str, user = Depends(get_current_user)):
    """Get task status."""
    async with db_pool.get_connection(read_only=True) as conn:
        task = await conn.fetchrow(
            "SELECT * FROM tasks WHERE id = $1",
            task_id
        )
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return dict(task)


# Error handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    await telemetry.logger.log_event(
        "ERROR",
        "http_error",
        str(exc.detail),
        {
            "status_code": exc.status_code,
            "path": request.url.path
        }
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    await telemetry.logger.log_event(
        "ERROR",
        "unhandled_error",
        str(exc),
        {"path": request.url.path}
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Helper functions
async def _get_total_assignments() -> int:
    """Get total number of assignments."""
    cache_key = "total_assignments"
    total = await cache_instance.get(cache_key)
    
    if total is None:
        async with db_pool.get_connection(read_only=True) as conn:
            total = await conn.fetchval("SELECT COUNT(*) FROM assignments")
        await cache_instance.set(cache_key, total, ttl=300)
    
    return total


@app.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """Get system metrics."""
    try:
        return await telemetry.get_metrics()
    except Exception as e:
        error_id = await error_manager.handle_error(e)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve metrics",
                "error_id": error_id
            }
        )


@app.get("/docs/architecture")
async def get_architecture_docs() -> Dict[str, Any]:
    """Get system architecture documentation."""
    try:
        return {
            "content": await documentation_manager.generate_architecture_docs()
        }
    except Exception as e:
        error_id = await error_manager.handle_error(e)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve architecture documentation",
                "error_id": error_id
            }
        )


@app.get("/docs/runbook")
async def get_runbook() -> Dict[str, Any]:
    """Get system runbook."""
    try:
        return {
            "content": await documentation_manager.generate_runbooks()
        }
    except Exception as e:
        error_id = await error_manager.handle_error(e)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to retrieve runbook",
                "error_id": error_id
            }
        )


@app.post("/tests/run")
async def run_tests(
    categories: Optional[List[str]] = None,
    tags: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Run test suite."""
    try:
        results = await test_manager.run_test_suite(categories, tags)
        report = await test_manager.generate_test_report(results)
        return {
            "success": True,
            "report": report
        }
    except Exception as e:
        error_id = await error_manager.handle_error(e)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to run tests",
                "error_id": error_id
            }
        )


if __name__ == "__main__":
    # Get configuration from environment variables
    host = settings.HOST
    port = settings.PORT
    debug = settings.DEBUG
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        workers=settings.WORKERS
    )
