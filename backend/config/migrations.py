import logging
import re
from typing import Dict, List, Any, Optional
from pathlib import Path
import json
import yaml
from datetime import datetime
from .settings import settings
from .validate import ConfigValidator, ConfigValidationError

logger = logging.getLogger(__name__)

class ConfigMigration:
    def __init__(self):
        self.migrations_dir = Path("config/migrations")
        self.migrations_dir.mkdir(parents=True, exist_ok=True)
        self.validator = ConfigValidator()
    
    def create_migration(self, name: str, description: str) -> str:
        """Create a new migration file"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        migration_name = f"{timestamp}_{name}.yaml"
        migration_path = self.migrations_dir / migration_name
        
        migration = {
            "version": timestamp,
            "name": name,
            "description": description,
            "created_at": datetime.utcnow().isoformat(),
            "changes": {
                "add": {},
                "modify": {},
                "remove": [],
                "deprecate": []
            },
            "environment_specific": {
                "development": {},
                "staging": {},
                "production": {}
            },
            "validation_rules": {
                "pre": [],
                "post": []
            }
        }
        
        with open(migration_path, "w") as f:
            yaml.dump(migration, f, default_flow_style=False)
        
        return migration_path
    
    def apply_migration(self, migration_path: Path) -> bool:
        """Apply a migration file"""
        try:
            with open(migration_path, "r") as f:
                migration = yaml.safe_load(f)
            
            # Run pre-migration validation
            for rule in migration["validation_rules"]["pre"]:
                self._validate_rule(rule)
            
            # Apply changes
            self._apply_changes(migration["changes"])
            
            # Apply environment-specific changes
            env_changes = migration["environment_specific"].get(settings.environment, {})
            self._apply_changes(env_changes)
            
            # Run post-migration validation
            for rule in migration["validation_rules"]["post"]:
                self._validate_rule(rule)
            
            # Validate final configuration
            self.validator.validate_all()
            
            logger.info(f"Successfully applied migration: {migration['name']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to apply migration {migration_path}: {str(e)}")
            return False
    
    def rollback_migration(self, migration_path: Path) -> bool:
        """Rollback a migration"""
        try:
            with open(migration_path, "r") as f:
                migration = yaml.safe_load(f)
            
            # Reverse changes
            self._reverse_changes(migration["changes"])
            
            # Reverse environment-specific changes
            env_changes = migration["environment_specific"].get(settings.environment, {})
            self._reverse_changes(env_changes)
            
            # Validate configuration after rollback
            self.validator.validate_all()
            
            logger.info(f"Successfully rolled back migration: {migration['name']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to rollback migration {migration_path}: {str(e)}")
            return False
    
    def get_pending_migrations(self) -> List[Path]:
        """Get list of pending migrations"""
        applied_migrations = self._get_applied_migrations()
        all_migrations = sorted(self.migrations_dir.glob("*.yaml"))
        return [m for m in all_migrations if m not in applied_migrations]
    
    def _apply_changes(self, changes: Dict[str, Any]) -> None:
        """Apply configuration changes"""
        # Add new settings
        for key, value in changes.get("add", {}).items():
            setattr(settings, key, value)
        
        # Modify existing settings
        for key, value in changes.get("modify", {}).items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        # Remove deprecated settings
        for key in changes.get("remove", []):
            if hasattr(settings, key):
                delattr(settings, key)
    
    def _reverse_changes(self, changes: Dict[str, Any]) -> None:
        """Reverse configuration changes"""
        # Restore removed settings
        for key in changes.get("remove", []):
            if key in changes.get("add", {}):
                setattr(settings, key, changes["add"][key])
        
        # Restore modified settings
        for key, value in changes.get("modify", {}).items():
            if hasattr(settings, key):
                setattr(settings, key, value)
    
    def _validate_rule(self, rule: Dict[str, Any]) -> None:
        """Validate a migration rule"""
        rule_type = rule.get("type")
        if rule_type == "required":
            if not hasattr(settings, rule["field"]):
                raise ConfigValidationError(f"Required field {rule['field']} is missing")
        elif rule_type == "format":
            value = getattr(settings, rule["field"], None)
            if value and not re.match(rule["pattern"], str(value)):
                raise ConfigValidationError(f"Field {rule['field']} does not match required format")
        elif rule_type == "range":
            value = getattr(settings, rule["field"], None)
            if value is not None:
                if "min" in rule and value < rule["min"]:
                    raise ConfigValidationError(f"Field {rule['field']} is below minimum value")
                if "max" in rule and value > rule["max"]:
                    raise ConfigValidationError(f"Field {rule['field']} is above maximum value")
    
    def _get_applied_migrations(self) -> List[Path]:
        """Get list of already applied migrations"""
        applied_file = self.migrations_dir / "applied.json"
        if applied_file.exists():
            with open(applied_file, "r") as f:
                return [Path(p) for p in json.load(f)]
        return []

def run_migrations() -> bool:
    """Run all pending migrations"""
    migration_manager = ConfigMigration()
    pending_migrations = migration_manager.get_pending_migrations()
    
    if not pending_migrations:
        logger.info("No pending migrations found")
        return True
    
    success = True
    for migration in pending_migrations:
        if not migration_manager.apply_migration(migration):
            success = False
            break
    
    return success

if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Run migrations
    success = run_migrations()
    
    # Exit with appropriate status code
    exit(0 if success else 1) 