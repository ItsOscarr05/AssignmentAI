from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
import time
from redis import asyncio as aioredis
import logging

logger = logging.getLogger(__name__)

class RateLimitExceeded(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=429, detail=detail)

class RateLimiter:
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
        self.rate_limit = settings.RATE_LIMIT_PER_MINUTE
        self.window = 60  # 1 minute window
        # Add missing attributes for in-memory rate limiting
        self.endpoint_patterns = {
            "api": ["/api/"],
            "auth": ["/auth/"],
            "admin": ["/admin/"]
        }
        self.endpoint_limits = {
            "api": {"requests": 100, "period": 1},
            "auth": {"requests": 5, "period": 1},
            "admin": {"requests": 50, "period": 1}
        }
        self.requests = {}
        self.reset_times = {}
        self.locked_accounts = {}
        self.login_attempts = {}
        self.two_factor_attempts = {}

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

    def get_remaining_requests(self, client_id: str, path: str = "") -> int:
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

    def get_remaining_requests_and_ttl(self, client_id: str) -> tuple[int, int]:
        """Get the number of remaining requests and time until reset"""
        remaining = self.get_remaining_requests(client_id)
        reset_time = self.get_reset_time(client_id)
        ttl = 0
        if reset_time:
            ttl = int((reset_time - datetime.utcnow()).total_seconds())
        return remaining, ttl

# Remove any global 'rate_limiter' variable or export. All access should be via get_rate_limiter().
# If any code tries to import 'rate_limiter' from this module, it should be updated to use get_rate_limiter().
# No code output needed here, just a reminder for the rest of the codebase.

async def init_rate_limiter():
    """Initialize the rate limiter"""
    global _rate_limiter
    try:
        redis_client = aioredis.from_url(settings.REDIS_URL)
        _rate_limiter = RateLimiter(redis_client)
    except Exception as e:
        logger.warning(f"Failed to initialize Redis rate limiter: {e}")
        _rate_limiter = FallbackRateLimiter()

async def close_rate_limiter():
    """Close the rate limiter"""
    global _rate_limiter
    if _rate_limiter and hasattr(_rate_limiter, 'redis'):
        await _rate_limiter.redis.close()

# Global fallback rate limiter instance
_fallback_rate_limiter = None

def get_rate_limiter(app=None):
    global _rate_limiter, _fallback_rate_limiter
    if app is not None:
        if not hasattr(app.state, "fallback_rate_limiter"):
            app.state.fallback_rate_limiter = FallbackRateLimiter()
        return app.state.fallback_rate_limiter
    if _rate_limiter is not None:
        return _rate_limiter
    if _fallback_rate_limiter is None:
        _fallback_rate_limiter = FallbackRateLimiter()
    return _fallback_rate_limiter

class FallbackRateLimiter:
    # Use class-level dictionaries to persist state across all instances
    requests = {}
    reset_times = {}

    def __init__(self):
        self.endpoint_limits = {
            "auth": {"requests": 3, "period": 1},  # 3 requests per minute for auth
            "api": {"requests": 100, "period": 1},
            "admin": {"requests": 50, "period": 1}
        }
    
    def get_endpoint_type(self, path: str) -> str:
        """Determine the type of endpoint based on the path."""
        if "/auth/" in path:
            return "auth"
        elif "/admin/" in path:
            return "admin"
        return "api"
    
    def is_rate_limited(self, client_id: str, path: str) -> bool:
        """Check if a client has exceeded their rate limit."""
        endpoint_type = self.get_endpoint_type(path)
        limits = self.endpoint_limits[endpoint_type]
        # Use class-level state
        if client_id not in FallbackRateLimiter.requests:
            FallbackRateLimiter.requests[client_id] = {}
        if endpoint_type not in FallbackRateLimiter.requests[client_id]:
            FallbackRateLimiter.requests[client_id][endpoint_type] = 0
        if client_id not in FallbackRateLimiter.reset_times:
            FallbackRateLimiter.reset_times[client_id] = datetime.now()
        # Check if we need to reset the counter
        if datetime.now() > FallbackRateLimiter.reset_times[client_id] + timedelta(minutes=limits["period"]):
            FallbackRateLimiter.requests[client_id][endpoint_type] = 0
            FallbackRateLimiter.reset_times[client_id] = datetime.now()
        FallbackRateLimiter.requests[client_id][endpoint_type] += 1
        if FallbackRateLimiter.requests[client_id][endpoint_type] > limits["requests"]:
            return True
        return False

def check_rate_limit(client_id: str) -> None:
    """
    Check if a client has exceeded the rate limit.
    Raises HTTPException if rate limit is exceeded.
    """
    limiter = get_rate_limiter()
    if limiter.is_rate_limited(client_id, ""):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )

async def rate_limit_middleware(request: Request, call_next):
    """Middleware to handle rate limiting."""
    limiter = get_rate_limiter()
    
    if not await limiter.check_rate_limit(request):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
    
    return await call_next(request) 