from prometheus_client import Counter, Histogram, Gauge, Info
from fastapi import Request
import time
from typing import Callable
from functools import wraps
import platform
from datetime import datetime

# Request metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"]
)

# Document processing metrics
DOCUMENT_PROCESSING_COUNT = Counter(
    "document_processing_total",
    "Total number of documents processed",
    ["content_type", "status"]
)

DOCUMENT_PROCESSING_TIME = Histogram(
    "document_processing_duration_seconds",
    "Document processing time in seconds",
    ["content_type"]
)

DOCUMENT_SIZE = Histogram(
    "document_size_bytes",
    "Size of processed documents in bytes",
    ["content_type"]
)

# System metrics
ACTIVE_CONNECTIONS = Gauge(
    "active_connections",
    "Number of currently active connections"
)

SYSTEM_INFO = Info("system", "System information")

class MetricsMiddleware:
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        
        # Track active connections
        ACTIVE_CONNECTIONS.inc()
        
        try:
            response = await call_next(request)
            
            # Record request metrics
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status=response.status_code
            ).inc()
            
            # Record latency
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(time.time() - start_time)
            
            return response
        finally:
            ACTIVE_CONNECTIONS.dec()

def track_document_processing(func: Callable):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        content_type = kwargs.get("content_type", "unknown")
        
        try:
            result = await func(*args, **kwargs)
            
            # Record successful processing
            DOCUMENT_PROCESSING_COUNT.labels(
                content_type=content_type,
                status="success"
            ).inc()
            
            # Record processing time
            DOCUMENT_PROCESSING_TIME.labels(
                content_type=content_type
            ).observe(time.time() - start_time)
            
            # Record document size if available
            if hasattr(result, "content") and result.content:
                DOCUMENT_SIZE.labels(
                    content_type=content_type
                ).observe(len(result.content))
            
            return result
        except Exception as e:
            # Record failed processing
            DOCUMENT_PROCESSING_COUNT.labels(
                content_type=content_type,
                status="error"
            ).inc()
            raise e

    return wrapper

def init_metrics(app_version: str, environment: str):
    """Initialize system metrics"""
    SYSTEM_INFO.info({
        "version": app_version,
        "environment": environment,
        "python_version": platform.python_version(),
        "start_time": str(datetime.utcnow())
    }) 