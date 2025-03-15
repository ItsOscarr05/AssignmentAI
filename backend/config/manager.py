from typing import Dict, List, Optional, Any, Type, Union
from datetime import datetime
import logging
from dataclasses import dataclass
from .loader import ConfigurationLoader, LoadResult, LoaderError
from .validators import ConfigurationValidator, ValidationResult, ValidationError

logger = logging.getLogger(__name__)

class ManagerError(Exception):
    """Base exception for configuration management errors."""
    pass

class ConfigError(ManagerError):
    """Exception raised for configuration-related errors."""
    pass

class ValidationError(ManagerError):
    """Exception raised for validation errors."""
    pass

class LoadError(ManagerError):
    """Exception raised for loading errors."""
    pass

@dataclass
class ConfigResult:
    """Result of a configuration operation."""
    success: bool
    data: Optional[Dict[str, Any]]
    errors: List[str]
    warnings: List[str]

class ConfigurationManager:
    """Manages configuration loading, validation, and access."""

    def __init__(self, config_dir: str):
        """
        Initialize the ConfigurationManager.

        Args:
            config_dir: Directory containing configuration files
        """
        self.config_dir = config_dir
        self.logger = logging.getLogger(__name__)
        self.loader = ConfigurationLoader(config_dir)
        self.validator = ConfigurationValidator()
        self._config_cache: Dict[str, Dict[str, Any]] = {}

    def load_config(self, name: str, validate: bool = True) -> ConfigResult:
        """
        Load a configuration file.

        Args:
            name: Name of the configuration file
            validate: Whether to validate the configuration

        Returns:
            ConfigResult object

        Raises:
            LoadError: If loading fails
            ValidationError: If validation fails
        """
        try:
            # Try to load from cache first
            if name in self._config_cache:
                return ConfigResult(
                    success=True,
                    data=self._config_cache[name],
                    errors=[],
                    warnings=[]
                )

            # Load configuration file
            result = self.loader.load_yaml(f"{name}.yaml")
            if not result.success:
                raise LoadError(f"Failed to load configuration: {result.errors}")

            # Validate configuration if requested
            if validate and result.data:
                validation_result = self.validator.validate_config(name, result.data)
                if not validation_result.is_valid:
                    raise ValidationError(f"Configuration validation failed: {validation_result.errors}")

            # Cache the configuration
            if result.data:
                self._config_cache[name] = result.data

            return ConfigResult(
                success=True,
                data=result.data,
                errors=[],
                warnings=validation_result.warnings if validate else []
            )
        except Exception as e:
            self.logger.error(f"Error loading configuration: {e}")
            return ConfigResult(
                success=False,
                data=None,
                errors=[str(e)],
                warnings=[]
            )

    def save_config(self, name: str, data: Dict[str, Any], validate: bool = True) -> bool:
        """
        Save a configuration file.

        Args:
            name: Name of the configuration file
            data: Configuration data to save
            validate: Whether to validate before saving

        Returns:
            True if save succeeds, False otherwise

        Raises:
            ValidationError: If validation fails
            ConfigError: If saving fails
        """
        try:
            # Validate configuration if requested
            if validate:
                validation_result = self.validator.validate_config(name, data)
                if not validation_result.is_valid:
                    raise ValidationError(f"Configuration validation failed: {validation_result.errors}")

            # Save configuration file
            if not self.loader.save_yaml(f"{name}.yaml", data):
                raise ConfigError("Failed to save configuration")

            # Update cache
            self._config_cache[name] = data
            return True
        except Exception as e:
            self.logger.error(f"Error saving configuration: {e}")
            return False

    def get_config(self, name: str, key: Optional[str] = None) -> Any:
        """
        Get a configuration value.

        Args:
            name: Name of the configuration file
            key: Optional key to retrieve from the configuration

        Returns:
            Configuration value

        Raises:
            ConfigError: If configuration is not found
        """
        try:
            # Load configuration if not in cache
            if name not in self._config_cache:
                result = self.load_config(name)
                if not result.success:
                    raise ConfigError(f"Failed to load configuration: {result.errors}")

            # Get configuration data
            config = self._config_cache[name]
            if key:
                return config.get(key)
            return config
        except Exception as e:
            self.logger.error(f"Error getting configuration: {e}")
            raise ConfigError(f"Failed to get configuration: {e}")

    def update_config(self, name: str, key: str, value: Any) -> bool:
        """
        Update a configuration value.

        Args:
            name: Name of the configuration file
            key: Key to update
            value: New value

        Returns:
            True if update succeeds, False otherwise

        Raises:
            ConfigError: If update fails
        """
        try:
            # Get current configuration
            config = self.get_config(name)
            if not config:
                raise ConfigError("Configuration not found")

            # Update configuration
            config[key] = value

            # Save updated configuration
            return self.save_config(name, config)
        except Exception as e:
            self.logger.error(f"Error updating configuration: {e}")
            return False

    def delete_config(self, name: str) -> bool:
        """
        Delete a configuration file.

        Args:
            name: Name of the configuration file

        Returns:
            True if deletion succeeds, False otherwise

        Raises:
            ConfigError: If deletion fails
        """
        try:
            # Delete configuration file
            if not self.loader.delete_config_file(f"{name}.yaml"):
                raise ConfigError("Failed to delete configuration file")

            # Remove from cache
            if name in self._config_cache:
                del self._config_cache[name]
            return True
        except Exception as e:
            self.logger.error(f"Error deleting configuration: {e}")
            return False

    def list_configs(self) -> List[str]:
        """
        List all configuration files.

        Returns:
            List of configuration names

        Raises:
            ConfigError: If listing fails
        """
        try:
            return self.loader.list_config_files(".yaml")
        except Exception as e:
            self.logger.error(f"Error listing configurations: {e}")
            raise ConfigError(f"Failed to list configurations: {e}")

    def clear_cache(self) -> None:
        """Clear the configuration cache."""
        self._config_cache.clear() 