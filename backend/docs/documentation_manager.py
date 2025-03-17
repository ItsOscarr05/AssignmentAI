from typing import Dict, Any, List, Optional
import os
import re
import ast
import inspect
import logging
import json
import yaml
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from backend.config import settings

logger = logging.getLogger(__name__)

@dataclass
class DocItem:
    name: str
    type: str  # module, class, function, endpoint, config
    description: str
    source_file: str
    line_number: int
    category: str
    tags: List[str]
    examples: List[str] = None
    parameters: List[Dict[str, Any]] = None
    returns: Dict[str, Any] = None
    dependencies: List[str] = None
    last_updated: datetime = None

class DocumentationManager:
    def __init__(self):
        self.docs: Dict[str, DocItem] = {}
        self.templates_dir = Path(__file__).parent / "templates"
        self.output_dir = Path(__file__).parent / "generated"
        self.env = Environment(loader=FileSystemLoader(str(self.templates_dir)))
        self._setup_directories()

    def _setup_directories(self):
        """Create necessary directories if they don't exist"""
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create default templates if they don't exist
        self._create_default_templates()

    def _create_default_templates(self):
        """Create default documentation templates"""
        templates = {
            "module.md": """
# {{ module.name }}

{{ module.description }}

## Overview

{% if module.examples %}
### Examples
{% for example in module.examples %}
```python
{{ example }}
```
{% endfor %}
{% endif %}

## Components
{% for item in module.items %}
### {{ item.name }}
{{ item.description }}
{% endfor %}
""",
            "api.md": """
# API Documentation

{% for endpoint in endpoints %}
## {{ endpoint.name }}

**Method:** {{ endpoint.method }}
**Path:** {{ endpoint.path }}

{{ endpoint.description }}

### Parameters
{% for param in endpoint.parameters %}
- `{{ param.name }}` ({{ param.type }}): {{ param.description }}
{% endfor %}

### Response
```json
{{ endpoint.response_example | tojson(indent=2) }}
```
{% endfor %}
""",
            "architecture.md": """
# System Architecture

## Overview
{{ overview }}

## Components
{% for component in components %}
### {{ component.name }}
{{ component.description }}

#### Responsibilities
{% for responsibility in component.responsibilities %}
- {{ responsibility }}
{% endfor %}

#### Dependencies
{% for dependency in component.dependencies %}
- {{ dependency }}
{% endfor %}
{% endfor %}

## Data Flow
{{ data_flow }}

## Deployment
{{ deployment }}
""",
            "runbook.md": """
# Operational Runbook

## Common Operations
{% for operation in operations %}
### {{ operation.name }}
{{ operation.description }}

**Steps:**
{% for step in operation.steps %}
1. {{ step }}
{% endfor %}

{% if operation.troubleshooting %}
**Troubleshooting:**
{% for issue in operation.troubleshooting %}
- {{ issue.problem }}: {{ issue.solution }}
{% endfor %}
{% endif %}
{% endfor %}

## Monitoring
{{ monitoring }}

## Alerts
{% for alert in alerts %}
### {{ alert.name }}
{{ alert.description }}
**Severity:** {{ alert.severity }}
**Action:** {{ alert.action }}
{% endfor %}
"""
        }
        
        for name, content in templates.items():
            template_path = self.templates_dir / name
            if not template_path.exists():
                template_path.write_text(content.lstrip())

    async def generate_module_docs(self, module_path: str) -> DocItem:
        """Generate documentation for a Python module"""
        try:
            with open(module_path, 'r') as f:
                module_content = f.read()
            
            module_ast = ast.parse(module_content)
            module_name = Path(module_path).stem
            
            # Extract module docstring
            module_doc = ast.get_docstring(module_ast) or "No description available"
            
            # Find all classes and functions
            items = []
            for node in module_ast.body:
                if isinstance(node, (ast.ClassDef, ast.FunctionDef)):
                    items.append(self._parse_node(node))
            
            doc_item = DocItem(
                name=module_name,
                type="module",
                description=module_doc,
                source_file=module_path,
                line_number=1,
                category="code",
                tags=["module"],
                examples=self._extract_examples(module_doc),
                dependencies=self._find_dependencies(module_content)
            )
            
            self.docs[module_name] = doc_item
            return doc_item
        
        except Exception as e:
            logger.error(f"Failed to generate docs for module {module_path}: {str(e)}")
            raise

    def _parse_node(self, node: ast.AST) -> Dict[str, Any]:
        """Parse an AST node (class or function)"""
        doc = ast.get_docstring(node) or "No description available"
        
        item = {
            "name": node.name,
            "type": "class" if isinstance(node, ast.ClassDef) else "function",
            "description": doc,
            "line_number": node.lineno
        }
        
        if isinstance(node, ast.FunctionDef):
            item["parameters"] = self._parse_function_parameters(node)
            item["returns"] = self._parse_function_returns(node)
        
        return item

    def _parse_function_parameters(self, node: ast.FunctionDef) -> List[Dict[str, Any]]:
        """Parse function parameters from AST"""
        params = []
        for arg in node.args.args:
            param = {
                "name": arg.arg,
                "type": "Any"  # Default type
            }
            
            # Try to get type annotation
            if arg.annotation:
                if isinstance(arg.annotation, ast.Name):
                    param["type"] = arg.annotation.id
                elif isinstance(arg.annotation, ast.Subscript):
                    param["type"] = self._format_type_annotation(arg.annotation)
            
            params.append(param)
        
        return params

    def _parse_function_returns(self, node: ast.FunctionDef) -> Optional[Dict[str, Any]]:
        """Parse function return annotation from AST"""
        if node.returns:
            if isinstance(node.returns, ast.Name):
                return {"type": node.returns.id}
            elif isinstance(node.returns, ast.Subscript):
                return {"type": self._format_type_annotation(node.returns)}
        return None

    def _format_type_annotation(self, node: ast.Subscript) -> str:
        """Format complex type annotations"""
        if isinstance(node.value, ast.Name):
            base = node.value.id
            if isinstance(node.slice, ast.Name):
                return f"{base}[{node.slice.id}]"
            elif isinstance(node.slice, ast.Tuple):
                params = []
                for elt in node.slice.elts:
                    if isinstance(elt, ast.Name):
                        params.append(elt.id)
                return f"{base}[{', '.join(params)}]"
        return "Any"

    def _extract_examples(self, docstring: str) -> List[str]:
        """Extract code examples from docstring"""
        if not docstring:
            return []
        
        examples = []
        for match in re.finditer(r'```python\n(.*?)\n```', docstring, re.DOTALL):
            examples.append(match.group(1).strip())
        return examples

    def _find_dependencies(self, content: str) -> List[str]:
        """Find module dependencies from imports"""
        deps = []
        for line in content.split('\n'):
            if line.startswith(('import ', 'from ')):
                # Remove 'import' and 'from' keywords and clean up
                dep = line.replace('import ', '').replace('from ', '').split(' as ')[0]
                deps.append(dep.split('.')[0])  # Get top-level package
        return list(set(deps))  # Remove duplicates

    async def generate_api_docs(self, app) -> List[DocItem]:
        """Generate documentation for FastAPI endpoints"""
        api_docs = []
        
        for route in app.routes:
            if hasattr(route, "endpoint"):
                doc = DocItem(
                    name=route.name or str(route.path),
                    type="endpoint",
                    description=route.endpoint.__doc__ or "No description available",
                    source_file=inspect.getsourcefile(route.endpoint),
                    line_number=inspect.getsourcelines(route.endpoint)[1],
                    category="api",
                    tags=["endpoint", route.methods[0].lower()],
                    parameters=self._extract_endpoint_parameters(route),
                    returns=self._extract_endpoint_response(route)
                )
                api_docs.append(doc)
                self.docs[doc.name] = doc
        
        return api_docs

    def _extract_endpoint_parameters(self, route) -> List[Dict[str, Any]]:
        """Extract parameters from endpoint"""
        params = []
        if hasattr(route, "dependencies"):
            for dep in route.dependencies:
                if hasattr(dep, "model"):
                    for field_name, field in dep.model.__fields__.items():
                        params.append({
                            "name": field_name,
                            "type": str(field.type_),
                            "required": field.required,
                            "description": field.field_info.description or "No description"
                        })
        return params

    def _extract_endpoint_response(self, route) -> Dict[str, Any]:
        """Extract response schema from endpoint"""
        if hasattr(route, "response_model"):
            return {
                "type": str(route.response_model),
                "schema": route.response_model.schema()
            }
        return None

    async def generate_architecture_docs(self) -> str:
        """Generate system architecture documentation"""
        components = self._analyze_system_components()
        data_flow = self._analyze_data_flow()
        deployment = self._analyze_deployment()
        
        template = self.env.get_template("architecture.md")
        return template.render(
            overview="System architecture overview",
            components=components,
            data_flow=data_flow,
            deployment=deployment
        )

    def _analyze_system_components(self) -> List[Dict[str, Any]]:
        """Analyze and document system components"""
        components = []
        
        # Group docs by category
        categorized_docs = {}
        for doc in self.docs.values():
            if doc.category not in categorized_docs:
                categorized_docs[doc.category] = []
            categorized_docs[doc.category].append(doc)
        
        # Create component documentation
        for category, docs in categorized_docs.items():
            component = {
                "name": category.title(),
                "description": f"Components related to {category}",
                "responsibilities": [
                    f"Handle {doc.name}" for doc in docs
                ],
                "dependencies": list(set(
                    dep
                    for doc in docs
                    if doc.dependencies
                    for dep in doc.dependencies
                ))
            }
            components.append(component)
        
        return components

    def _analyze_data_flow(self) -> str:
        """Analyze and document system data flow"""
        # This would typically involve analyzing the relationships between
        # components and documenting how data flows through the system
        return """
        1. Client sends request to API endpoint
        2. Request is validated and authenticated
        3. Business logic is processed
        4. Data is stored or retrieved from database
        5. Response is formatted and returned to client
        """

    def _analyze_deployment(self) -> str:
        """Analyze and document deployment configuration"""
        return f"""
        Deployment Configuration:
        - Environment: {settings.ENVIRONMENT}
        - Workers: {settings.WORKERS}
        - Regions: {', '.join(settings.REGIONS)}
        - Monitoring: {'Enabled' if settings.TELEMETRY_ENABLED else 'Disabled'}
        """

    async def generate_runbooks(self) -> str:
        """Generate operational runbooks"""
        operations = self._collect_operations()
        monitoring = self._collect_monitoring_info()
        alerts = self._collect_alerts()
        
        template = self.env.get_template("runbook.md")
        return template.render(
            operations=operations,
            monitoring=monitoring,
            alerts=alerts
        )

    def _collect_operations(self) -> List[Dict[str, Any]]:
        """Collect common operations and their procedures"""
        return [
            {
                "name": "Database Backup",
                "description": "Perform database backup",
                "steps": [
                    "Stop write operations",
                    "Execute backup command",
                    "Verify backup integrity",
                    "Resume operations"
                ],
                "troubleshooting": [
                    {
                        "problem": "Backup fails",
                        "solution": "Check disk space and permissions"
                    }
                ]
            },
            {
                "name": "Performance Optimization",
                "description": "Optimize system performance",
                "steps": [
                    "Monitor system metrics",
                    "Identify bottlenecks",
                    "Apply optimization strategies",
                    "Verify improvements"
                ]
            }
        ]

    def _collect_monitoring_info(self) -> str:
        """Collect monitoring configuration and procedures"""
        return f"""
        Monitoring Configuration:
        - Metrics Port: {settings.METRICS_PORT}
        - Log Level: {settings.LOG_LEVEL}
        - Performance Thresholds:
          - CPU: {settings.PERFORMANCE_THRESHOLD_CPU}%
          - Memory: {settings.PERFORMANCE_THRESHOLD_MEMORY}%
        """

    def _collect_alerts(self) -> List[Dict[str, Any]]:
        """Collect alert configurations and procedures"""
        return [
            {
                "name": "High CPU Usage",
                "description": "CPU usage exceeds threshold",
                "severity": "High",
                "action": "Scale up resources or optimize workload"
            },
            {
                "name": "Database Connection Failure",
                "description": "Unable to connect to database",
                "severity": "Critical",
                "action": "Check database health and network connectivity"
            }
        ]

    async def generate_all_documentation(self) -> None:
        """Generate all documentation"""
        try:
            # Generate module documentation
            for root, _, files in os.walk(settings.APP_NAME.lower()):
                for file in files:
                    if file.endswith('.py'):
                        await self.generate_module_docs(os.path.join(root, file))
            
            # Generate architecture documentation
            arch_doc = await self.generate_architecture_docs()
            (self.output_dir / "architecture.md").write_text(arch_doc)
            
            # Generate runbooks
            runbook_doc = await self.generate_runbooks()
            (self.output_dir / "runbook.md").write_text(runbook_doc)
            
            # Generate index
            await self.generate_documentation_index()
            
            logger.info("Documentation generation completed successfully")
        
        except Exception as e:
            logger.error(f"Documentation generation failed: {str(e)}")
            raise

    async def generate_documentation_index(self) -> None:
        """Generate documentation index"""
        index = {
            "generated_at": datetime.now().isoformat(),
            "version": settings.VERSION,
            "sections": {
                "architecture": "architecture.md",
                "api": "api.md",
                "runbook": "runbook.md",
                "modules": {}
            }
        }
        
        # Add module documentation to index
        for name, doc in self.docs.items():
            if doc.type == "module":
                index["sections"]["modules"][name] = f"modules/{name}.md"
        
        # Write index
        with open(self.output_dir / "index.json", 'w') as f:
            json.dump(index, f, indent=2)

# Global documentation manager instance
documentation_manager = DocumentationManager() 