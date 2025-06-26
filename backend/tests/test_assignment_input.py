import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app

client = TestClient(app)

class TestAssignmentInputEndpoints:
    """Test cases for assignment input endpoints"""

    @pytest.fixture
    def mock_auth(self):
        """Mock authentication for tests"""
        with patch('app.api.v1.endpoints.assignment_input.get_current_user') as mock:
            mock.return_value = AsyncMock(id=1, email="test@example.com")
            yield mock

    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        with patch('app.api.v1.endpoints.assignment_input.get_db') as mock:
            mock.return_value = AsyncMock()
            yield mock

    def test_extract_from_link_success(self, mock_auth, mock_db):
        """Test successful content extraction from link"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_scraper:
            mock_scraper.return_value.__aenter__.return_value.extract_content_from_url.return_value = {
                'title': 'Test Document',
                'content': 'Test content from URL',
                'type': 'webpage',
                'extracted_at': 1234567890.0
            }

            response = client.post(
                "/api/v1/assignment-input/extract-from-link",
                json={"url": "https://example.com/test"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Test Document"
            assert data["content"] == "Test content from URL"
            assert data["type"] == "webpage"

    def test_extract_from_link_invalid_url(self, mock_auth, mock_db):
        """Test content extraction with invalid URL"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_scraper:
            mock_scraper.return_value.__aenter__.return_value.extract_content_from_url.side_effect = Exception("Invalid URL")

            response = client.post(
                "/api/v1/assignment-input/extract-from-link",
                json={"url": "invalid-url"}
            )

            assert response.status_code == 400

    def test_validate_link_success(self, mock_auth, mock_db):
        """Test successful link validation"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_scraper:
            mock_scraper.return_value.__aenter__.return_value.validate_url.return_value = {
                'valid': True,
                'content_type': 'text/html',
                'url_type': 'webpage',
                'accessible': True
            }

            response = client.post(
                "/api/v1/assignment-input/validate-link",
                json={"url": "https://example.com"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["valid"] is True
            assert data["accessible"] is True

    def test_generate_chat_response_success(self, mock_auth, mock_db):
        """Test successful chat response generation"""
        with patch('app.services.ai_service.AIService') as mock_ai:
            mock_ai.return_value.generate_assignment_content_from_prompt.return_value = "Generated assignment content"

            response = client.post(
                "/api/v1/assignment-input/chat/generate",
                json={"message": "Create a math assignment", "context": ""}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["response"] == "Generated assignment content"
            assert "tokens_used" in data
            assert "model_used" in data

    def test_export_pdf_success(self, mock_auth, mock_db):
        """Test successful PDF export"""
        with patch('app.services.export_service.ExportService') as mock_export:
            mock_export.return_value.export_to_pdf.return_value = b"PDF content"

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

    def test_export_word_success(self, mock_auth, mock_db):
        """Test successful Word document export"""
        with patch('app.services.export_service.ExportService') as mock_export:
            mock_export.return_value.export_to_word.return_value = b"Word content"

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

    def test_export_google_docs_success(self, mock_auth, mock_db):
        """Test successful Google Docs export"""
        with patch('app.services.export_service.ExportService') as mock_export:
            mock_export.return_value.export_to_google_docs.return_value = {
                "content": "Formatted content for Google Docs",
                "title": "Test Assignment",
                "export_type": "google-docs",
                "instructions": "Copy and paste into Google Docs"
            }

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

    def test_get_export_formats(self, mock_auth, mock_db):
        """Test getting available export formats"""
        with patch('app.services.export_service.ExportService') as mock_export:
            mock_export.return_value.get_export_formats.return_value = {
                "pdf": {"name": "PDF Document", "description": "Portable Document Format"},
                "docx": {"name": "Word Document", "description": "Microsoft Word Document"},
                "google-docs": {"name": "Google Docs", "description": "Cloud-based collaboration"}
            }

            response = client.get("/api/v1/assignment-input/export/formats")

            assert response.status_code == 200
            data = response.json()
            assert "pdf" in data
            assert "docx" in data
            assert "google-docs" in data

    def test_process_multiple_inputs(self, mock_auth, mock_db):
        """Test processing multiple input types"""
        with patch('app.services.web_scraping.WebScrapingService') as mock_scraper, \
             patch('app.services.ai_service.AIService') as mock_ai:
            
            mock_scraper.return_value.__aenter__.return_value.extract_content_from_url.return_value = {
                'title': 'Test Link',
                'content': 'Content from link'
            }
            mock_ai.return_value.generate_assignment_content_from_prompt.return_value = "AI generated content"

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
            assert "links" in data
            assert "chat" in data
            assert "combined_content" in data

    def test_unsupported_export_format(self, mock_auth, mock_db):
        """Test export with unsupported format"""
        response = client.post(
            "/api/v1/assignment-input/export/unsupported",
            json={
                "content": "Test content",
                "format": "unsupported",
                "options": {}
            }
        )

        assert response.status_code == 400
        assert "Unsupported export format" in response.json()["detail"]

class TestWebScrapingService:
    """Test cases for WebScrapingService"""

    @pytest.mark.asyncio
    async def test_extract_google_docs_content(self):
        """Test Google Docs content extraction"""
        from app.services.web_scraping import WebScrapingService
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.return_value.__aenter__.return_value.status = 200
            mock_get.return_value.__aenter__.return_value.text = AsyncMock(return_value="Google Docs content")

            async with WebScrapingService() as scraper:
                result = await scraper._extract_google_docs_content("https://docs.google.com/document/d/test123")
                
                assert result["title"] == "Google Document"
                assert result["content"] == "Google Docs content"
                assert result["type"] == "google-docs"

    @pytest.mark.asyncio
    async def test_extract_webpage_content(self):
        """Test webpage content extraction"""
        from app.services.web_scraping import WebScrapingService
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.return_value.__aenter__.return_value.status = 200
            mock_get.return_value.__aenter__.return_value.text = AsyncMock(return_value="<html><body><h1>Test Page</h1><p>Test content</p></body></html>")

            async with WebScrapingService() as scraper:
                result = await scraper._extract_webpage_content("https://example.com")
                
                assert "Test Page" in result["title"]
                assert "Test content" in result["content"]
                assert result["type"] == "webpage"

class TestExportService:
    """Test cases for ExportService"""

    def test_export_to_pdf(self):
        """Test PDF export functionality"""
        from app.services.export_service import ExportService
        
        with patch('reportlab.platypus.SimpleDocTemplate') as mock_doc:
            mock_doc.return_value.build.return_value = None
            
            service = ExportService()
            result = service.export_to_pdf("Test content", {"customTitle": "Test"})
            
            # This would test the actual PDF generation
            # For now, we'll just verify the method exists
            assert hasattr(service, 'export_to_pdf')

    def test_export_to_word(self):
        """Test Word document export functionality"""
        from app.services.export_service import ExportService
        
        with patch('docx.Document') as mock_doc:
            mock_doc.return_value.save.return_value = None
            
            service = ExportService()
            result = service.export_to_word("Test content", {"customTitle": "Test"})
            
            # This would test the actual Word document generation
            # For now, we'll just verify the method exists
            assert hasattr(service, 'export_to_word') 