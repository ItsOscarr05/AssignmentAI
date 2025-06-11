from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
import time
from redis import asyncio as aioredis

class RateLimitExceeded(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=429, detail=detail)

class RateLimiter:
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
        self.rate_limit = settings.RATE_LIMIT_PER_MINUTE
        self.window = 60  # 1 minute window

    async def check_rate_limit(self, request: Request) -> bool:
        """Check if the request is within rate limits."""
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        # Get current count
        current = await self.redis.get(key)
        
        if current is None:
            # First request in the window
            await self.redis.setex(key, self.window, 1)
            return True
            
        current = int(current)
        if current >= self.rate_limit:
            return False
            
        # Increment counter
        await self.redis.incr(key)
        return True

    def get_endpoint_type(self, path: str) -> str:
        """Determine the type of endpoint based on the path."""
        for endpoint_type, patterns in self.endpoint_patterns.items():
            if any(path.startswith(pattern) for pattern in patterns):
                return endpoint_type
        return "api"  # Default to general API rate limit

    def is_rate_limited(self, client_id: str, path: str) -> bool:
        """Check if a client has exceeded their rate limit."""
        endpoint_type = self.get_endpoint_type(path)
        limits = self.endpoint_limits[endpoint_type]
        
        # Initialize or reset counters if needed
        if client_id not in self.requests:
            self.requests[client_id] = {}
        if endpoint_type not in self.requests[client_id]:
            self.requests[client_id][endpoint_type] = 0
        if client_id not in self.reset_times:
            self.reset_times[client_id] = datetime.now()

        # Check if we need to reset the counter
        if datetime.now() > self.reset_times[client_id] + timedelta(minutes=limits["period"]):
            self.requests[client_id][endpoint_type] = 0
            self.reset_times[client_id] = datetime.now()

        # Increment request count
        self.requests[client_id][endpoint_type] += 1

        # Check if limit exceeded
        return self.requests[client_id][endpoint_type] > limits["requests"]

    def get_remaining_requests(self, client_id: str, path: str) -> int:
        """Get the number of remaining requests for a client."""
        endpoint_type = self.get_endpoint_type(path)
        limits = self.endpoint_limits[endpoint_type]
        
        if client_id not in self.requests or endpoint_type not in self.requests[client_id]:
            return limits["requests"]
            
        return max(0, limits["requests"] - self.requests[client_id][endpoint_type])

    def get_reset_time(self, client_id: str) -> Optional[datetime]:
        """Get the time when the rate limit will reset."""
        if client_id not in self.reset_times:
            return None
        return self.reset_times[client_id] + timedelta(minutes=settings.RATE_LIMIT_PERIOD)

    def reset_client_limits(self, client_id: str) -> None:
        if client_id in self.requests:
            del self.requests[client_id]
        if client_id in self.reset_times:
            del self.reset_times[client_id]

    def check_login_attempts(self, client_id: str, username: str) -> None:
        now = datetime.utcnow()
        
        # Check if account is locked
        if username in self.locked_accounts:
            lockout_end = self.locked_accounts[username]
            if now < lockout_end:
                raise HTTPException(
                    status_code=429,
                    detail=f"Account is locked. Try again after {lockout_end}"
                )
            else:
                del self.locked_accounts[username]

        # Initialize login attempts for this client
        if client_id not in self.login_attempts:
            self.login_attempts[client_id] = {}

        # Initialize or update login attempts for this username
        if username not in self.login_attempts[client_id]:
            self.login_attempts[client_id][username] = 0

        self.login_attempts[client_id][username] += 1

        # Check if max attempts exceeded
        if self.login_attempts[client_id][username] >= settings.MAX_LOGIN_ATTEMPTS:
            lockout_duration = settings.LOGIN_TIMEOUT_MINUTES
            self.locked_accounts[username] = now + timedelta(minutes=lockout_duration)
            raise HTTPException(
                status_code=429,
                detail=f"Too many login attempts. Account locked for {lockout_duration} minutes."
            )

    def check_2fa_attempts(self, client_id: str, username: str) -> None:
        now = datetime.utcnow()
        
        # Initialize 2FA attempts for this client
        if client_id not in self.two_factor_attempts:
            self.two_factor_attempts[client_id] = {}

        # Initialize or update 2FA attempts for this username
        if username not in self.two_factor_attempts[client_id]:
            self.two_factor_attempts[client_id][username] = {
                'count': 0,
                'last_attempt': now,
                'backoff_minutes': 1
            }

        attempts = self.two_factor_attempts[client_id][username]
        
        # Check if we need to reset the backoff
        if (now - attempts['last_attempt']) > timedelta(minutes=attempts['backoff_minutes'] * 2):
            attempts['count'] = 0
            attempts['backoff_minutes'] = 1

        attempts['count'] += 1
        attempts['last_attempt'] = now

        # Apply exponential backoff
        if attempts['count'] > 3:
            attempts['backoff_minutes'] *= 2
            raise HTTPException(
                status_code=429,
                detail=f"Too many 2FA attempts. Please wait {attempts['backoff_minutes']} minutes before trying again."
            )

    def reset_2fa_attempts(self, client_id: str, username: str) -> None:
        if client_id in self.two_factor_attempts and username in self.two_factor_attempts[client_id]:
            del self.two_factor_attempts[client_id][username]

    def check_rate_limit(self, client_id: str) -> None:
        """Check if the client has exceeded the rate limit"""
        if self.is_rate_limited(client_id, ""):
            raise RateLimitExceeded("Rate limit exceeded")

    def increment_request_count(self, client_id: str) -> None:
        """Increment the request count for a client"""
        now = datetime.utcnow()
        if client_id not in self.requests:
            self.requests[client_id] = {}
        if "" not in self.requests[client_id]:
            self.requests[client_id][""] = 0
        self.requests[client_id][""] += 1

    def reset_rate_limit(self, client_id: str) -> None:
        """Reset the rate limit for a client"""
        if client_id in self.requests:
            del self.requests[client_id]

    def get_remaining_requests(self, client_id: str) -> tuple[int, int]:
        """Get the number of remaining requests and time until reset"""
        remaining = self.get_remaining_requests(client_id, "")
        reset_time = self.get_reset_time(client_id)
        ttl = 0
        if reset_time:
            ttl = int((reset_time - datetime.utcnow()).total_seconds())
        return remaining, ttl

# Create a global rate limiter instance
rate_limiter = RateLimiter()

def check_rate_limit(client_id: str) -> None:
    """
    Check if a client has exceeded the rate limit.
    Raises HTTPException if rate limit is exceeded.
    """
    if rate_limiter.is_rate_limited(client_id, ""):
        reset_time = rate_limiter.get_reset_time(client_id)
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Try again after {reset_time}"
        )

async def rate_limit_middleware(request: Request, call_next):
    """Middleware to handle rate limiting."""
    if not hasattr(request.app.state, "rate_limiter"):
        redis_client = aioredis.from_url(settings.REDIS_URL)
        request.app.state.rate_limiter = RateLimiter(redis_client)
    
    if not await request.app.state.rate_limiter.check_rate_limit(request):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
    
    return await call_next(request) 