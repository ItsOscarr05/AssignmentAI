from typing import Callable, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.cache_service import cache_service
from app.services.db_optimization_service import db_optimizer
from app.services.logging_service import logging_service
import time
import json

class PerformanceMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        cache_ttl: int = 3600,
        cache_enabled: bool = True,
        query_optimization_enabled: bool = True
    ):
        super().__init__(app)
        self.cache_ttl = cache_ttl
        self.cache_enabled = cache_enabled
        self.query_optimization_enabled = query_optimization_enabled
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        # Skip caching for non-GET requests
        if request.method != "GET" or not self.cache_enabled:
            return await call_next(request)
        
        # Generate cache key from request
        cache_key = self._generate_cache_key(request)
        
        # Try to get from cache
        cached_response = await cache_service.get(cache_key)
        if cached_response:
            logging_service.info("Cache hit", extra={"path": request.url.path})
            return Response(
                content=cached_response["content"],
                status_code=cached_response["status_code"],
                headers=cached_response["headers"],
                media_type=cached_response["media_type"]
            )
        
        # If not in cache, process request
        response = await call_next(request)
        
        # Cache the response
        if response.status_code == 200:
            await self._cache_response(cache_key, response)
        
        return response
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate a unique cache key for the request"""
        key_parts = [
            request.method,
            request.url.path,
            str(sorted(request.query_params.items()))
        ]
        return ":".join(key_parts)
    
    async def _cache_response(self, cache_key: str, response: Response):
        """Cache the response with appropriate metadata"""
        try:
            # Only cache if response has a .body method
            if not hasattr(response, 'body') or not callable(getattr(response, 'body', None)):
                return
            content = await response.body()
            cache_data = {
                "content": content,
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "media_type": response.media_type
            }
            
            # Add cache tags based on path
            tags = self._get_cache_tags(Request.url.path)
            
            await cache_service.set(
                cache_key,
                cache_data,
                ttl=self.cache_ttl,
                tags=tags
            )
            
            logging_service.info("Cached response", extra={"path": Request.url.path})
        except Exception as e:
            logging_service.error(f"Error caching response: {str(e)}")
    
    def _get_cache_tags(self, path: str) -> list:
        """Get cache tags based on the request path"""
        tags = []
        if "/assignments" in path:
            tags.append("assignments")
        if "/users" in path:
            tags.append("users")
        if "/ai" in path:
            tags.append("ai")
        return tags

class QueryOptimizationMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        enabled: bool = True,
        slow_query_threshold: float = 1.0
    ):
        super().__init__(app)
        self.enabled = enabled
        self.slow_query_threshold = slow_query_threshold
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        if not self.enabled:
            return await call_next(request)
        
        # Start timing the request
        start_time = time.time()
        
        # Process the request
        response = await call_next(request)
        
        # Calculate request duration
        duration = time.time() - start_time
        
        # Log slow requests
        if duration > self.slow_query_threshold:
            logging_service.warning(
                "Slow request detected",
                extra={
                    "path": request.url.path,
                    "method": request.method,
                    "duration": duration
                }
            )
        
        # Add performance headers
        response.headers["X-Request-Duration"] = str(duration)
        response.headers["X-DB-Pool-Status"] = json.dumps(
            db_optimizer.get_connection_pool_status()
        )
        
        return response 