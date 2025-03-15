from typing import Dict, List, Optional, Any, Type, Union
from datetime import datetime
import logging
import os
import yaml
import json
from dataclasses import dataclass

logger = logging.getLogger(__name__)

class LoaderError(Exception):
    """Base exception for configuration loading errors."""
    pass

class FileError(LoaderError):
    """Exception raised for file-related errors."""
    pass

class FormatError(LoaderError):
    """Exception raised for format-related errors."""
    pass

class ValidationError(LoaderError):
    """Exception raised for validation errors."""
    pass

@dataclass
class LoadResult:
    """Result of a configuration load operation."""
    success: bool
    data: Optional[Dict[str, Any]]
    errors: List[str]
    warnings: List[str]

class ConfigurationLoader:
    """Loads and validates configuration files."""

    def __init__(self, config_dir: str):
        """
        Initialize the ConfigurationLoader.

        Args:
            config_dir: Directory containing configuration files
        """
        self.config_dir = config_dir
        self.logger = logging.getLogger(__name__)
        self._ensure_config_dir()

    def _ensure_config_dir(self) -> None:
        """Ensure the configuration directory exists."""
        try:
            os.makedirs(self.config_dir, exist_ok=True)
        except Exception as e:
            self.logger.error(f"Error creating config directory: {e}")
            raise FileError(f"Failed to create config directory: {e}")

    def load_yaml(self, filename: str) -> LoadResult:
        """
        Load a YAML configuration file.

        Args:
            filename: Name of the YAML file to load

        Returns:
            LoadResult object

        Raises:
            FileError: If file operations fail
            FormatError: If YAML parsing fails
        """
        try:
            filepath = os.path.join(self.config_dir, filename)
            if not os.path.exists(filepath):
                raise FileError(f"File not found: {filepath}")

            with open(filepath, 'r') as f:
                try:
                    data = yaml.safe_load(f)
                    return LoadResult(
                        success=True,
                        data=data,
                        errors=[],
                        warnings=[]
                    )
                except yaml.YAMLError as e:
                    raise FormatError(f"Invalid YAML format: {e}")
        except Exception as e:
            self.logger.error(f"Error loading YAML file: {e}")
            return LoadResult(
                success=False,
                data=None,
                errors=[str(e)],
                warnings=[]
            )

    def load_json(self, filename: str) -> LoadResult:
        """
        Load a JSON configuration file.

        Args:
            filename: Name of the JSON file to load

        Returns:
            LoadResult object

        Raises:
            FileError: If file operations fail
            FormatError: If JSON parsing fails
        """
        try:
            filepath = os.path.join(self.config_dir, filename)
            if not os.path.exists(filepath):
                raise FileError(f"File not found: {filepath}")

            with open(filepath, 'r') as f:
                try:
                    data = json.load(f)
                    return LoadResult(
                        success=True,
                        data=data,
                        errors=[],
                        warnings=[]
                    )
                except json.JSONDecodeError as e:
                    raise FormatError(f"Invalid JSON format: {e}")
        except Exception as e:
            self.logger.error(f"Error loading JSON file: {e}")
            return LoadResult(
                success=False,
                data=None,
                errors=[str(e)],
                warnings=[]
            )

    def save_yaml(self, filename: str, data: Dict[str, Any]) -> bool:
        """
        Save data to a YAML configuration file.

        Args:
            filename: Name of the YAML file to save
            data: Data to save

        Returns:
            True if save succeeds, False otherwise

        Raises:
            FileError: If file operations fail
            FormatError: If YAML serialization fails
        """
        try:
            filepath = os.path.join(self.config_dir, filename)
            with open(filepath, 'w') as f:
                yaml.dump(data, f, default_flow_style=False)
            return True
        except Exception as e:
            self.logger.error(f"Error saving YAML file: {e}")
            return False

    def save_json(self, filename: str, data: Dict[str, Any]) -> bool:
        """
        Save data to a JSON configuration file.

        Args:
            filename: Name of the JSON file to save
            data: Data to save

        Returns:
            True if save succeeds, False otherwise

        Raises:
            FileError: If file operations fail
            FormatError: If JSON serialization fails
        """
        try:
            filepath = os.path.join(self.config_dir, filename)
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=4)
            return True
        except Exception as e:
            self.logger.error(f"Error saving JSON file: {e}")
            return False

    def list_config_files(self, extension: Optional[str] = None) -> List[str]:
        """
        List configuration files in the config directory.

        Args:
            extension: Optional file extension to filter by

        Returns:
            List of filenames

        Raises:
            FileError: If directory listing fails
        """
        try:
            files = os.listdir(self.config_dir)
            if extension:
                files = [f for f in files if f.endswith(extension)]
            return files
        except Exception as e:
            self.logger.error(f"Error listing config files: {e}")
            raise FileError(f"Failed to list config files: {e}")

    def delete_config_file(self, filename: str) -> bool:
        """
        Delete a configuration file.

        Args:
            filename: Name of the file to delete

        Returns:
            True if deletion succeeds, False otherwise

        Raises:
            FileError: If file deletion fails
        """
        try:
            filepath = os.path.join(self.config_dir, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error deleting config file: {e}")
            return False 