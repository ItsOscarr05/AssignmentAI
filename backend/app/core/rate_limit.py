from datetime import datetime, timedelta
from typing import Dict, Tuple
from fastapi import HTTPException
from app.core.config import settings

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = {}

    def is_rate_limited(self, client_id: str) -> Tuple[bool, int]:
        """
        Check if a client is rate limited.
        Returns (is_limited, remaining_requests)
        """
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)

        # Get or initialize client's request history
        if client_id not in self.requests:
            self.requests[client_id] = []

        # Remove old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > minute_ago
        ]

        # Check if rate limit is exceeded
        if len(self.requests[client_id]) >= settings.RATE_LIMIT_PER_MINUTE:
            return True, 0

        # Add current request
        self.requests[client_id].append(now)
        
        # Calculate remaining requests
        remaining = settings.RATE_LIMIT_PER_MINUTE - len(self.requests[client_id])
        return False, remaining

    def get_headers(self, client_id: str) -> Dict[str, str]:
        """
        Get rate limit headers for the response.
        """
        is_limited, remaining = self.is_rate_limited(client_id)
        return {
            "X-RateLimit-Limit": str(settings.RATE_LIMIT_PER_MINUTE),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(
                int((datetime.utcnow() + timedelta(minutes=1)).timestamp())
            )
        }

rate_limiter = RateLimiter()

def check_rate_limit(client_id: str):
    """
    Decorator to check rate limit before processing a request.
    """
    is_limited, remaining = rate_limiter.is_rate_limited(client_id)
    if is_limited:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
    return remaining 