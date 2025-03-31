import pytest
from fastapi import status
from app.core.config import settings
from app.middleware.security import SecurityMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.performance import PerformanceMiddleware, QueryOptimizationMiddleware

def test_security_headers(client):
    """Test security headers are present in responses"""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    headers = response.headers
    assert "X-Content-Type-Options" in headers
    assert "X-Frame-Options" in headers
    assert "X-XSS-Protection" in headers
    assert "Strict-Transport-Security" in headers
    assert "Content-Security-Policy" in headers
    assert "Referrer-Policy" in headers
    assert "Permissions-Policy" in headers

def test_rate_limiting(client):
    """Test rate limiting middleware"""
    # Make multiple requests in quick succession
    for _ in range(settings.RATE_LIMIT_REQUESTS + 1):
        response = client.get("/")
    
    # The last request should be rate limited
    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Too many requests" in response.json()["detail"]

def test_rate_limiting_reset(client):
    """Test rate limiting reset after period"""
    # Make requests up to limit
    for _ in range(settings.RATE_LIMIT_REQUESTS):
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
    
    # Wait for rate limit period to reset
    import time
    time.sleep(settings.RATE_LIMIT_PERIOD + 1)
    
    # Should be able to make requests again
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK

def test_logging_middleware(client):
    """Test logging middleware"""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    # Logging middleware doesn't modify response, just logs
    # We can verify logs are created by checking log files

def test_performance_middleware(client):
    """Test performance middleware"""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    headers = response.headers
    assert "X-Request-Duration" in headers
    assert "X-DB-Pool-Status" in headers

def test_query_optimization_middleware(client):
    """Test query optimization middleware"""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    headers = response.headers
    assert "X-DB-Pool-Status" in headers
    # Verify pool status is valid JSON
    import json
    pool_status = json.loads(headers["X-DB-Pool-Status"])
    assert "pool_size" in pool_status
    assert "checkedin" in pool_status
    assert "overflow" in pool_status
    assert "checkedout" in pool_status

def test_cors_middleware(client):
    """Test CORS middleware"""
    # Test preflight request
    response = client.options(
        "/",
        headers={
            "Origin": settings.FRONTEND_URL,
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    headers = response.headers
    assert "Access-Control-Allow-Origin" in headers
    assert "Access-Control-Allow-Methods" in headers
    assert "Access-Control-Allow-Headers" in headers
    assert "Access-Control-Max-Age" in headers

def test_cors_origin_validation(client):
    """Test CORS origin validation"""
    # Test request from allowed origin
    response = client.get(
        "/",
        headers={"Origin": settings.FRONTEND_URL}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.headers["Access-Control-Allow-Origin"] == settings.FRONTEND_URL
    
    # Test request from disallowed origin
    response = client.get(
        "/",
        headers={"Origin": "http://malicious-site.com"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "Access-Control-Allow-Origin" not in response.headers

def test_error_handler_middleware(client):
    """Test error handler middleware"""
    # Test 404 error
    response = client.get("/nonexistent")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Not Found" in response.json()["detail"]
    
    # Test validation error
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={"invalid": "data"}
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "validation error" in response.json()["detail"].lower()

def test_file_size_limit_middleware(client):
    """Test file size limit middleware"""
    # Create a file larger than the limit
    large_file = b"x" * (settings.MAX_FILE_SIZE + 1)
    files = {
        "file": ("large_file.pdf", large_file, "application/pdf")
    }
    response = client.post(
        f"{settings.API_V1_STR}/submissions/upload",
        files=files
    )
    assert response.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    assert "File too large" in response.json()["detail"]

def test_file_type_validation(client):
    """Test file type validation"""
    # Test with allowed file type
    files = {
        "file": ("test.pdf", b"test content", "application/pdf")
    }
    response = client.post(
        f"{settings.API_V1_STR}/submissions/upload",
        files=files
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED  # Unauthorized because no token
    
    # Test with disallowed file type
    files = {
        "file": ("test.exe", b"test content", "application/x-msdownload")
    }
    response = client.post(
        f"{settings.API_V1_STR}/submissions/upload",
        files=files
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "File type not allowed" in response.json()["detail"]

def test_cache_middleware(client):
    """Test caching middleware"""
    # First request should not be cached
    response1 = client.get("/")
    assert response1.status_code == status.HTTP_200_OK
    assert "X-Cache" not in response1.headers
    
    # Second request should be cached
    response2 = client.get("/")
    assert response2.status_code == status.HTTP_200_OK
    assert response2.headers.get("X-Cache") == "HIT"
    
    # POST request should not be cached
    response3 = client.post("/")
    assert response3.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert "X-Cache" not in response3.headers 