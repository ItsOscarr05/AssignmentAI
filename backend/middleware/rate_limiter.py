from fastapi import Request, status
from fastapi.responses import JSONResponse
import time
from collections import defaultdict
import threading
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(
        self,
        requests_per_minute: int = 60,
        burst_limit: int = 100,
        cleanup_interval: int = 300
    ):
        self.requests_per_minute = requests_per_minute
        self.burst_limit = burst_limit
        self.cleanup_interval = cleanup_interval
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = threading.Lock()
        
        # Start cleanup thread
        cleanup_thread = threading.Thread(target=self._cleanup_old_requests, daemon=True)
        cleanup_thread.start()

    def _cleanup_old_requests(self):
        while True:
            time.sleep(self.cleanup_interval)
            current_time = time.time()
            with self.lock:
                for ip in list(self.requests.keys()):
                    # Remove requests older than 1 minute
                    self.requests[ip] = [
                        req_time for req_time in self.requests[ip]
                        if current_time - req_time < 60
                    ]
                    # Remove IP if no requests
                    if not self.requests[ip]:
                        del self.requests[ip]

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0]
        return request.client.host if request.client else "unknown"

    async def check_rate_limit(self, request: Request) -> Tuple[bool, int]:
        ip = self._get_client_ip(request)
        current_time = time.time()

        with self.lock:
            # Remove old requests
            self.requests[ip] = [
                req_time for req_time in self.requests[ip]
                if current_time - req_time < 60
            ]

            # Check burst limit
            if len(self.requests[ip]) >= self.burst_limit:
                logger.warning(f"Burst limit exceeded for IP: {ip}")
                return False, 0

            # Check rate limit
            if len(self.requests[ip]) >= self.requests_per_minute:
                logger.warning(f"Rate limit exceeded for IP: {ip}")
                return False, int(60 - (current_time - self.requests[ip][0]))

            # Add new request
            self.requests[ip].append(current_time)
            return True, 0

async def rate_limit_middleware(
    request: Request,
    call_next,
    limiter: RateLimiter = RateLimiter()
):
    is_allowed, retry_after = await limiter.check_rate_limit(request)
    
    if not is_allowed:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate limit exceeded",
                "retry_after": retry_after
            },
            headers={"Retry-After": str(retry_after)}
        )
    
    return await call_next(request) 