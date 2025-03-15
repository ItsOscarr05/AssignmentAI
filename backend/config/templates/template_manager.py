from typing import Dict, List, Optional, Any
from pathlib import Path
import yaml
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TemplateField:
    name: str
    type: str
    description: str
    required: bool = True
    default: Optional[Any] = None
    validation: Optional[Dict] = None

@dataclass
class MigrationTemplate:
    name: str
    description: str
    fields: List[TemplateField]
    validation_rules: List[Dict]
    environment_specific: Dict[str, Dict]
    created_at: str
    version: str

class TemplateManager:
    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir
        self.templates: Dict[str, MigrationTemplate] = {}
        self._load_templates()

    def _load_templates(self):
        """Load all templates from YAML files"""
        for template_file in self.templates_dir.glob("*.yaml"):
            with open(template_file, "r") as f:
                data = yaml.safe_load(f)
                self.templates[data["name"]] = MigrationTemplate(
                    name=data["name"],
                    description=data["description"],
                    fields=[
                        TemplateField(**field)
                        for field in data["fields"]
                    ],
                    validation_rules=data["validation_rules"],
                    environment_specific=data["environment_specific"],
                    created_at=data["created_at"],
                    version=data["version"]
                )

    def get_template(self, name: str) -> Optional[MigrationTemplate]:
        """Get a template by name"""
        return self.templates.get(name)

    def list_templates(self) -> List[Dict]:
        """List all available templates"""
        return [
            {
                "name": template.name,
                "description": template.description,
                "version": template.version,
                "created_at": template.created_at,
                "field_count": len(template.fields)
            }
            for template in self.templates.values()
        ]

    def create_template(self, template: MigrationTemplate) -> Path:
        """Create a new template"""
        template_file = self.templates_dir / f"{template.name}.yaml"
        
        data = {
            "name": template.name,
            "description": template.description,
            "version": template.version,
            "created_at": template.created_at,
            "fields": [
                {
                    "name": field.name,
                    "type": field.type,
                    "description": field.description,
                    "required": field.required,
                    "default": field.default,
                    "validation": field.validation
                }
                for field in template.fields
            ],
            "validation_rules": template.validation_rules,
            "environment_specific": template.environment_specific
        }
        
        with open(template_file, "w") as f:
            yaml.dump(data, f, default_flow_style=False)
        
        self._load_templates()
        return template_file

    def update_template(self, name: str, template: MigrationTemplate) -> Path:
        """Update an existing template"""
        if name not in self.templates:
            raise ValueError(f"Template {name} not found")
        
        template_file = self.templates_dir / f"{name}.yaml"
        self.create_template(template)
        return template_file

    def delete_template(self, name: str):
        """Delete a template"""
        if name not in self.templates:
            raise ValueError(f"Template {name} not found")
        
        template_file = self.templates_dir / f"{name}.yaml"
        template_file.unlink()
        self._load_templates()

    def validate_template(self, name: str) -> List[str]:
        """Validate a template"""
        errors = []
        template = self.get_template(name)
        if not template:
            errors.append(f"Template {name} not found")
            return errors
        
        # Validate fields
        for field in template.fields:
            if field.required and field.default is None:
                errors.append(f"Required field {field.name} has no default value")
            
            if field.validation:
                if "type" in field.validation and field.validation["type"] != field.type:
                    errors.append(
                        f"Field {field.name} validation type mismatch: "
                        f"field type is {field.type}, validation type is {field.validation['type']}"
                    )
        
        # Validate environment-specific settings
        for env, settings in template.environment_specific.items():
            for field_name in settings:
                if not any(f.name == field_name for f in template.fields):
                    errors.append(
                        f"Environment {env} references unknown field {field_name}"
                    )
        
        return errors

    def generate_migration(self, template_name: str, values: Dict[str, Any]) -> Dict:
        """Generate a migration from a template and values"""
        template = self.get_template(template_name)
        if not template:
            raise ValueError(f"Template {template_name} not found")
        
        # Validate required fields
        for field in template.fields:
            if field.required and field.name not in values:
                if field.default is None:
                    raise ValueError(f"Required field {field.name} not provided")
                values[field.name] = field.default
        
        # Generate migration data
        migration_data = {
            "name": values.get("name", f"migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
            "version": "1.0.0",
            "description": values.get("description", ""),
            "created_at": datetime.now().isoformat(),
            "changes": {
                "add": {},
                "modify": {},
                "remove": [],
                "deprecate": []
            },
            "validation_rules": {
                "pre": template.validation_rules,
                "post": []
            },
            "environment_specific": {}
        }
        
        # Apply field values
        for field in template.fields:
            value = values.get(field.name, field.default)
            if value is not None:
                migration_data["changes"]["add"][field.name] = value
        
        # Apply environment-specific settings
        for env, settings in template.environment_specific.items():
            migration_data["environment_specific"][env] = {
                field_name: settings[field_name]
                for field_name in settings
                if field_name in values
            }
        
        return migration_data

    def get_template_documentation(self, name: str) -> Dict:
        """Get documentation for a template"""
        template = self.get_template(name)
        if not template:
            raise ValueError(f"Template {name} not found")
        
        return {
            "name": template.name,
            "description": template.description,
            "version": template.version,
            "created_at": template.created_at,
            "fields": [
                {
                    "name": field.name,
                    "type": field.type,
                    "description": field.description,
                    "required": field.required,
                    "default": field.default,
                    "validation": field.validation
                }
                for field in template.fields
            ],
            "validation_rules": template.validation_rules,
            "environment_specific": template.environment_specific,
            "example": self.generate_migration(name, {})
        } 