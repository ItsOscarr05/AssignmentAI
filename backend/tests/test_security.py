import pytest
from fastapi.testclient import TestClient
from main import app
from security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
    SecurityConfig,
    SecurityManager,
    create_encryption_key,
    encrypt_data,
    decrypt_data
)
from datetime import timedelta
import jwt
from config import settings
import os
import base64
from cryptography.fernet import Fernet

client = TestClient(app)

@pytest.fixture
def security_manager():
    """Fixture for SecurityManager instance"""
    config = SecurityConfig(
        secret_key=create_encryption_key(),
        algorithm="HS256",
        access_token_expire_minutes=30,
        refresh_token_expire_days=7,
        password_min_length=8,
        max_login_attempts=5,
        lockout_duration_minutes=30
    )
    return SecurityManager(config)

def test_login_success():
    """Test successful login with correct credentials"""
    response = client.post(
        "/api/token",
        data={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_failure():
    """Test login failure with incorrect credentials"""
    response = client.post(
        "/api/token",
        data={"username": "admin", "password": "wrong_password"}
    )
    assert response.status_code == 401
    assert "detail" in response.json()

def test_protected_route_without_token():
    """Test accessing protected route without token"""
    response = client.post(
        "/api/assignments",
        json={
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_protected_route_with_token():
    """Test accessing protected route with valid token"""
    access_token = create_access_token(
        data={"sub": "admin", "scopes": ["admin"]},
        expires_delta=timedelta(minutes=30)
    )
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.post(
        "/api/assignments",
        headers=headers,
        json={
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }
    )
    assert response.status_code == 200
    assert "id" in response.json()

def test_expired_token():
    """Test accessing protected route with expired token"""
    access_token = create_access_token(
        data={"sub": "admin", "scopes": ["admin"]},
        expires_delta=timedelta(minutes=-1)
    )
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 401
    assert "detail" in response.json()

def test_invalid_token():
    """Test accessing protected route with invalid token"""
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 401
    assert "detail" in response.json()

def test_role_based_access():
    """Test role-based access control"""
    student_token = create_access_token(
        data={"sub": "student", "scopes": ["student"]},
        expires_delta=timedelta(minutes=30)
    )
    
    teacher_token = create_access_token(
        data={"sub": "teacher", "scopes": ["teacher"]},
        expires_delta=timedelta(minutes=30)
    )
    
    headers_student = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/assignments",
        headers=headers_student,
        json={
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }
    )
    assert response.status_code == 403
    
    headers_teacher = {"Authorization": f"Bearer {teacher_token}"}
    response = client.post(
        "/api/assignments",
        headers=headers_teacher,
        json={
            "subject": "mathematics",
            "grade_level": "high_school",
            "assignment_text": "Test assignment"
        }
    )
    assert response.status_code == 200

def test_security_headers():
    """Test security headers are present in response"""
    response = client.get("/")
    headers = response.headers
    
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert "Content-Security-Policy" in headers

def test_rate_limiting():
    """Test rate limiting functionality"""
    responses = []
    for _ in range(settings.RATE_LIMIT_MAX_REQUESTS + 1):
        response = client.get("/")
        responses.append(response.status_code)
    
    assert 429 in responses

def test_token_refresh():
    """Test token refresh functionality"""
    response = client.post(
        "/api/token",
        data={"username": "admin", "password": "admin"}
    )
    assert response.status_code == 200
    
    access_token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 200

# New test cases for 100% coverage

def test_password_hashing():
    """Test password hashing and verification"""
    password = "test_password"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)

def test_encryption_key_creation():
    """Test encryption key creation and format"""
    key = create_encryption_key()
    assert len(base64.b64decode(key)) == 32
    assert isinstance(key, str)

def test_data_encryption_decryption(security_manager):
    """Test data encryption and decryption"""
    data = "sensitive_data"
    encrypted = security_manager.encrypt_data(data)
    decrypted = security_manager.decrypt_data(encrypted)
    assert decrypted == data
    
    # Test invalid data
    with pytest.raises(Exception):
        security_manager.decrypt_data("invalid_encrypted_data")

def test_token_validation():
    """Test token validation with various scenarios"""
    # Test valid token
    token = create_access_token(
        data={"sub": "test_user", "scopes": ["user"]},
        expires_delta=timedelta(minutes=30)
    )
    user = get_current_user(token)
    assert user["sub"] == "test_user"
    
    # Test invalid signature
    invalid_token = token[:-1] + ("1" if token[-1] == "0" else "0")
    with pytest.raises(jwt.InvalidTokenError):
        get_current_user(invalid_token)
    
    # Test missing required claims
    incomplete_token = create_access_token(
        data={"missing_sub": "test_user"},
        expires_delta=timedelta(minutes=30)
    )
    with pytest.raises(jwt.InvalidTokenError):
        get_current_user(incomplete_token)

def test_security_config_validation():
    """Test security configuration validation"""
    # Test valid config
    valid_config = SecurityConfig(
        secret_key=create_encryption_key(),
        algorithm="HS256",
        access_token_expire_minutes=30,
        refresh_token_expire_days=7,
        password_min_length=8,
        max_login_attempts=5,
        lockout_duration_minutes=30
    )
    assert valid_config.algorithm == "HS256"
    
    # Test invalid algorithm
    with pytest.raises(ValueError):
        SecurityConfig(
            secret_key=create_encryption_key(),
            algorithm="INVALID",
            access_token_expire_minutes=30,
            refresh_token_expire_days=7,
            password_min_length=8,
            max_login_attempts=5,
            lockout_duration_minutes=30
        )

def test_security_manager_initialization():
    """Test SecurityManager initialization and configuration"""
    config = SecurityConfig(
        secret_key=create_encryption_key(),
        algorithm="HS256",
        access_token_expire_minutes=30,
        refresh_token_expire_days=7,
        password_min_length=8,
        max_login_attempts=5,
        lockout_duration_minutes=30
    )
    manager = SecurityManager(config)
    
    assert manager.config.algorithm == "HS256"
    assert manager.config.access_token_expire_minutes == 30
    assert isinstance(manager.fernet, Fernet)

def test_login_attempt_tracking():
    """Test login attempt tracking and lockout"""
    username = "test_user"
    manager = security_manager()
    
    # Test failed attempts
    for _ in range(manager.config.max_login_attempts - 1):
        assert not manager.is_account_locked(username)
        manager.record_failed_attempt(username)
    
    # Test lockout
    manager.record_failed_attempt(username)
    assert manager.is_account_locked(username)
    
    # Test reset
    manager.reset_login_attempts(username)
    assert not manager.is_account_locked(username)

def test_password_validation():
    """Test password validation rules"""
    manager = security_manager()
    
    # Test valid password
    assert manager.validate_password("StrongPass123!")
    
    # Test too short
    assert not manager.validate_password("short")
    
    # Test missing requirements
    assert not manager.validate_password("onlylowercase")
    assert not manager.validate_password("ONLYUPPERCASE")
    assert not manager.validate_password("123456789")
    
    # Test common passwords
    assert not manager.validate_password("password123")
    assert not manager.validate_password("admin123")

if __name__ == "__main__":
    pytest.main(["-v", "test_security.py"]) 