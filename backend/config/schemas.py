import json
import os
from typing import Dict, List, Optional, Any, Type, Union
from datetime import datetime
import logging
from dataclasses import dataclass
import jsonschema

logger = logging.getLogger(__name__)

class SchemaError(Exception):
    """Base exception for schema-related errors."""
    pass

class ValidationError(SchemaError):
    """Exception raised for schema validation errors."""
    pass

class FormatError(SchemaError):
    """Exception raised for format-related errors."""
    pass

class ReferenceError(SchemaError):
    """Exception raised for schema reference errors."""
    pass

@dataclass
class SchemaResult:
    """Result of a schema operation."""
    success: bool
    data: Optional[Dict[str, Any]]
    errors: List[str]
    warnings: List[str]

class ConfigurationSchemas:
    """Manages configuration schemas."""

    def __init__(self, schema_dir: str):
        """
        Initialize the ConfigurationSchemas.

        Args:
            schema_dir: Directory containing schema files
        """
        self.schema_dir = schema_dir
        self.logger = logging.getLogger(__name__)
        self._ensure_schema_dir()
        self._load_schemas()

    def _ensure_schema_dir(self) -> None:
        """Ensure the schema directory exists."""
        try:
            os.makedirs(self.schema_dir, exist_ok=True)
        except Exception as e:
            self.logger.error(f"Error creating schema directory: {e}")
            raise SchemaError(f"Failed to create schema directory: {e}")

    def _load_schemas(self) -> None:
        """Load all schema files."""
        try:
            self.schemas = {}
            for filename in os.listdir(self.schema_dir):
                if filename.endswith('.json'):
                    name = filename[:-5]  # Remove .json extension
                    self.schemas[name] = self._load_schema(filename)
        except Exception as e:
            self.logger.error(f"Error loading schemas: {e}")
            raise SchemaError(f"Failed to load schemas: {e}")

    def _load_schema(self, filename: str) -> Dict[str, Any]:
        """
        Load a schema file.

        Args:
            filename: Name of the schema file

        Returns:
            Schema definition

        Raises:
            SchemaError: If schema loading fails
        """
        try:
            filepath = os.path.join(self.schema_dir, filename)
            with open(filepath, 'r') as f:
                schema = json.load(f)
                # Validate schema
                jsonschema.Draft7Validator.check_schema(schema)
                return schema
        except Exception as e:
            self.logger.error(f"Error loading schema {filename}: {e}")
            raise SchemaError(f"Failed to load schema {filename}: {e}")

    def validate_config(self, name: str, config: Dict[str, Any]) -> SchemaResult:
        """
        Validate a configuration against its schema.

        Args:
            name: Name of the schema to use
            config: Configuration to validate

        Returns:
            SchemaResult object

        Raises:
            ValidationError: If validation fails
        """
        try:
            if name not in self.schemas:
                raise ValidationError(f"Schema '{name}' not found")

            validator = jsonschema.Draft7Validator(self.schemas[name])
            errors = list(validator.iter_errors(config))
            
            result = SchemaResult(
                success=len(errors) == 0,
                data=config,
                errors=[str(error) for error in errors],
                warnings=[]
            )

            # Log validation results
            if result.success:
                self.logger.info(f"Configuration '{name}' is valid")
            else:
                self.logger.error(f"Configuration '{name}' validation failed: {result.errors}")

            return result
        except Exception as e:
            self.logger.error(f"Error validating configuration: {e}")
            return SchemaResult(
                success=False,
                data=None,
                errors=[str(e)],
                warnings=[]
            )

    def create_schema(self, name: str, schema: Dict[str, Any]) -> bool:
        """
        Create a new schema file.

        Args:
            name: Name of the schema
            schema: Schema definition

        Returns:
            True if creation succeeds, False otherwise

        Raises:
            SchemaError: If schema creation fails
        """
        try:
            # Validate schema
            jsonschema.Draft7Validator.check_schema(schema)

            filename = f"{name}.json"
            filepath = os.path.join(self.schema_dir, filename)

            # Save schema file
            with open(filepath, 'w') as f:
                json.dump(schema, f, indent=4)

            # Reload schemas
            self._load_schemas()
            return True
        except Exception as e:
            self.logger.error(f"Error creating schema: {e}")
            return False

    def update_schema(self, name: str, schema: Dict[str, Any]) -> bool:
        """
        Update an existing schema file.

        Args:
            name: Name of the schema
            schema: New schema definition

        Returns:
            True if update succeeds, False otherwise

        Raises:
            SchemaError: If schema update fails
        """
        try:
            if name not in self.schemas:
                raise SchemaError(f"Schema '{name}' not found")

            return self.create_schema(name, schema)
        except Exception as e:
            self.logger.error(f"Error updating schema: {e}")
            return False

    def delete_schema(self, name: str) -> bool:
        """
        Delete a schema file.

        Args:
            name: Name of the schema

        Returns:
            True if deletion succeeds, False otherwise

        Raises:
            SchemaError: If schema deletion fails
        """
        try:
            filename = f"{name}.json"
            filepath = os.path.join(self.schema_dir, filename)

            if os.path.exists(filepath):
                os.remove(filepath)
                if name in self.schemas:
                    del self.schemas[name]
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error deleting schema: {e}")
            return False

    def list_schemas(self) -> List[str]:
        """
        List all schema files.

        Returns:
            List of schema names

        Raises:
            SchemaError: If listing fails
        """
        try:
            return list(self.schemas.keys())
        except Exception as e:
            self.logger.error(f"Error listing schemas: {e}")
            raise SchemaError(f"Failed to list schemas: {e}")

    def get_schema(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Get a schema definition.

        Args:
            name: Name of the schema

        Returns:
            Schema definition or None if not found

        Raises:
            SchemaError: If schema retrieval fails
        """
        try:
            return self.schemas.get(name)
        except Exception as e:
            self.logger.error(f"Error getting schema: {e}")
            raise SchemaError(f"Failed to get schema: {e}")

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

    def resolve_references(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolve schema references.

        Args:
            schema: Schema definition with references

        Returns:
            Resolved schema definition

        Raises:
            ReferenceError: If reference resolution fails
        """
        try:
            resolver = jsonschema.RefResolver.from_schema(schema)
            return jsonschema.Draft7Validator(schema, resolver=resolver).schema
        except Exception as e:
            self.logger.error(f"Error resolving references: {e}")
            raise ReferenceError(f"Failed to resolve references: {e}") 