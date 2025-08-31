import pytest
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from app.models.file import File
from app.models.subscription import Subscription, SubscriptionStatus
from datetime import datetime
import io

client = TestClient(app)

@pytest.fixture
def mock_user():
    """Create a mock user for testing"""
    user = Mock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.is_active = True
    return user


@pytest.fixture
def mock_free_subscription():
    """Create a mock free subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_free_test"
    return subscription


@pytest.fixture
def mock_plus_subscription():
    """Create a mock plus subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_plus_test"
    return subscription


@pytest.fixture
def mock_pro_subscription():
    """Create a mock pro subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_pro_test"
    return subscription


@pytest.fixture
def mock_max_subscription():
    """Create a mock max subscription"""
    subscription = Mock(spec=Subscription)
    subscription.user_id = 1
    subscription.status = SubscriptionStatus.ACTIVE
    subscription.plan_id = "price_max_test"
    return subscription

@pytest.fixture
def mock_db():
    """Create a mock database session"""
    return Mock()

@pytest.fixture
def override_get_current_user(mock_user):
    """Override the get_current_user dependency"""
    app.dependency_overrides = getattr(app, 'dependency_overrides', {})
    from app.core.deps import get_current_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides = {}

@pytest.fixture
def override_get_db(mock_db):
    """Override the get_db dependency"""
    app.dependency_overrides = getattr(app, 'dependency_overrides', {})
    from app.core.deps import get_db
    app.dependency_overrides[get_db] = lambda: mock_db
    yield
    app.dependency_overrides = {}

class TestWorkshopEndpoints:
    """Test workshop endpoints functionality"""

    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_generate_content_success(self, mock_generate_content, override_get_current_user, override_get_db):
        """Test successful content generation"""
        mock_generate_content.return_value = "Generated content"
        
        response = client.post(
            "/api/v1/workshop/generate",
            json={"prompt": "Test prompt"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "Generated content"
        assert "timestamp" in data
        mock_generate_content.assert_called_once_with("Test prompt")

    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_generate_content_error(self, mock_generate_content, override_get_current_user, override_get_db):
        """Test content generation with error"""
        mock_generate_content.side_effect = Exception("AI service error")
        
        response = client.post(
            "/api/v1/workshop/generate",
            json={"prompt": "Test prompt"}
        )
        
        assert response.status_code == 500
        assert "Internal server error during content generation" in response.json()["detail"]

    @patch('app.api.v1.endpoints.workshop.file_service.save_file')
    @patch('app.api.v1.endpoints.workshop.extract_file_content')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_upload_and_process_file_success(
        self, 
        mock_generate_content, 
        mock_extract_content, 
        mock_save_file,
        override_get_current_user, 
        override_get_db
    ):
        """Test successful file upload and processing"""
        mock_save_file.return_value = ("/path/to/file.txt", 1024)
        mock_extract_content.return_value = "Extracted content"
        mock_generate_content.return_value = "AI analysis"
        
        file_content = io.BytesIO(b"test file content")
        
        response = client.post(
            "/api/v1/workshop/files",
            files={"file": ("test.txt", file_content, "text/plain")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test.txt"
        assert data["type"] == "text/plain"
        assert data["content"] == "Extracted content"
        assert data["analysis"] == "AI analysis"
        assert "uploaded_at" in data
        assert "id" in data

    @patch('app.api.v1.endpoints.workshop.file_service.save_file')
    async def test_upload_and_process_file_error(self, mock_save_file, override_get_current_user, override_get_db):
        """Test file upload with error"""
        mock_save_file.side_effect = Exception("File save error")
        
        file_content = io.BytesIO(b"test file content")
        
        response = client.post(
            "/api/v1/workshop/files",
            files={"file": ("test.txt", file_content, "text/plain")}
        )
        
        assert response.status_code == 500
        assert "Failed to process file" in response.json()["detail"]

    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_process_uploaded_file_summarize(self, mock_generate_content, override_get_current_user, override_get_db):
        """Test file processing with summarize action"""
        mock_generate_content.return_value = "Summary of document"
        
        response = client.post(
            "/api/v1/workshop/files/process",
            json={"file_id": "test-id", "action": "summarize"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "summarize"
        assert data["result"] == "Summary of document"
        assert "processed_at" in data

    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_process_uploaded_file_extract(self, mock_generate_content, override_get_current_user, override_get_db):
        """Test file processing with extract action"""
        mock_generate_content.return_value = "Key points extracted"
        
        response = client.post(
            "/api/v1/workshop/files/process",
            json={"file_id": "test-id", "action": "extract"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "extract"
        assert data["result"] == "Key points extracted"

    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_process_uploaded_file_rewrite(self, mock_generate_content, override_get_current_user, override_get_db):
        """Test file processing with rewrite action"""
        mock_generate_content.return_value = "Rewritten content"
        
        response = client.post(
            "/api/v1/workshop/files/process",
            json={"file_id": "test-id", "action": "rewrite"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "rewrite"
        assert data["result"] == "Rewritten content"

    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_process_uploaded_file_analyze(self, mock_generate_content, override_get_current_user, override_get_db):
        """Test file processing with analyze action"""
        mock_generate_content.return_value = "Document analysis"
        
        response = client.post(
            "/api/v1/workshop/files/process",
            json={"file_id": "test-id", "action": "analyze"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "analyze"
        assert data["result"] == "Document analysis"

    async def test_process_uploaded_file_invalid_action(self, override_get_current_user, override_get_db):
        """Test file processing with invalid action"""
        response = client.post(
            "/api/v1/workshop/files/process",
            json={"file_id": "test-id", "action": "invalid_action"}
        )
        
        assert response.status_code == 400
        assert "Invalid action specified" in response.json()["detail"]

    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_process_uploaded_file_error(self, mock_generate_content, override_get_current_user, override_get_db):
        """Test file processing with error"""
        mock_generate_content.side_effect = Exception("Processing error")
        
        response = client.post(
            "/api/v1/workshop/files/process",
            json={"file_id": "test-id", "action": "summarize"}
        )
        
        assert response.status_code == 500
        assert "Failed to process file" in response.json()["detail"]

    @patch('app.api.v1.endpoints.workshop.WebScrapingService')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_process_link_success(self, mock_generate_content, mock_scraper_class, override_get_current_user, override_get_db):
        """Test successful link processing"""
        mock_scraper = AsyncMock()
        mock_scraper.extract_content_from_url.return_value = {
            "title": "Test Page",
            "content": "Test content",
            "type": "article"
        }
        mock_scraper_class.return_value.__aenter__.return_value = mock_scraper
        mock_generate_content.return_value = "Web content analysis"
        
        response = client.post(
            "/api/v1/workshop/links",
            json={"url": "https://example.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["url"] == "https://example.com"
        assert data["title"] == "Test Page"
        assert data["content"] == "Test content"
        assert data["type"] == "article"
        assert data["analysis"] == "Web content analysis"
        assert "extracted_at" in data

    @patch('app.api.v1.endpoints.workshop.WebScrapingService')
    async def test_process_link_error(self, mock_scraper_class, override_get_current_user, override_get_db):
        """Test link processing with error"""
        mock_scraper = AsyncMock()
        mock_scraper.extract_content_from_url.side_effect = Exception("Scraping error")
        mock_scraper_class.return_value.__aenter__.return_value = mock_scraper
        
        response = client.post(
            "/api/v1/workshop/links",
            json={"url": "https://example.com"}
        )
        
        assert response.status_code == 500
        assert "Failed to process link" in response.json()["detail"]

    async def test_delete_file_success(self, override_get_current_user, override_get_db):
        """Test successful file deletion"""
        response = client.delete("/api/v1/workshop/files/test-file-id")
        
        assert response.status_code == 200
        assert response.json()["message"] == "File deleted successfully"

    async def test_delete_file_error(self, override_get_current_user, override_get_db):
        """Test file deletion with error"""
        # This endpoint doesn't actually have error handling in the current implementation
        # but we test the basic functionality
        response = client.delete("/api/v1/workshop/files/test-file-id")
        
        assert response.status_code == 200

    async def test_delete_link_success(self, override_get_current_user, override_get_db):
        """Test successful link deletion"""
        response = client.delete("/api/v1/workshop/links/test-link-id")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Link deleted successfully"

    async def test_delete_link_error(self, override_get_current_user, override_get_db):
        """Test link deletion with error"""
        # This endpoint doesn't actually have error handling in the current implementation
        # but we test the basic functionality
        response = client.delete("/api/v1/workshop/links/test-link-id")
        
        assert response.status_code == 200

class TestExtractFileContent:
    """Test the extract_file_content function"""

    @patch('builtins.open', create=True)
    async def test_extract_text_plain(self, mock_open):
        """Test extracting content from plain text file"""
        mock_open.return_value.__enter__.return_value.read.return_value = "Plain text content"
        
        from app.api.v1.endpoints.workshop import extract_file_content
        
        result = await extract_file_content("/path/to/file.txt", "text/plain")
        
        assert result == "Plain text content"
        mock_open.assert_called_once_with("/path/to/file.txt", 'r', encoding='utf-8')

    @patch('builtins.open', create=True)
    @patch('app.api.v1.endpoints.workshop.pypdf.PdfReader')
    async def test_extract_pdf_content(self, mock_pdf_reader, mock_open):
        """Test extracting content from PDF file"""
        mock_page1 = Mock()
        mock_page1.extract_text.return_value = "Page 1 content"
        mock_page2 = Mock()
        mock_page2.extract_text.return_value = "Page 2 content"
        mock_pdf_reader.return_value.pages = [mock_page1, mock_page2]
        
        from app.api.v1.endpoints.workshop import extract_file_content
        
        result = await extract_file_content("/path/to/file.pdf", "application/pdf")
        
        assert result == "Page 1 content\nPage 2 content"
        mock_open.assert_called_once_with("/path/to/file.pdf", 'rb')

    @patch('app.api.v1.endpoints.workshop.Document')
    async def test_extract_word_document(self, mock_document):
        """Test extracting content from Word document"""
        mock_para1 = Mock()
        mock_para1.text = "Paragraph 1"
        mock_para2 = Mock()
        mock_para2.text = "Paragraph 2"
        mock_document.return_value.paragraphs = [mock_para1, mock_para2]
        
        from app.api.v1.endpoints.workshop import extract_file_content
        
        result = await extract_file_content("/path/to/file.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        
        assert result == "Paragraph 1\nParagraph 2"
        mock_document.assert_called_once_with("/path/to/file.docx")

    @patch('builtins.open', create=True)
    async def test_extract_rtf_content(self, mock_open):
        """Test extracting content from RTF file"""
        mock_open.return_value.__enter__.return_value.read.return_value = "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0\\fs24 This is RTF content}"
        
        from app.api.v1.endpoints.workshop import extract_file_content
        
        result = await extract_file_content("/path/to/file.rtf", "application/rtf")
        
        # Should have RTF markup removed
        assert "This is RTF content" in result
        assert "\\rtf1" not in result
        assert "{" not in result
        assert "}" not in result

    async def test_extract_unsupported_format(self):
        """Test extracting content from unsupported format"""
        from app.api.v1.endpoints.workshop import extract_file_content
        
        result = await extract_file_content("/path/to/file.xyz", "application/unknown")
        
        assert "Error extracting content" in result

    @patch('builtins.open', create=True)
    async def test_extract_file_error(self, mock_open):
        """Test extracting content with file error"""
        mock_open.side_effect = Exception("File read error")
        
        from app.api.v1.endpoints.workshop import extract_file_content
        
        result = await extract_file_content("/path/to/file.txt", "text/plain")
        
        assert "Error extracting content" in result


class TestWorkshopFeatureAccess:
    """Test workshop feature access control"""

    @patch('app.api.v1.endpoints.workshop.has_feature_access')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_generate_content_diagram_free_user_denied(
        self, 
        mock_generate_content, 
        mock_get_plan, 
        mock_has_access,
        override_get_current_user, 
        override_get_db,
        mock_db,
        mock_free_subscription
    ):
        """Test that free users cannot generate diagrams"""
        mock_get_plan.return_value = "free"
        mock_has_access.return_value = False
        mock_db.query.return_value.filter.return_value.first.return_value = mock_free_subscription
        
        response = client.post(
            "/api/v1/workshop/generate",
            json={"prompt": "create a diagram of the solar system"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data["detail"]["error"] == "Diagram generation not available in your plan"
        assert data["detail"]["feature"] == "diagram_generation"
        assert data["detail"]["current_plan"] == "free"
        assert "Upgrade to Pro plan" in data["detail"]["upgrade_message"]

    @patch('app.api.v1.endpoints.workshop.has_feature_access')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_generate_content_code_free_user_denied(
        self, 
        mock_generate_content, 
        mock_get_plan, 
        mock_has_access,
        override_get_current_user, 
        override_get_db,
        mock_db,
        mock_free_subscription
    ):
        """Test that free users cannot generate code"""
        mock_get_plan.return_value = "free"
        mock_has_access.return_value = False
        mock_db.query.return_value.filter.return_value.first.return_value = mock_free_subscription
        
        response = client.post(
            "/api/v1/workshop/generate",
            json={"prompt": "write code for a python function"}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data["detail"]["error"] == "Code analysis not available in your plan"
        assert data["detail"]["feature"] == "code_analysis"
        assert data["detail"]["upgrade_message"]

    @patch('app.api.v1.endpoints.workshop.has_feature_access')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.diagram_service')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_generate_content_diagram_pro_user_allowed(
        self, 
        mock_generate_content, 
        mock_diagram_service,
        mock_get_plan, 
        mock_has_access,
        override_get_current_user, 
        override_get_db,
        mock_db,
        mock_pro_subscription
    ):
        """Test that pro users can generate diagrams"""
        mock_get_plan.return_value = "pro"
        mock_has_access.return_value = True
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pro_subscription
        mock_diagram_service.generate_diagram = AsyncMock(return_value="Diagram generated successfully!")
        
        response = client.post(
            "/api/v1/workshop/generate",
            json={"prompt": "create a diagram of the solar system"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Diagram generated successfully!" in data["content"]
        assert data["service_used"] == "diagram_generation"

    @patch('app.api.v1.endpoints.workshop.has_feature_access')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.file_service.save_file')
    @patch('app.api.v1.endpoints.workshop.image_analysis_service.analyze_image_and_answer')
    @patch('builtins.open', create=True)
    async def test_upload_image_free_user_allowed(
        self, 
        mock_open,
        mock_image_analysis, 
        mock_save_file,
        mock_get_plan, 
        mock_has_access,
        override_get_current_user, 
        override_get_db,
        mock_db,
        mock_free_subscription
    ):
        """Test that free users can upload images for analysis"""
        mock_get_plan.return_value = "free"
        mock_has_access.return_value = True
        mock_db.query.return_value.filter.return_value.first.return_value = mock_free_subscription
        mock_save_file.return_value = ("/path/to/image.jpg", 1024)
        mock_image_analysis.return_value = "Image analysis completed"
        
        # Mock the file reading operation
        mock_file = Mock()
        mock_file.read.return_value = b"fake image data"
        mock_open.return_value.__enter__.return_value = mock_file
        
        file_content = io.BytesIO(b"fake image data")
        
        response = client.post(
            "/api/v1/workshop/files",
            files={"file": ("test.jpg", file_content, "image/jpeg")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test.jpg"
        assert data["analysis"] == "Image analysis completed"

    @patch('app.api.v1.endpoints.workshop.has_feature_access')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.file_service.save_file')
    @patch('app.api.v1.endpoints.workshop.extract_file_content')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_upload_code_file_free_user_denied(
        self, 
        mock_generate_content, 
        mock_extract_content, 
        mock_save_file,
        mock_get_plan, 
        mock_has_access,
        override_get_current_user, 
        override_get_db,
        mock_db,
        mock_free_subscription
    ):
        """Test that free users cannot upload code files for analysis"""
        mock_get_plan.return_value = "free"
        mock_has_access.return_value = False
        mock_db.query.return_value.filter.return_value.first.return_value = mock_free_subscription
        mock_save_file.return_value = ("/path/to/code.py", 1024)
        mock_extract_content.return_value = "def hello(): print('hello')"
        
        file_content = io.BytesIO(b"def hello(): print('hello')")
        
        response = client.post(
            "/api/v1/workshop/files",
            files={"file": ("test.py", file_content, "text/x-python")}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data["detail"]["error"] == "Code analysis not available in your plan"
        assert data["detail"]["feature"] == "code_analysis"
        assert data["detail"]["current_plan"] == "free"
        assert "Upgrade to Plus plan" in data["detail"]["upgrade_message"]

    @patch('app.api.v1.endpoints.workshop.has_feature_access')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.file_service.save_file')
    @patch('app.api.v1.endpoints.workshop.extract_file_content')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_upload_data_file_free_user_denied(
        self, 
        mock_generate_content, 
        mock_extract_content, 
        mock_save_file,
        mock_get_plan, 
        mock_has_access,
        override_get_current_user, 
        override_get_db,
        mock_db,
        mock_free_subscription
    ):
        """Test that free users cannot upload data files for analysis"""
        mock_get_plan.return_value = "free"
        mock_has_access.return_value = False
        mock_db.query.return_value.filter.return_value.first.return_value = mock_free_subscription
        mock_save_file.return_value = ("/path/to/data.csv", 1024)
        mock_extract_content.return_value = "name,age\njohn,25"
        
        file_content = io.BytesIO(b"name,age\njohn,25")
        
        response = client.post(
            "/api/v1/workshop/files",
            files={"file": ("test.csv", file_content, "text/csv")}
        )
        
        assert response.status_code == 403
        data = response.json()
        assert data["detail"]["error"] == "Data analysis not available in your plan"
        assert data["detail"]["feature"] == "data_analysis"
        assert data["detail"]["current_plan"] == "free"
        assert "Upgrade to Pro plan" in data["detail"]["upgrade_message"]

    @patch('app.api.v1.endpoints.workshop.has_feature_access')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.file_service.save_file')
    @patch('app.api.v1.endpoints.workshop.extract_file_content')
    @patch('app.api.v1.endpoints.workshop.ai_service.generate_assignment_content_from_prompt')
    async def test_upload_document_free_user_allowed(
        self, 
        mock_generate_content, 
        mock_extract_content, 
        mock_save_file,
        mock_get_plan, 
        mock_has_access,
        override_get_current_user, 
        override_get_db,
        mock_db
    ):
        """Test that free users can upload documents for analysis"""
        mock_get_plan.return_value = "free"
        mock_has_access.return_value = True
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_save_file.return_value = ("/path/to/doc.txt", 1024)
        mock_extract_content.return_value = "This is a document"
        mock_generate_content.return_value = "Document analysis"
        
        file_content = io.BytesIO(b"This is a document")
        
        response = client.post(
            "/api/v1/workshop/files",
            files={"file": ("test.txt", file_content, "text/plain")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "test.txt"
        assert data["analysis"] == "Document analysis"

    @patch('app.api.v1.endpoints.workshop.get_available_features')
    @patch('app.api.v1.endpoints.workshop.get_user_plan')
    @patch('app.api.v1.endpoints.workshop.get_feature_requirements')
    async def test_get_user_features(
        self, 
        mock_get_requirements, 
        mock_get_plan, 
        mock_get_features,
        override_get_current_user, 
        override_get_db,
        mock_db,
        mock_pro_subscription
    ):
        """Test getting user features endpoint"""
        mock_get_plan.return_value = "pro"
        mock_get_features.return_value = {
            "basic_assignment_generation": True,
            "diagram_generation": True,
            "image_analysis": True,
            "advanced_analytics": False
        }
        mock_get_requirements.return_value = {
            "pro": {
                "available": ["basic_assignment_generation", "diagram_generation"],
                "unavailable": ["advanced_analytics"]
            }
        }
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pro_subscription
        
        response = client.get("/api/v1/workshop/features")
        
        assert response.status_code == 200
        data = response.json()
        assert data["current_plan"] == "pro"
        assert data["available_features"]["diagram_generation"] == True
        assert data["available_features"]["advanced_analytics"] == False
        assert "upgrade_url" in data 