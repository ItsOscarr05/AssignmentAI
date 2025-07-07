from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
from typing import Dict, Tuple
import asyncio
import os

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = {}
        self._cleanup_task = asyncio.create_task(self._cleanup_old_requests())

    async def _cleanup_old_requests(self):
        while True:
            current_time = time.time()
            for ip in list(self.requests.keys()):
                self.requests[ip] = [t for t in self.requests[ip] if current_time - t < 60]
                if not self.requests[ip]:
                    del self.requests[ip]
            await asyncio.sleep(60)

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting in test environment
        if os.getenv("TESTING") == "true":
            return await call_next(request)
            
        client_ip = request.client.host
        current_time = time.time()

        # Initialize request list for new IPs
        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # Clean old requests
        self.requests[client_ip] = [t for t in self.requests[client_ip] if current_time - t < 60]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": 60 - (current_time - self.requests[client_ip][0])
                }
            )

        # Add current request
        self.requests[client_ip].append(current_time)

        # Process the request
        response = await call_next(request)
        return response 