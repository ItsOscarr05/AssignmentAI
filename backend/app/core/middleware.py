from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Dict, List
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT = 100  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, List[float]] = {}

    def is_rate_limited(self, client_ip: str) -> bool:
        current_time = time.time()
        
        # Clean up old requests
        if client_ip in self.requests:
            self.requests[client_ip] = [
                req_time for req_time in self.requests[client_ip]
                if current_time - req_time < RATE_LIMIT_WINDOW
            ]
        else:
            self.requests[client_ip] = []

        # Check if rate limit is exceeded
        if len(self.requests[client_ip]) >= RATE_LIMIT:
            return True

        # Add current request
        self.requests[client_ip].append(current_time)
        return False

rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    
    if rate_limiter.is_rate_limited(client_ip):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests"}
        )
    
    return await call_next(request)

async def logging_middleware(request: Request, call_next):
    start_time = datetime.utcnow()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Client IP: {request.client.host}")
    
    try:
        response = await call_next(request)
        
        # Log response
        process_time = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"Response: {response.status_code} (Processed in {process_time:.2f}s)")
        
        return response
    except Exception as e:
        # Log error
        logger.error(f"Error processing request: {str(e)}")
        raise 