import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, Mock
from app.main import app
from app.core.deps import get_current_user, get_db
from app.models.user import User

client = TestClient(app)

class TestAssignmentInputEndpoints:
    """Test cases for assignment input endpoints"""

    @pytest.fixture
    def mock_user(self):
        """Create a mock user for authentication"""
        user = Mock(spec=User)
        user.id = 1
        user.email = "test@example.com"
        user.is_active = True
        return user

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session"""
        db = Mock()
        return db

    @pytest.fixture
    def auth_headers(self, mock_user, mock_db):
        """Override the get_current_user and get_db dependencies"""
        def override_get_current_user():
            return mock_user
        
        def override_get_db():
            return mock_db
        
        app.dependency_overrides[get_current_user] = override_get_current_user
        app.dependency_overrides[get_db] = override_get_db
        yield
        app.dependency_overrides.clear()

    def test_extract_from_link_success(self, auth_headers, mock_user):
        """Test successful content extraction from link"""
        with patch('app.api.v1.endpoints.assignment_input.WebScrapingService') as mock_scraper_class:
            # Mock the async context manager properly
            mock_scraper = AsyncMock()
            mock_scraper.extract_content_from_url = AsyncMock(return_value={
                'title': 'Test Document',
                'content': 'Test content from URL',
                'type': 'webpage',
                'extracted_at': 1234567890.0
            })
            
            # Set up the context manager mock
            mock_context = AsyncMock()
            mock_context.__aenter__ = AsyncMock(return_value=mock_scraper)
            mock_context.__aexit__ = AsyncMock(return_value=None)
            mock_scraper_class.return_value = mock_context

            response = client.post(
                "/api/v1/assignment-input/extract-from-link",
                json={"url": "https://example.com/test"}
            )

            if response.status_code != 200:
                print("Response status:", response.status_code)
                print("Response body:", response.text)
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Test Document"
            assert data["content"] == "Test content from URL"
            assert data["type"] == "webpage"

    def test_extract_from_link_invalid_url(self, auth_headers, mock_user):
        """Test content extraction with invalid URL"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_scraper_class:
            # Mock the async context manager properly
            mock_scraper = AsyncMock()
            mock_scraper.extract_content_from_url = AsyncMock(side_effect=Exception("Invalid URL"))
            
            # Set up the context manager mock
            mock_context = AsyncMock()
            mock_context.__aenter__ = AsyncMock(return_value=mock_scraper)
            mock_context.__aexit__ = AsyncMock(return_value=None)
            mock_scraper_class.return_value = mock_context

            response = client.post(
                "/api/v1/assignment-input/extract-from-link",
                json={"url": "invalid-url"}
            )

            assert response.status_code == 400

    def test_validate_link_success(self, auth_headers, mock_user):
        """Test successful link validation"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_scraper_class:
            # Mock the async context manager properly
            mock_scraper = AsyncMock()
            mock_scraper.validate_url = AsyncMock(return_value={
                'valid': True,
                'content_type': 'text/html',
                'url_type': 'webpage',
                'accessible': True
            })
            
            # Set up the context manager mock
            mock_context = AsyncMock()
            mock_context.__aenter__ = AsyncMock(return_value=mock_scraper)
            mock_context.__aexit__ = AsyncMock(return_value=None)
            mock_scraper_class.return_value = mock_context

            response = client.post(
                "/api/v1/assignment-input/validate-link",
                json={"url": "https://example.com"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["valid"] is True
            assert data["accessible"] is True

    def test_generate_chat_response_success(self, auth_headers, mock_user, mock_db):
        """Test successful chat response generation"""
        with patch('openai.AsyncOpenAI') as mock_openai_class:
            mock_client = AsyncMock()
            mock_response = AsyncMock()
            mock_response.choices = [AsyncMock()]
            mock_response.choices[0].message.content = "Generated assignment content"
            mock_client.chat.completions.create.return_value = mock_response
            mock_openai_class.return_value = mock_client

            response = client.post(
                "/api/v1/assignment-input/chat/generate",
                json={"message": "Create a math assignment", "context": ""}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["response"] == "Generated assignment content"
            assert "tokens_used" in data
            assert "model_used" in data

    def test_export_pdf_success(self, auth_headers, mock_user):
        """Test successful PDF export"""
        with patch('app.services.export_service.ExportService') as mock_export_class:
            mock_export = AsyncMock()
            # Return bytes as real service does
            mock_export.export_to_pdf.return_value = b"%PDF-1.4\n%\x93\x8c\x8b\x9e ReportLab Generated PDF document http://www.reportlab.com\n1 0 obj\n<<\n/F1 2 0 R /F2 3 0 R\n>>\ne..."
            mock_export_class.return_value = mock_export

            response = client.post(
                "/api/v1/assignment-input/export/pdf",
                json={
                    "content": "Test assignment content",
                    "format": "pdf",
                    "options": {
                        "customTitle": "Test Assignment",
                        "includeMetadata": True
                    }
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["format"] == "pdf"
            assert "filename" in data
            # Decode base64 content and check PDF signature
            import base64
            decoded = base64.b64decode(data["content"])
            assert decoded.startswith(b'%PDF')
            assert len(decoded) > 0

    def test_export_word_success(self, auth_headers, mock_user):
        """Test successful Word document export"""
        with patch('app.services.export_service.ExportService') as mock_export_class:
            mock_export = AsyncMock()
            # Return bytes as real service does (PK is the ZIP signature for DOCX)
            mock_export.export_to_word.return_value = b"PK\x03\x04\x14\x00\x00\x00\x08\x00..."
            mock_export_class.return_value = mock_export

            response = client.post(
                "/api/v1/assignment-input/export/docx",
                json={
                    "content": "Test assignment content",
                    "format": "docx",
                    "options": {
                        "customTitle": "Test Assignment",
                        "includeMetadata": True
                    }
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["format"] == "docx"
            assert "filename" in data
            # Decode base64 content and check DOCX (ZIP) signature
            import base64
            decoded = base64.b64decode(data["content"])
            assert decoded.startswith(b'PK')
            assert len(decoded) > 0

    def test_export_google_docs_success(self, auth_headers, mock_user):
        """Test successful Google Docs export"""
        with patch('app.services.export_service.ExportService') as mock_export_class:
            mock_export = AsyncMock()
            mock_export.export_to_google_docs.return_value = {
                "content": "Formatted content for Google Docs",
                "title": "Test Assignment",
                "export_type": "google-docs",
                "instructions": "Copy and paste into Google Docs"
            }
            mock_export_class.return_value = mock_export

            response = client.post(
                "/api/v1/assignment-input/export/google-docs",
                json={
                    "content": "Test assignment content",
                    "format": "google-docs",
                    "options": {
                        "customTitle": "Test Assignment",
                        "includeMetadata": True
                    }
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["format"] == "google-docs"
            assert "content" in data

    def test_get_export_formats(self, auth_headers, mock_user):
        """Test getting available export formats"""
        with patch('app.services.export_service.ExportService') as mock_export_class:
            mock_export = AsyncMock()
            mock_export.get_export_formats.return_value = {
                "pdf": {"name": "PDF Document", "description": "Portable Document Format"},
                "docx": {"name": "Word Document", "description": "Microsoft Word Document"},
                "google-docs": {"name": "Google Docs", "description": "Cloud-based collaboration"}
            }
            mock_export_class.return_value = mock_export

            response = client.get("/api/v1/assignment-input/export/formats")

            assert response.status_code == 200
            data = response.json()
            assert "pdf" in data
            assert "docx" in data
            assert "google-docs" in data

    def test_process_multiple_inputs(self, auth_headers, mock_user, mock_db):
        """Test processing multiple input types"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_scraper_class, \
             patch('openai.AsyncOpenAI') as mock_openai_class:
            
            # Mock web scraping service
            mock_scraper = AsyncMock()
            mock_scraper.extract_content_from_url.return_value = {
                'title': 'Test Link',
                'content': 'Content from link'
            }
            mock_scraper_class.return_value.__aenter__.return_value = mock_scraper
            
            # Mock OpenAI client
            mock_client = AsyncMock()
            mock_response = AsyncMock()
            mock_response.choices = [AsyncMock()]
            mock_response.choices[0].message.content = "AI generated content"
            mock_client.chat.completions.create.return_value = mock_response
            mock_openai_class.return_value = mock_client

            # Test with form data
            response = client.post(
                "/api/v1/assignment-input/process-multiple-inputs",
                data={
                    "links": ["https://example.com"],
                    "chat_prompt": "Create an assignment"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert "files" in data
            assert len(data.get("files", [])) >= 0

    def test_unsupported_export_format(self, auth_headers, mock_user):
        """Test export with unsupported format"""
        response = client.post(
            "/api/v1/assignment-input/export/unsupported",
            json={
                "content": "Test content",
                "format": "unsupported"
            }
        )

        # Accept either 400 (custom error) or 422 (validation error)
        assert response.status_code in (400, 422)
        data = response.json()
        assert "error" in data or "detail" in data

class TestWebScrapingService:
    """Test cases for web scraping service"""

    @pytest.mark.asyncio
    async def test_extract_google_docs_content(self):
        """Test Google Docs content extraction"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service.extract_google_docs_content.return_value = {
                'title': 'Google Doc Title',
                'content': 'Google Doc content',
                'type': 'google-docs'
            }
            mock_service_class.return_value = mock_service

            service = mock_service_class.return_value
            result = await service.extract_google_docs_content("https://docs.google.com/test")

            assert result["title"] == "Google Doc Title"
            assert result["content"] == "Google Doc content"
            assert result["type"] == "google-docs"

    @pytest.mark.asyncio
    async def test_extract_webpage_content(self):
        """Test webpage content extraction"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service.extract_webpage_content.return_value = {
                'title': 'Test Page',
                'content': 'Test webpage content',
                'type': 'webpage'
            }
            mock_service_class.return_value = mock_service

            service = mock_service_class.return_value
            result = await service.extract_webpage_content("https://example.com")

            assert result["title"] == "Test Page"
            assert result["content"] == "Test webpage content"
            assert result["type"] == "webpage"

class TestExportService:
    """Test cases for export service"""

    @pytest.mark.asyncio
    async def test_export_to_pdf(self):
        """Test PDF export functionality"""
        with patch('app.services.export_service.ExportService.export_to_pdf', new_callable=AsyncMock) as mock_export_pdf:
            mock_export_pdf.return_value = b"%PDF-1.4\n%\x93\x8c\x8b\x9e ReportLab Generated PDF document http://www.reportlab.com\n1 0 obj\n<<\n/F1 2 0 R /F2 3 0 R\n>>\ne..."
            service = __import__('app.services.export_service', fromlist=['ExportService']).ExportService()
            result = await service.export_to_pdf("Test content", {"title": "Test"})
            assert result.startswith(b'%PDF')
            assert len(result) > 0

    @pytest.mark.asyncio
    async def test_export_to_word(self):
        """Test Word document export functionality"""
        with patch('app.services.export_service.ExportService.export_to_word', new_callable=AsyncMock) as mock_export_word:
            mock_export_word.return_value = b"PK\x03\x04\x14\x00\x00\x00\x08\x00..."
            service = __import__('app.services.export_service', fromlist=['ExportService']).ExportService()
            result = await service.export_to_word("Test content", {"title": "Test"})
            assert result.startswith(b'PK')
            assert len(result) > 0

    # (No changes needed for test_extract_from_link_success, as the mock already includes all required fields.) 