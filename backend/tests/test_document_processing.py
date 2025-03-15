import pytest
from httpx import AsyncClient
import os
from typing import AsyncGenerator
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import asyncio
from datetime import datetime

from models import Base, User, ExternalDocument
from database import get_db
from document_processor import DocumentProcessor
from document_routes import router as document_router
from config import settings

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Create test engine
engine = create_async_engine(TEST_DATABASE_URL, echo=True)
TestingSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Test app
app = FastAPI()
app.include_router(document_router)

@pytest.fixture
async def test_db() -> AsyncGenerator:
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Create test session
    async with TestingSessionLocal() as session:
        yield session

    # Clean up
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def test_client(test_db) -> AsyncGenerator:
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def test_user(test_db) -> User:
    user = User(
        email="test@example.com",
        hashed_password="test_hash",
        full_name="Test User"
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user

@pytest.mark.asyncio
async def test_document_processor_url_validation():
    # Test valid URLs
    assert DocumentProcessor.validate_url("https://example.com/doc.pdf") == True
    assert DocumentProcessor.validate_url("http://test.org/file.docx") == True
    
    # Test invalid URLs
    assert DocumentProcessor.validate_url("not-a-url") == False
    assert DocumentProcessor.validate_url("") == False

@pytest.mark.asyncio
async def test_create_document(test_client, test_user):
    # Mock authentication
    app.dependency_overrides["get_current_user"] = lambda: test_user
    
    # Test document creation
    response = await test_client.post(
        "/documents/",
        json={
            "url": "https://example.com/test.pdf",
            "assignment_id": None
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://example.com/test.pdf"
    assert data["processed"] == True

@pytest.mark.asyncio
async def test_list_documents(test_client, test_user, test_db):
    # Create test document
    doc = ExternalDocument(
        url="https://example.com/test.pdf",
        title="test.pdf",
        content_type="pdf",
        processed=True,
        user_id=test_user.id
    )
    test_db.add(doc)
    await test_db.commit()
    
    # Mock authentication
    app.dependency_overrides["get_current_user"] = lambda: test_user
    
    # Test listing documents
    response = await test_client.get("/documents/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["url"] == "https://example.com/test.pdf"

@pytest.mark.asyncio
async def test_get_document(test_client, test_user, test_db):
    # Create test document
    doc = ExternalDocument(
        url="https://example.com/test.pdf",
        title="test.pdf",
        content_type="pdf",
        processed=True,
        user_id=test_user.id
    )
    test_db.add(doc)
    await test_db.commit()
    await test_db.refresh(doc)
    
    # Mock authentication
    app.dependency_overrides["get_current_user"] = lambda: test_user
    
    # Test getting document
    response = await test_client.get(f"/documents/{doc.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://example.com/test.pdf"
    assert data["id"] == doc.id

@pytest.mark.asyncio
async def test_error_handling(test_client, test_user):
    # Mock authentication
    app.dependency_overrides["get_current_user"] = lambda: test_user
    
    # Test invalid URL
    response = await test_client.post(
        "/documents/",
        json={
            "url": "not-a-url",
            "assignment_id": None
        }
    )
    assert response.status_code == 400
    assert "Invalid URL format" in response.json()["error"]
    
    # Test non-existent document
    response = await test_client.get("/documents/999")
    assert response.status_code == 404
    assert "Document not found" in response.json()["error"] 