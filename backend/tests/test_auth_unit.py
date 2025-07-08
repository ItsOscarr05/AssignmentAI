import pytest
from unittest.mock import MagicMock, patch
from datetime import timedelta, datetime
from jose import jwt
from fastapi import HTTPException
from app.auth import create_access_token, get_current_user
from app.models.user import User
from app.core.config import settings
import asyncio

@pytest.fixture
def mock_db():
    db = MagicMock()
    return db

@pytest.fixture
def user():
    user = MagicMock(spec=User)
    user.email = "test@example.com"
    return user

def test_create_access_token_with_and_without_expiry():
    data = {"sub": "test@example.com"}
    # With expires_delta
    token = create_access_token(data, expires_delta=timedelta(minutes=30))
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "test@example.com"
    assert "exp" in decoded
    # Without expires_delta
    token2 = create_access_token(data)
    decoded2 = jwt.decode(token2, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded2["sub"] == "test@example.com"
    assert "exp" in decoded2

async def test_get_current_user_valid(monkeypatch, user, mock_db):
    # Create a valid token
    token = create_access_token({"sub": user.email})
    # Patch db.query(User).filter().first() to return user
    mock_query = MagicMock()
    mock_filter = MagicMock()
    mock_query.filter.return_value = mock_filter
    mock_filter.first.return_value = user
    mock_db.query.return_value = mock_query
    # Patch Depends to just pass the token and db
    result = await get_current_user(token=token, db=mock_db)
    assert result == user

async def test_get_current_user_invalid_token(monkeypatch, mock_db):
    # Invalid token
    token = "invalid.token.value"
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=token, db=mock_db)
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in str(exc_info.value.detail)

async def test_get_current_user_missing_sub(monkeypatch, mock_db):
    # Token with no sub
    payload = {"foo": "bar"}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=token, db=mock_db)
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in str(exc_info.value.detail)

async def test_get_current_user_user_not_found(monkeypatch, mock_db):
    # Valid token, but user not found
    email = "notfound@example.com"
    token = create_access_token({"sub": email})
    mock_query = MagicMock()
    mock_filter = MagicMock()
    mock_query.filter.return_value = mock_filter
    mock_filter.first.return_value = None
    mock_db.query.return_value = mock_query
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token=token, db=mock_db)
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in str(exc_info.value.detail) 