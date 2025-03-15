"""
Metrics module for monitoring application performance.
"""

from prometheus_client import Counter, Histogram, Gauge, Summary, Info, CollectorRegistry
from typing import Dict, Any, Optional
import time
from datetime import datetime
from functools import wraps
import psutil
import platform
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from fastapi import FastAPI
from starlette.types import ASGIApp, Receive, Scope, Send

# Create a custom registry
registry = CollectorRegistry()

# Application info
APP_INFO = Info('assignmentai', 'Application information', registry=registry)
APP_INFO.info({
    'version': '1.0.0',
    'python_version': platform.python_version(),
    'platform': platform.platform()
})

# Request metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=registry
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    registry=registry
)

# Database metrics
DB_QUERY_COUNT = Counter(
    'database_queries_total',
    'Total number of database queries',
    ['operation', 'table'],
    registry=registry
)

DB_QUERY_LATENCY = Histogram(
    'database_query_duration_seconds',
    'Database query latency in seconds',
    ['operation', 'table'],
    registry=registry
)

# Cache metrics
CACHE_HIT_COUNT = Counter(
    'cache_hits_total',
    'Total number of cache hits',
    ['cache_type'],
    registry=registry
)

CACHE_MISS_COUNT = Counter(
    'cache_misses_total',
    'Total number of cache misses',
    ['cache_type'],
    registry=registry
)

# Resource metrics
MEMORY_USAGE = Gauge(
    'memory_usage_bytes',
    'Current memory usage in bytes',
    registry=registry
)

CPU_USAGE = Gauge(
    'cpu_usage_percent',
    'Current CPU usage percentage',
    registry=registry
)

# Business metrics
ASSIGNMENT_COUNT = Counter(
    'assignments_created_total',
    'Total number of assignments created',
    ['status', 'subject'],
    registry=registry
)

USER_COUNT = Gauge(
    'active_users_total',
    'Total number of active users',
    ['role'],
    registry=registry
)

# Performance metrics
MODEL_INFERENCE_TIME = Histogram(
    'model_inference_duration_seconds',
    'Model inference latency in seconds',
    ['model_name', 'operation'],
    registry=registry
)

API_RESPONSE_TIME = Summary(
    'api_response_duration_seconds',
    'API response latency in seconds',
    ['endpoint'],
    registry=registry
)

# Assignment metrics
assignments_created_total = Counter(
    'assignments_created_total',
    'Total number of assignments created',
    ['subject', 'grade_level']
)

assignment_generation_duration_seconds = Histogram(
    'assignment_generation_duration_seconds',
    'Assignment generation duration in seconds',
    ['subject', 'grade_level'],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0]
)

def init_metrics(version: str = "1.0.0", environment: str = "development"):
    """Initialize metrics with application information."""
    APP_INFO.info({
        'version': version,
        'name': 'AssignmentAI',
        'description': 'AI-powered assignment management system',
        'environment': environment
    })

def setup_metrics():
    """Initialize and configure metrics collection."""
    pass  # Prometheus client auto-initializes metrics

def get_metrics() -> Dict[str, Any]:
    """Get current metrics values."""
    return {
        'requests': {
            'total': REQUEST_COUNT._value.sum(),
            'latency': REQUEST_LATENCY._sum.sum()
        },
        'database': {
            'queries': DB_QUERY_COUNT._value.sum(),
            'latency': DB_QUERY_LATENCY._sum.sum()
        },
        'cache': {
            'hits': CACHE_HIT_COUNT._value.sum(),
            'misses': CACHE_MISS_COUNT._value.sum()
        },
        'resources': {
            'memory': MEMORY_USAGE._value.get(),
            'cpu': CPU_USAGE._value.get()
        }
    }

def record_metric(
    metric_type: str,
    value: float,
    labels: Optional[Dict[str, str]] = None
):
    """Record a metric value."""
    labels = labels or {}
    
    if metric_type == 'request':
        REQUEST_COUNT.labels(**labels).inc()
        REQUEST_LATENCY.labels(**labels).observe(value)
    elif metric_type == 'database':
        DB_QUERY_COUNT.labels(**labels).inc()
        DB_QUERY_LATENCY.labels(**labels).observe(value)
    elif metric_type == 'cache_hit':
        CACHE_HIT_COUNT.labels(**labels).inc()
    elif metric_type == 'cache_miss':
        CACHE_MISS_COUNT.labels(**labels).inc()
    elif metric_type == 'memory':
        MEMORY_USAGE.set(value)
    elif metric_type == 'cpu':
        CPU_USAGE.set(value)
    elif metric_type == 'assignment':
        ASSIGNMENT_COUNT.labels(**labels).inc()
    elif metric_type == 'user':
        USER_COUNT.labels(**labels).set(value)
    elif metric_type == 'model':
        MODEL_INFERENCE_TIME.labels(**labels).observe(value)
    elif metric_type == 'api':
        API_RESPONSE_TIME.labels(**labels).observe(value)

def track_time(metric_type: str, **labels):
    """Decorator to track execution time of a function."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            record_metric(metric_type, duration, labels)
            return result
            
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            record_metric(metric_type, duration, labels)
            return result
            
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator

def track_request_duration(func):
    """Decorator to track request duration"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            response = await func(*args, **kwargs)
            status = response.status_code
        except Exception as e:
            status = 500
            raise e
        finally:
            duration = time.time() - start_time
            method = kwargs.get('request').method
            endpoint = kwargs.get('request').url.path
            REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
        return response
    return wrapper

def track_assignment_creation(subject: str, grade_level: str):
    """Decorator to track assignment creation"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            assignments_created_total.labels(subject=subject, grade_level=grade_level).inc()
            assignment_generation_duration_seconds.labels(
                subject=subject,
                grade_level=grade_level
            ).observe(duration)
            return result
        return wrapper
    return decorator

async def update_system_metrics():
    """Update system metrics"""
    CPU_USAGE.set(psutil.cpu_percent())
    MEMORY_USAGE.set(psutil.virtual_memory().used)

# Background task to update system metrics periodically
async def metrics_updater():
    """Background task to update metrics periodically"""
    while True:
        await update_system_metrics()
        await asyncio.sleep(15)  # Update every 15 seconds

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting request metrics."""
    
    def __init__(self, app: FastAPI):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process request and collect metrics."""
        start_time = time.time()
        
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise e
        finally:
            # Record request duration
            duration = time.time() - start_time
            endpoint = request.url.path
            method = request.method
            
            # Update metrics
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status=status_code
            ).inc()
            
            REQUEST_LATENCY.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
        
        return response 