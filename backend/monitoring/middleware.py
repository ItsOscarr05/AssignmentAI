"""
Middleware module for monitoring and metrics collection.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import time
from .metrics import REQUEST_COUNT, REQUEST_LATENCY
from .logging import request_id, correlation_id, user_id
import uuid

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting request metrics."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate request ID if not present
        req_id = request_id.get() or str(uuid.uuid4())
        request_id.set(req_id)
        
        # Set correlation ID from header or generate new one
        corr_id = request.headers.get('X-Correlation-ID') or str(uuid.uuid4())
        correlation_id.set(corr_id)
        
        # Record start time
        start_time = time.time()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Record metrics
            duration = time.time() - start_time
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status=response.status_code
            ).inc()
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)
            
            # Add tracking headers to response
            response.headers['X-Request-ID'] = req_id
            response.headers['X-Correlation-ID'] = corr_id
            
            return response
            
        except Exception as e:
            # Record error metrics
            duration = time.time() - start_time
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status=500
            ).inc()
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)
            raise 