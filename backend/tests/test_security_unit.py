import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from jose import JWTError
from app.core.security import (
    validate_password, verify_password, get_password_hash,
    create_access_token, create_refresh_token, verify_token,
    is_token_expired, check_password_history, update_password_history,
    track_login_attempt, is_account_locked
)
from app.models.user import User
from app.core.config import settings

@pytest.fixture
def mock_user():
    """Create a mock user for testing"""
    user = MagicMock(spec=User)
    user.password_history = []
    user.failed_login_attempts = 0
    user.account_locked_until = None
    user.last_login = None
    user.last_password_change = None
    return user

@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return MagicMock()

def test_validate_password_valid():
    """Test password validation with valid password"""
    valid_password = "SecurePass123!"
    is_valid, error = validate_password(valid_password)
    assert is_valid
    assert error == ""

def test_validate_password_too_short():
    """Test password validation with too short password"""
    short_password = "abc"
    is_valid, error = validate_password(short_password)
    assert not is_valid
    assert "at least" in error

def test_validate_password_no_special_chars():
    """Test password validation without special characters"""
    password = "SecurePass123"
    is_valid, error = validate_password(password)
    if settings.PASSWORD_REQUIRE_SPECIAL_CHARS:
        assert not is_valid
        assert "special character" in error
    else:
        assert is_valid

def test_validate_password_no_numbers():
    """Test password validation without numbers"""
    password = "SecurePass!"
    is_valid, error = validate_password(password)
    if settings.PASSWORD_REQUIRE_NUMBERS:
        assert not is_valid
        assert "number" in error
    else:
        assert is_valid

def test_validate_password_no_uppercase():
    """Test password validation without uppercase letters"""
    password = "securepass123!"
    is_valid, error = validate_password(password)
    if settings.PASSWORD_REQUIRE_UPPERCASE:
        assert not is_valid
        assert "uppercase" in error
    else:
        assert is_valid

def test_validate_password_no_lowercase():
    """Test password validation without lowercase letters"""
    password = "SECUREPASS123!"
    is_valid, error = validate_password(password)
    if settings.PASSWORD_REQUIRE_LOWERCASE:
        assert not is_valid
        assert "lowercase" in error
    else:
        assert is_valid

def test_verify_password_correct():
    """Test password verification with correct password"""
    plain_password = "testpassword123"
    hashed_password = get_password_hash(plain_password)
    assert verify_password(plain_password, hashed_password)

def test_verify_password_incorrect():
    """Test password verification with incorrect password"""
    plain_password = "testpassword123"
    wrong_password = "wrongpassword123"
    hashed_password = get_password_hash(plain_password)
    assert not verify_password(wrong_password, hashed_password)

def test_get_password_hash():
    """Test password hashing"""
    password = "testpassword123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert len(hashed) > len(password)

def test_create_access_token_default_expiry():
    """Test creating access token with default expiry"""
    subject = "test_user_id"
    token = create_access_token(subject)
    assert token is not None
    assert len(token) > 0

def test_create_access_token_custom_expiry():
    """Test creating access token with custom expiry"""
    subject = "test_user_id"
    custom_expiry = timedelta(hours=2)
    token = create_access_token(subject, custom_expiry)
    assert token is not None
    assert len(token) > 0

def test_create_refresh_token_default_expiry():
    """Test creating refresh token with default expiry"""
    subject = "test_user_id"
    token = create_refresh_token(subject)
    assert token is not None
    assert len(token) > 0

def test_create_refresh_token_custom_expiry():
    """Test creating refresh token with custom expiry"""
    subject = "test_user_id"
    custom_expiry = timedelta(days=30)
    token = create_refresh_token(subject, custom_expiry)
    assert token is not None
    assert len(token) > 0

def test_verify_token_valid():
    """Test verifying valid token"""
    subject = "test_user_id"
    token = create_access_token(subject)
    payload = verify_token(token)
    assert payload is not None
    assert payload["sub"] == subject
    assert payload["type"] == "access"

def test_verify_token_invalid():
    """Test verifying invalid token"""
    invalid_token = "invalid.token.here"
    payload = verify_token(invalid_token)
    assert payload is None

def test_verify_token_expired():
    """Test verifying expired token"""
    subject = "test_user_id"
    expired_expiry = timedelta(seconds=-1)  # Already expired
    token = create_access_token(subject, expired_expiry)
    payload = verify_token(token)
    assert payload is None

def test_is_token_expired_valid():
    """Test checking if valid token is expired"""
    subject = "test_user_id"
    # Use a very large expiry to ensure token is not expired even with clock skew
    custom_expiry = timedelta(days=365)
    token = create_access_token(subject, custom_expiry)
    assert not is_token_expired(token)

def test_is_token_expired_expired():
    """Test checking if expired token is expired"""
    subject = "test_user_id"
    expired_expiry = timedelta(seconds=-1)  # Already expired
    token = create_access_token(subject, expired_expiry)
    assert is_token_expired(token)

def test_is_token_expired_invalid():
    """Test checking if invalid token is expired"""
    invalid_token = "invalid.token.here"
    assert is_token_expired(invalid_token)

def test_check_password_history_no_history(mock_user, mock_db):
    """Test password history check with no history"""
    mock_user.password_history = []
    new_password = "newpassword123"
    assert check_password_history(mock_db, mock_user, new_password)

def test_check_password_history_not_recent(mock_user, mock_db):
    """Test password history check with not recent password"""
    old_password = "oldpassword123"
    old_hash = get_password_hash(old_password)
    mock_user.password_history = [old_hash]
    new_password = "newpassword123"
    assert check_password_history(mock_db, mock_user, new_password)

def test_check_password_history_recent(mock_user, mock_db):
    """Test password history check with recent password"""
    old_password = "oldpassword123"
    old_hash = get_password_hash(old_password)
    mock_user.password_history = [old_hash]
    # Try to use the same password
    assert not check_password_history(mock_db, mock_user, old_password)

def test_update_password_history_empty(mock_user, mock_db):
    """Test updating password history with empty history"""
    mock_user.password_history = []
    new_password = "newpassword123"
    update_password_history(mock_db, mock_user, new_password)
    assert len(mock_user.password_history) == 1
    mock_db.commit.assert_called_once()

def test_update_password_history_existing(mock_user, mock_db):
    """Test updating password history with existing history"""
    old_password = "oldpassword123"
    old_hash = get_password_hash(old_password)
    mock_user.password_history = [old_hash]
    new_password = "newpassword123"
    update_password_history(mock_db, mock_user, new_password)
    assert len(mock_user.password_history) == 2
    mock_db.commit.assert_called_once()

def test_update_password_history_limit(mock_user, mock_db):
    """Test updating password history with limit exceeded"""
    # Create more passwords than the limit
    mock_user.password_history = []
    for i in range(settings.PASSWORD_HISTORY_SIZE + 2):
        password = f"password{i}"
        hash_val = get_password_hash(password)
        mock_user.password_history.append(hash_val)
    
    new_password = "newpassword123"
    update_password_history(mock_db, mock_user, new_password)
    assert len(mock_user.password_history) == settings.PASSWORD_HISTORY_SIZE
    mock_db.commit.assert_called_once()

def test_track_login_attempt_success(mock_user, mock_db):
    """Test tracking successful login attempt"""
    mock_user.failed_login_attempts = 3
    mock_user.account_locked_until = datetime.utcnow() + timedelta(minutes=30)
    
    track_login_attempt(mock_db, mock_user, True)
    
    assert mock_user.failed_login_attempts == 0
    assert mock_user.account_locked_until is None
    assert mock_user.last_login is not None
    mock_db.commit.assert_called_once()

def test_track_login_attempt_failure(mock_user, mock_db):
    """Test tracking failed login attempt"""
    initial_attempts = mock_user.failed_login_attempts
    
    track_login_attempt(mock_db, mock_user, False)
    
    assert mock_user.failed_login_attempts == initial_attempts + 1
    assert mock_user.account_locked_until is None
    mock_db.commit.assert_called_once()

def test_track_login_attempt_max_failures(mock_user, mock_db):
    """Test tracking login attempt that exceeds max failures"""
    mock_user.failed_login_attempts = settings.MAX_LOGIN_ATTEMPTS - 1
    
    track_login_attempt(mock_db, mock_user, False)
    
    assert mock_user.failed_login_attempts == settings.MAX_LOGIN_ATTEMPTS
    assert mock_user.account_locked_until is not None
    mock_db.commit.assert_called_once()

def test_is_account_locked_not_locked(mock_user):
    """Test checking if account is not locked"""
    mock_user.account_locked_until = None
    assert not is_account_locked(mock_user)

def test_is_account_locked_locked(mock_user):
    """Test checking if account is locked"""
    mock_user.account_locked_until = datetime.utcnow() + timedelta(minutes=30)
    assert is_account_locked(mock_user)

def test_is_account_locked_expired(mock_user):
    """Test checking if account lock has expired"""
    mock_user.account_locked_until = datetime.utcnow() - timedelta(minutes=30)
    mock_user.failed_login_attempts = 5
    
    assert not is_account_locked(mock_user)
    assert mock_user.account_locked_until is None
    assert mock_user.failed_login_attempts == 0 