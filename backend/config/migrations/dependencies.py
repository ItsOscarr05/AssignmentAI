from typing import Dict, List, Set, Optional
from pathlib import Path
import yaml
from dataclasses import dataclass
from datetime import datetime

@dataclass
class MigrationDependency:
    name: str
    version: str
    required: bool
    description: Optional[str] = None

class MigrationDependencyManager:
    def __init__(self, migrations_dir: Path):
        self.migrations_dir = migrations_dir
        self.dependency_graph: Dict[str, Set[str]] = {}
        self._load_dependencies()

    def _load_dependencies(self):
        """Load all migration dependencies from YAML files"""
        for migration_file in self.migrations_dir.glob("*.yaml"):
            with open(migration_file, "r") as f:
                data = yaml.safe_load(f)
                migration_name = data["name"]
                dependencies = data.get("dependencies", [])
                self.dependency_graph[migration_name] = set(dep["name"] for dep in dependencies)

    def get_dependencies(self, migration_name: str) -> List[MigrationDependency]:
        """Get all dependencies for a migration"""
        with open(self.migrations_dir / f"{migration_name}.yaml", "r") as f:
            data = yaml.safe_load(f)
            return [
                MigrationDependency(
                    name=dep["name"],
                    version=dep.get("version", "any"),
                    required=dep.get("required", True),
                    description=dep.get("description")
                )
                for dep in data.get("dependencies", [])
            ]

    def get_dependents(self, migration_name: str) -> List[str]:
        """Get all migrations that depend on the given migration"""
        return [
            name for name, deps in self.dependency_graph.items()
            if migration_name in deps
        ]

    def validate_dependencies(self, migration_name: str) -> List[str]:
        """Validate dependencies for a migration"""
        errors = []
        dependencies = self.get_dependencies(migration_name)
        
        for dep in dependencies:
            if dep.required:
                dep_file = self.migrations_dir / f"{dep.name}.yaml"
                if not dep_file.exists():
                    errors.append(f"Required dependency {dep.name} not found")
                else:
                    with open(dep_file, "r") as f:
                        dep_data = yaml.safe_load(f)
                        if dep.version != "any" and dep_data["version"] != dep.version:
                            errors.append(
                                f"Dependency {dep.name} version mismatch: "
                                f"required {dep.version}, found {dep_data['version']}"
                            )
        
        return errors

    def check_circular_dependencies(self) -> List[List[str]]:
        """Check for circular dependencies in the migration graph"""
        cycles = []
        visited = set()
        path = []

        def dfs(node: str, current_path: List[str]):
            if node in current_path:
                cycle_start = current_path.index(node)
                cycles.append(current_path[cycle_start:])
                return
            
            if node in visited:
                return
            
            visited.add(node)
            path.append(node)
            
            for dep in self.dependency_graph.get(node, set()):
                dfs(dep, path.copy())
            
            path.pop()

        for node in self.dependency_graph:
            if node not in visited:
                dfs(node, [])

        return cycles

    def get_migration_order(self) -> List[str]:
        """Get the correct order for applying migrations"""
        visited = set()
        order = []
        
        def visit(node: str):
            if node in visited:
                return
            visited.add(node)
            
            for dep in self.dependency_graph.get(node, set()):
                visit(dep)
            
            order.append(node)
        
        for node in self.dependency_graph:
            visit(node)
        
        return order

    def get_migration_timeline(self) -> List[Dict]:
        """Get a timeline of migrations with their dependencies"""
        timeline = []
        for migration_file in self.migrations_dir.glob("*.yaml"):
            with open(migration_file, "r") as f:
                data = yaml.safe_load(f)
                timeline.append({
                    "name": data["name"],
                    "version": data["version"],
                    "created_at": data["created_at"],
                    "dependencies": self.get_dependencies(data["name"]),
                    "dependents": self.get_dependents(data["name"])
                })
        return sorted(timeline, key=lambda x: x["created_at"])

    def add_dependency(self, migration_name: str, dependency: MigrationDependency):
        """Add a dependency to a migration"""
        migration_file = self.migrations_dir / f"{migration_name}.yaml"
        if not migration_file.exists():
            raise FileNotFoundError(f"Migration {migration_name} not found")
        
        with open(migration_file, "r") as f:
            data = yaml.safe_load(f)
        
        if "dependencies" not in data:
            data["dependencies"] = []
        
        data["dependencies"].append({
            "name": dependency.name,
            "version": dependency.version,
            "required": dependency.required,
            "description": dependency.description
        })
        
        with open(migration_file, "w") as f:
            yaml.dump(data, f, default_flow_style=False)
        
        self._load_dependencies()

    def remove_dependency(self, migration_name: str, dependency_name: str):
        """Remove a dependency from a migration"""
        migration_file = self.migrations_dir / f"{migration_name}.yaml"
        if not migration_file.exists():
            raise FileNotFoundError(f"Migration {migration_name} not found")
        
        with open(migration_file, "r") as f:
            data = yaml.safe_load(f)
        
        if "dependencies" in data:
            data["dependencies"] = [
                dep for dep in data["dependencies"]
                if dep["name"] != dependency_name
            ]
        
        with open(migration_file, "w") as f:
            yaml.dump(data, f, default_flow_style=False)
        
        self._load_dependencies() 