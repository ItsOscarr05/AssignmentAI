from typing import Dict, List, Optional, Any, Type, Union
from datetime import datetime
import logging
from dataclasses import dataclass
import jsonschema

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Base exception for configuration validation errors."""
    pass

class SchemaError(ValidationError):
    """Exception raised for schema validation errors."""
    pass

class TypeError(ValidationError):
    """Exception raised for type validation errors."""
    pass

class RequiredError(ValidationError):
    """Exception raised for required field validation errors."""
    pass

class FormatError(ValidationError):
    """Exception raised for format validation errors."""
    pass

@dataclass
class ValidationResult:
    """Result of a configuration validation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str]

class ConfigurationValidator:
    """Validates configuration files against schemas."""

    def __init__(self):
        """Initialize the ConfigurationValidator."""
        self.logger = logging.getLogger(__name__)
        self.schemas: Dict[str, Dict[str, Any]] = {}

    def register_schema(self, name: str, schema: Dict[str, Any]) -> None:
        """
        Register a JSON schema for validation.

        Args:
            name: Name of the schema
            schema: JSON schema definition

        Raises:
            SchemaError: If schema registration fails
        """
        try:
            jsonschema.Draft7Validator.check_schema(schema)
            self.schemas[name] = schema
        except jsonschema.exceptions.SchemaError as e:
            self.logger.error(f"Error registering schema: {e}")
            raise SchemaError(f"Failed to register schema: {e}")

    def validate_config(self, name: str, config: Dict[str, Any]) -> ValidationResult:
        """
        Validate a configuration against its schema.

        Args:
            name: Name of the schema to use
            config: Configuration to validate

        Returns:
            ValidationResult object

        Raises:
            ValidationError: If validation fails
        """
        try:
            if name not in self.schemas:
                raise ValidationError(f"Schema '{name}' not found")

            validator = jsonschema.Draft7Validator(self.schemas[name])
            errors = list(validator.iter_errors(config))
            
            result = ValidationResult(
                is_valid=len(errors) == 0,
                errors=[str(error) for error in errors],
                warnings=[]
            )

            # Log validation results
            if result.is_valid:
                self.logger.info(f"Configuration '{name}' is valid")
            else:
                self.logger.error(f"Configuration '{name}' validation failed: {result.errors}")

            return result
        except Exception as e:
            self.logger.error(f"Error validating configuration: {e}")
            raise ValidationError(f"Failed to validate configuration: {e}")

    def validate_type(self, value: Any, expected_type: Type) -> bool:
        """
        Validate a value's type.

        Args:
            value: Value to validate
            expected_type: Expected type

        Returns:
            True if type is valid, False otherwise

        Raises:
            TypeError: If type validation fails
        """
        try:
            if not isinstance(value, expected_type):
                raise TypeError(f"Expected type {expected_type}, got {type(value)}")
            return True
        except Exception as e:
            self.logger.error(f"Error validating type: {e}")
            raise TypeError(f"Failed to validate type: {e}")

    def validate_required(self, config: Dict[str, Any], required_fields: List[str]) -> bool:
        """
        Validate required fields in a configuration.

        Args:
            config: Configuration to validate
            required_fields: List of required field names

        Returns:
            True if all required fields are present, False otherwise

        Raises:
            RequiredError: If required field validation fails
        """
        try:
            missing_fields = [field for field in required_fields if field not in config]
            if missing_fields:
                raise RequiredError(f"Missing required fields: {missing_fields}")
            return True
        except Exception as e:
            self.logger.error(f"Error validating required fields: {e}")
            raise RequiredError(f"Failed to validate required fields: {e}")

    def validate_format(self, value: str, format_type: str) -> bool:
        """
        Validate a string value's format.

        Args:
            value: String value to validate
            format_type: Type of format to validate against

        Returns:
            True if format is valid, False otherwise

        Raises:
            FormatError: If format validation fails
        """
        try:
            if format_type == "datetime":
                datetime.fromisoformat(value)
            elif format_type == "email":
                if "@" not in value or "." not in value:
                    raise FormatError(f"Invalid email format: {value}")
            elif format_type == "url":
                if not value.startswith(("http://", "https://")):
                    raise FormatError(f"Invalid URL format: {value}")
            return True
        except Exception as e:
            self.logger.error(f"Error validating format: {e}")
            raise FormatError(f"Failed to validate format: {e}")

    def validate_range(self, value: Union[int, float], min_value: Optional[Union[int, float]] = None, 
                      max_value: Optional[Union[int, float]] = None) -> bool:
        """
        Validate a numeric value's range.

        Args:
            value: Value to validate
            min_value: Optional minimum value
            max_value: Optional maximum value

        Returns:
            True if value is within range, False otherwise

        Raises:
            ValidationError: If range validation fails
        """
        try:
            if min_value is not None and value < min_value:
                raise ValidationError(f"Value {value} is below minimum {min_value}")
            if max_value is not None and value > max_value:
                raise ValidationError(f"Value {value} is above maximum {max_value}")
            return True
        except Exception as e:
            self.logger.error(f"Error validating range: {e}")
            raise ValidationError(f"Failed to validate range: {e}") 