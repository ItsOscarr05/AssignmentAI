import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.web_scraping import WebScrapingService
from fastapi import HTTPException

class MockAiohttpResponse:
    def __init__(self, status=200, text_data="", headers=None):
        self.status = status
        self._text_data = text_data
        self.headers = headers or {}
    async def __aenter__(self):
        return self
    async def __aexit__(self, exc_type, exc, tb):
        pass
    async def text(self):
        return self._text_data

@pytest.fixture
def web_scraping_service():
    service = WebScrapingService()
    service.session = MagicMock()
    return service

@pytest.mark.asyncio
async def test_extract_content_from_url_google_docs(web_scraping_service):
    url = "https://docs.google.com/document/d/1234567890abcdef/edit"
    mock_response = MockAiohttpResponse(status=200, text_data="Google Doc Content")
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service.extract_content_from_url(url)
    assert result['type'] == 'google-docs'
    assert result['content'] == "Google Doc Content"
    assert result['title'] == 'Google Document'

@pytest.mark.asyncio
async def test_extract_content_from_url_document(web_scraping_service):
    url = "https://example.com/document.pdf"
    mock_response = MockAiohttpResponse(status=200, text_data="PDF Content", headers={'content-type': 'application/pdf'})
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service.extract_content_from_url(url)
    assert result['type'] == 'document'
    assert 'PDF Content' in result['content']

@pytest.mark.asyncio
async def test_extract_content_from_url_webpage(web_scraping_service):
    url = "https://example.com/page"
    html = """
    <html>
        <head><title>Test Page</title></head>
        <body>
            <main>
                <h1>Hello World</h1>
                <p>This is test content.</p>
            </main>
        </body>
    </html>
    """
    mock_response = MockAiohttpResponse(status=200, text_data=html)
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service.extract_content_from_url(url)
    assert result['type'] == 'webpage'
    assert 'Hello World' in result['content']
    assert 'This is test content' in result['content']

@pytest.mark.asyncio
async def test_extract_content_from_url_error(web_scraping_service):
    url = "https://example.com/error"
    web_scraping_service.session.get.side_effect = Exception("Network error")
    with pytest.raises(HTTPException) as exc_info:
        await web_scraping_service.extract_content_from_url(url)
    assert exc_info.value.status_code == 400

def test_is_document_url(web_scraping_service):
    assert web_scraping_service._is_document_url("https://example.com/file.pdf") is True
    assert web_scraping_service._is_document_url("https://example.com/file.doc") is True
    assert web_scraping_service._is_document_url("https://example.com/file.txt") is True
    assert web_scraping_service._is_document_url("https://example.com/page.html") is False

@pytest.mark.asyncio
async def test_extract_google_docs_content_success(web_scraping_service):
    url = "https://docs.google.com/document/d/1234567890abcdef/edit"
    mock_response = MockAiohttpResponse(status=200, text_data="Google Doc Content")
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service._extract_google_docs_content(url)
    assert result['type'] == 'google-docs'
    assert result['content'] == "Google Doc Content"

@pytest.mark.asyncio
async def test_extract_google_docs_content_not_public(web_scraping_service):
    url = "https://docs.google.com/document/d/1234567890abcdef/edit"
    mock_response = MockAiohttpResponse(status=403)
    web_scraping_service.session.get.return_value = mock_response
    with pytest.raises(HTTPException) as exc_info:
        await web_scraping_service._extract_google_docs_content(url)
    assert exc_info.value.status_code == 400  # Service wraps as 400

@pytest.mark.asyncio
async def test_extract_google_docs_content_invalid_url(web_scraping_service):
    url = "https://docs.google.com/invalid/url"
    with pytest.raises(HTTPException) as exc_info:
        await web_scraping_service._extract_google_docs_content(url)
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_extract_document_content_success(web_scraping_service):
    url = "https://example.com/document.txt"
    mock_response = MockAiohttpResponse(status=200, text_data="Document Content", headers={'content-type': 'text/plain'})
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service._extract_document_content(url)
    assert result['type'] == 'document'
    assert result['content'] == "Document Content"

@pytest.mark.asyncio
async def test_extract_document_content_pdf(web_scraping_service):
    url = "https://example.com/document.pdf"
    mock_response = MockAiohttpResponse(status=200, text_data="PDF Content", headers={'content-type': 'application/pdf'})
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service._extract_document_content(url)
    assert result['type'] == 'document'
    assert 'PDF Content' in result['content']

@pytest.mark.asyncio
async def test_extract_document_content_error(web_scraping_service):
    url = "https://example.com/document.txt"
    web_scraping_service.session.get.side_effect = Exception("Network error")
    with pytest.raises(HTTPException) as exc_info:
        await web_scraping_service._extract_document_content(url)
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_extract_webpage_content_success(web_scraping_service):
    url = "https://example.com/page"
    html = """
    <html>
        <head><title>Test Page</title></head>
        <body>
            <main>
                <h1>Hello World</h1>
                <p>This is test content.</p>
            </main>
        </body>
    </html>
    """
    mock_response = MockAiohttpResponse(status=200, text_data=html)
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service._extract_webpage_content(url)
    assert result['type'] == 'webpage'
    assert 'Hello World' in result['content']
    assert 'This is test content' in result['content']

@pytest.mark.asyncio
async def test_extract_webpage_content_no_main_content(web_scraping_service):
    url = "https://example.com/page"
    html = """
    <html>
        <head><title>Test Page</title></head>
        <body>
            <script>alert('test')</script>
        </body>
    </html>
    """
    mock_response = MockAiohttpResponse(status=200, text_data=html)
    web_scraping_service.session.get.return_value = mock_response
    result = await web_scraping_service._extract_webpage_content(url)
    assert result['type'] == 'webpage'
    assert 'alert' not in result['content']

@pytest.mark.asyncio
async def test_extract_webpage_content_error(web_scraping_service):
    url = "https://example.com/page"
    web_scraping_service.session.get.side_effect = Exception("Network error")
    with pytest.raises(HTTPException) as exc_info:
        await web_scraping_service._extract_webpage_content(url)
    assert exc_info.value.status_code == 400

@pytest.mark.asyncio
async def test_validate_url_success(web_scraping_service):
    url = "https://example.com"
    mock_response = MockAiohttpResponse(status=200)
    web_scraping_service.session.head.return_value = mock_response
    result = await web_scraping_service.validate_url(url)
    assert result['valid'] is True

@pytest.mark.asyncio
async def test_validate_url_invalid_format(web_scraping_service):
    url = "not-a-url"
    result = await web_scraping_service.validate_url(url)
    assert result['valid'] is False
    assert 'Invalid URL format' in result['error']

@pytest.mark.asyncio
async def test_context_manager():
    service = WebScrapingService()
    async with service as s:
        assert s.session is not None
        assert hasattr(s.session, 'close')

def test_get_url_type(web_scraping_service):
    assert web_scraping_service._get_url_type("https://docs.google.com/doc") == "google-docs"
    assert web_scraping_service._get_url_type("https://example.com/file.pdf") == "document"
    assert web_scraping_service._get_url_type("https://example.com/page") == "webpage" 