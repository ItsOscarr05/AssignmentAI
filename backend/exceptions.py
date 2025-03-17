"""
Custom exceptions for AssignmentAI.
"""

class ValidationError(Exception):
    """Raised when data validation fails."""
    def __init__(self, message: str = "Validation failed", errors: dict = None):
        self.message = message
        self.errors = errors or {}
        super().__init__(self.message)

class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass

class AuthorizationError(Exception):
    """Raised when authorization fails."""
    pass

class ResourceNotFoundError(Exception):
    """Raised when a requested resource is not found."""
    pass

class RateLimitError(Exception):
    """Raised when rate limit is exceeded."""
    pass

class DatabaseError(Exception):
    """Raised when database operations fail."""
    pass

class CacheError(Exception):
    """Exception raised for cache-related errors.
    
    Attributes:
        message -- explanation of the error
        operation -- cache operation that failed (get, set, delete, etc.)
        key -- cache key involved in the error
        level -- cache level where the error occurred
    """
    
    def __init__(
        self,
        message: str,
        operation: str = None,
        key: str = None,
        level: str = None
    ):
        self.message = message
        self.operation = operation
        self.key = key
        self.level = level
        super().__init__(self.message)
        
    def __str__(self) -> str:
        error_parts = [self.message]
        if self.operation:
            error_parts.append(f"Operation: {self.operation}")
        if self.key:
            error_parts.append(f"Key: {self.key}")
        if self.level:
            error_parts.append(f"Level: {self.level}")
        return " | ".join(error_parts)

class AIServiceError(Exception):
    """Raised when AI service operations fail."""
    pass

class DocumentProcessingError(Exception):
    """Raised when document processing fails."""
    pass 