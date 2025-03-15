from typing import Dict, List, Optional, Any, Type, Union
from datetime import datetime
import logging
from dataclasses import dataclass
import jinja2
import os

logger = logging.getLogger(__name__)

class TemplateError(Exception):
    """Base exception for template-related errors."""
    pass

class RenderError(TemplateError):
    """Exception raised for template rendering errors."""
    pass

class ValidationError(TemplateError):
    """Exception raised for template validation errors."""
    pass

class LoadError(TemplateError):
    """Exception raised for template loading errors."""
    pass

@dataclass
class TemplateResult:
    """Result of a template operation."""
    success: bool
    data: Optional[str]
    errors: List[str]
    warnings: List[str]

class ConfigurationTemplates:
    """Manages configuration templates."""

    def __init__(self, template_dir: str):
        """
        Initialize the ConfigurationTemplates.

        Args:
            template_dir: Directory containing template files
        """
        self.template_dir = template_dir
        self.logger = logging.getLogger(__name__)
        self._ensure_template_dir()
        self._load_templates()

    def _ensure_template_dir(self) -> None:
        """Ensure the template directory exists."""
        try:
            os.makedirs(self.template_dir, exist_ok=True)
        except Exception as e:
            self.logger.error(f"Error creating template directory: {e}")
            raise LoadError(f"Failed to create template directory: {e}")

    def _load_templates(self) -> None:
        """Load all template files."""
        try:
            self.templates = {}
            for filename in os.listdir(self.template_dir):
                if filename.endswith('.jinja2'):
                    name = filename[:-7]  # Remove .jinja2 extension
                    self.templates[name] = self._load_template(filename)
        except Exception as e:
            self.logger.error(f"Error loading templates: {e}")
            raise LoadError(f"Failed to load templates: {e}")

    def _load_template(self, filename: str) -> jinja2.Template:
        """
        Load a template file.

        Args:
            filename: Name of the template file

        Returns:
            Jinja2 template object

        Raises:
            LoadError: If template loading fails
        """
        try:
            filepath = os.path.join(self.template_dir, filename)
            with open(filepath, 'r') as f:
                return jinja2.Template(f.read())
        except Exception as e:
            self.logger.error(f"Error loading template {filename}: {e}")
            raise LoadError(f"Failed to load template {filename}: {e}")

    def render_template(self, name: str, context: Dict[str, Any]) -> TemplateResult:
        """
        Render a template with the given context.

        Args:
            name: Name of the template to render
            context: Dictionary of template variables

        Returns:
            TemplateResult object

        Raises:
            RenderError: If template rendering fails
        """
        try:
            if name not in self.templates:
                raise RenderError(f"Template '{name}' not found")

            template = self.templates[name]
            rendered = template.render(**context)

            return TemplateResult(
                success=True,
                data=rendered,
                errors=[],
                warnings=[]
            )
        except Exception as e:
            self.logger.error(f"Error rendering template: {e}")
            return TemplateResult(
                success=False,
                data=None,
                errors=[str(e)],
                warnings=[]
            )

    def validate_template(self, name: str, context: Dict[str, Any]) -> bool:
        """
        Validate a template with the given context.

        Args:
            name: Name of the template to validate
            context: Dictionary of template variables

        Returns:
            True if validation succeeds, False otherwise

        Raises:
            ValidationError: If validation fails
        """
        try:
            if name not in self.templates:
                raise ValidationError(f"Template '{name}' not found")

            template = self.templates[name]
            template.render(**context)
            return True
        except Exception as e:
            self.logger.error(f"Error validating template: {e}")
            raise ValidationError(f"Failed to validate template: {e}")

    def create_template(self, name: str, content: str) -> bool:
        """
        Create a new template file.

        Args:
            name: Name of the template
            content: Template content

        Returns:
            True if creation succeeds, False otherwise

        Raises:
            LoadError: If template creation fails
        """
        try:
            filename = f"{name}.jinja2"
            filepath = os.path.join(self.template_dir, filename)

            # Validate template content
            try:
                jinja2.Template(content)
            except jinja2.TemplateSyntaxError as e:
                raise LoadError(f"Invalid template syntax: {e}")

            # Save template file
            with open(filepath, 'w') as f:
                f.write(content)

            # Reload templates
            self._load_templates()
            return True
        except Exception as e:
            self.logger.error(f"Error creating template: {e}")
            return False

    def update_template(self, name: str, content: str) -> bool:
        """
        Update an existing template file.

        Args:
            name: Name of the template
            content: New template content

        Returns:
            True if update succeeds, False otherwise

        Raises:
            LoadError: If template update fails
        """
        try:
            if name not in self.templates:
                raise LoadError(f"Template '{name}' not found")

            return self.create_template(name, content)
        except Exception as e:
            self.logger.error(f"Error updating template: {e}")
            return False

    def delete_template(self, name: str) -> bool:
        """
        Delete a template file.

        Args:
            name: Name of the template

        Returns:
            True if deletion succeeds, False otherwise

        Raises:
            LoadError: If template deletion fails
        """
        try:
            filename = f"{name}.jinja2"
            filepath = os.path.join(self.template_dir, filename)

            if os.path.exists(filepath):
                os.remove(filepath)
                if name in self.templates:
                    del self.templates[name]
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error deleting template: {e}")
            return False

    def list_templates(self) -> List[str]:
        """
        List all template files.

        Returns:
            List of template names

        Raises:
            LoadError: If listing fails
        """
        try:
            return list(self.templates.keys())
        except Exception as e:
            self.logger.error(f"Error listing templates: {e}")
            raise LoadError(f"Failed to list templates: {e}")

    def get_template_content(self, name: str) -> Optional[str]:
        """
        Get the content of a template file.

        Args:
            name: Name of the template

        Returns:
            Template content or None if not found

        Raises:
            LoadError: If template content retrieval fails
        """
        try:
            if name not in self.templates:
                return None

            filename = f"{name}.jinja2"
            filepath = os.path.join(self.template_dir, filename)

            with open(filepath, 'r') as f:
                return f.read()
        except Exception as e:
            self.logger.error(f"Error getting template content: {e}")
            raise LoadError(f"Failed to get template content: {e}") 