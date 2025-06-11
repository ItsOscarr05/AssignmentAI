import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, validator
import bleach
from app.core.config import settings

class SecurityService:
    def __init__(self):
        # Allowed HTML tags and attributes
        self.allowed_tags = [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'blockquote'
        ]
        self.allowed_attributes = {
            'a': ['href', 'title', 'target'],
            'img': ['src', 'alt', 'title'],
            '*': ['class']
        }

    def sanitize_html(self, html_content: str) -> str:
        """Sanitize HTML content to prevent XSS attacks"""
        return bleach.clean(
            html_content,
            tags=self.allowed_tags,
            attributes=self.allowed_attributes,
            strip=True
        )

    def sanitize_text(self, text: str) -> str:
        """Sanitize plain text to remove potentially dangerous characters"""
        # Remove null bytes and control characters
        text = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', text)
        # Remove HTML tags
        text = bleach.clean(text, tags=[], strip=True)
        return text

    def validate_email(self, email: str) -> bool:
        """Validate email format"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email))

    def validate_url(self, url: str) -> bool:
        """Validate URL format"""
        url_pattern = r'^https?://(?:[\w-]+\.)+[\w-]+(?:/[\w-./?%&=]*)?$'
        return bool(re.match(url_pattern, url))

    def validate_filename(self, filename: str) -> bool:
        """Validate filename to prevent path traversal"""
        # Check for path traversal attempts
        if '..' in filename or '/' in filename or '\\' in filename:
            return False
        # Check for allowed characters
        filename_pattern = r'^[a-zA-Z0-9._-]+$'
        return bool(re.match(filename_pattern, filename))

    def validate_file_type(self, filename: str, allowed_extensions: List[str]) -> bool:
        """Validate file extension"""
        extension = filename.lower().split('.')[-1]
        return extension in allowed_extensions

    def validate_file_size(self, file_size: int, max_size_mb: int = 100) -> bool:
        """Validate file size"""
        max_size_bytes = max_size_mb * 1024 * 1024
        return file_size <= max_size_bytes

    def sanitize_sql_input(self, value: Any) -> Any:
        """Sanitize input for SQL queries"""
        if isinstance(value, str):
            # Remove SQL injection patterns
            value = re.sub(r'[\'";]', '', value)
            value = re.sub(r'--|#|/\*|\*/', '', value)
        return value

    def validate_json_schema(self, data: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """Validate JSON data against a schema"""
        try:
            model = type('DynamicModel', (BaseModel,), schema)
            model(**data)
            return True
        except Exception:
            return False

# Create a global security service instance
security_service = SecurityService() 