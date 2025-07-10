import pytest
from unittest.mock import patch, MagicMock
from app.services.security_service import SecurityService, security_service
from pydantic import ValidationError

class TestSecurityService:
    """Test cases for SecurityService class"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.security_service = SecurityService()
    
    def test_sanitize_html_basic(self):
        """Test basic HTML sanitization"""
        html_content = "<p>Hello <script>alert('xss')</script> World</p>"
        result = self.security_service.sanitize_html(html_content)
        assert "<p>Hello  World</p>" in result
        assert "script" not in result
    
    def test_sanitize_html_allowed_tags(self):
        """Test HTML sanitization with allowed tags"""
        html_content = "<p>Hello <strong>World</strong> <em>Test</em></p>"
        result = self.security_service.sanitize_html(html_content)
        assert "<p>Hello <strong>World</strong> <em>Test</em></p>" in result
    
    def test_sanitize_html_allowed_attributes(self):
        """Test HTML sanitization with allowed attributes"""
        html_content = '<a href="https://example.com" title="Link">Click</a>'
        result = self.security_service.sanitize_html(html_content)
        assert 'href="https://example.com"' in result
        assert 'title="Link"' in result
    
    def test_sanitize_html_disallowed_attributes(self):
        """Test HTML sanitization removes disallowed attributes"""
        html_content = '<a href="https://example.com" onclick="alert()">Click</a>'
        result = self.security_service.sanitize_html(html_content)
        assert 'href="https://example.com"' in result
        assert 'onclick' not in result
    
    def test_sanitize_html_empty_string(self):
        """Test HTML sanitization with empty string"""
        result = self.security_service.sanitize_html("")
        assert result == ""
    
    def test_sanitize_text_basic(self):
        """Test basic text sanitization"""
        text = "Hello\x00World\x1F\x7F\x9F"
        result = self.security_service.sanitize_text(text)
        assert result == "HelloWorld"
    
    def test_sanitize_text_html_tags(self):
        """Test text sanitization removes HTML tags"""
        text = "Hello <script>alert('xss')</script> World"
        result = self.security_service.sanitize_text(text)
        assert result == "Hello  World"
    
    def test_sanitize_text_empty_string(self):
        """Test text sanitization with empty string"""
        result = self.security_service.sanitize_text("")
        assert result == ""
    
    def test_validate_email_valid(self):
        """Test email validation with valid email"""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.org"
        ]
        for email in valid_emails:
            assert self.security_service.validate_email(email)
    
    def test_validate_email_invalid(self):
        """Test email validation with invalid email"""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user@.com",
            "user..name@example.com"
        ]
        for email in invalid_emails:
            assert not self.security_service.validate_email(email)
    
    def test_validate_url_valid(self):
        """Test URL validation with valid URLs"""
        valid_urls = [
            "https://example.com",
            "http://www.example.org",
            "https://subdomain.example.com/path",
            "https://example.com/path?param=value"
        ]
        for url in valid_urls:
            assert self.security_service.validate_url(url)
    
    def test_validate_url_invalid(self):
        """Test URL validation with invalid URLs"""
        invalid_urls = [
            "not-a-url",
            "ftp://example.com",
            "https://",
            "http://invalid",
            "javascript:alert('xss')"
        ]
        for url in invalid_urls:
            assert not self.security_service.validate_url(url)
    
    def test_validate_filename_valid(self):
        """Test filename validation with valid filenames"""
        valid_filenames = [
            "document.pdf",
            "image_123.jpg",
            "file-name.txt",
            "test123"
        ]
        for filename in valid_filenames:
            assert self.security_service.validate_filename(filename)
    
    def test_validate_filename_invalid(self):
        """Test filename validation with invalid filenames"""
        invalid_filenames = [
            "../file.txt",
            "file/name.txt",
            "file\\name.txt",
            "file..txt",
            "file/../name.txt"
        ]
        for filename in invalid_filenames:
            assert not self.security_service.validate_filename(filename)
    
    def test_validate_file_type_valid(self):
        """Test file type validation with valid extensions"""
        allowed_extensions = ["pdf", "jpg", "png", "txt"]
        filename = "document.pdf"
        assert self.security_service.validate_file_type(filename, allowed_extensions)
    
    def test_validate_file_type_invalid(self):
        """Test file type validation with invalid extensions"""
        allowed_extensions = ["pdf", "jpg", "png", "txt"]
        filename = "document.exe"
        assert not self.security_service.validate_file_type(filename, allowed_extensions)
    
    def test_validate_file_type_case_insensitive(self):
        """Test file type validation is case insensitive"""
        allowed_extensions = ["pdf", "jpg", "png", "txt"]
        filename = "document.PDF"
        assert self.security_service.validate_file_type(filename, allowed_extensions)
    
    def test_validate_file_size_valid(self):
        """Test file size validation with valid size"""
        file_size = 50 * 1024 * 1024  # 50MB
        max_size_mb = 100
        assert self.security_service.validate_file_size(file_size, max_size_mb)
    
    def test_validate_file_size_invalid(self):
        """Test file size validation with invalid size"""
        file_size = 150 * 1024 * 1024  # 150MB
        max_size_mb = 100
        assert not self.security_service.validate_file_size(file_size, max_size_mb)
    
    def test_validate_file_size_exact_limit(self):
        """Test file size validation at exact limit"""
        file_size = 100 * 1024 * 1024  # 100MB
        max_size_mb = 100
        assert self.security_service.validate_file_size(file_size, max_size_mb)
    
    def test_sanitize_sql_input_string(self):
        """Test SQL input sanitization with string input"""
        input_value = "user'; DROP TABLE users; --"
        result = self.security_service.sanitize_sql_input(input_value)
        assert result == "user DROP TABLE users "
    
    def test_sanitize_sql_input_non_string(self):
        """Test SQL input sanitization with non-string input"""
        input_value = 123
        result = self.security_service.sanitize_sql_input(input_value)
        assert result == 123
    
    def test_sanitize_sql_input_none(self):
        """Test SQL input sanitization with None input"""
        result = self.security_service.sanitize_sql_input(None)
        assert result is None
    
    def test_validate_json_schema_valid(self):
        """Test JSON schema validation with valid data"""
        schema = {
            "name": {"type": "string"},
            "age": {"type": "integer"},
            "email": {"type": "string"}
        }
        data = {
            "name": "John Doe",
            "age": 30,
            "email": "john@example.com"
        }
        assert self.security_service.validate_json_schema(data, schema)
    
    def test_validate_json_schema_invalid(self):
        """Test JSON schema validation with invalid data"""
        schema = {
            "name": {"type": "string"},
            "age": {"type": "integer"},
            "email": {"type": "string"}
        }
        data = {
            "name": "John Doe",
            "age": "not_a_number",  # Should be integer
            "email": "john@example.com"
        }
        assert not self.security_service.validate_json_schema(data, schema)
    
    def test_validate_json_schema_missing_required(self):
        """Test JSON schema validation with missing required fields"""
        schema = {
            "name": {"type": "string"},
            "age": {"type": "integer"},
            "email": {"type": "string"}
        }
        data = {
            "name": "John Doe"
            # Missing age and email
        }
        assert not self.security_service.validate_json_schema(data, schema)
    
    def test_validate_json_schema_exception_handling(self):
        """Test JSON schema validation handles exceptions"""
        schema = {"invalid": "schema"}
        data = {"test": "data"}
        # This should raise an exception during validation
        assert not self.security_service.validate_json_schema(data, schema)
    
    def test_global_security_service_instance(self):
        """Test that the global security service instance works"""
        assert security_service is not None
        assert isinstance(security_service, SecurityService)
        
        # Test that the global instance works the same as a new instance
        test_email = "test@example.com"
        assert security_service.validate_email(test_email) == self.security_service.validate_email(test_email) 