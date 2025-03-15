import json
import click
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
import yaml
import tempfile
import shutil
import time
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax
from rich.prompt import Confirm, Prompt
from rich import print as rprint

from config import settings
from .migrations import ConfigMigration
from .validate import ConfigValidationError, validate_config

# Set up logging with rich
console = Console()
logger = logging.getLogger(__name__)

def setup_logging(verbose: bool = False):
    """Set up logging with rich formatting"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[logging.FileHandler(console=console, rich_tracebacks=True)]
    )

@click.group()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
@click.option('--debug', '-d', is_flag=True, help='Enable debug mode')
def cli(verbose: bool, debug: bool):
    """Configuration Management CLI for AssignmentAI"""
    setup_logging(verbose)
    if debug:
        logger.setLevel(logging.DEBUG)

@cli.command()
@click.argument('name')
@click.argument('description')
@click.option('--template', '-t', type=click.Choice(['basic', 'security', 'performance']), default='basic',
              help='Migration template to use')
def create_migration(name: str, description: str, template: str):
    """Create a new migration file with optional template"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        task = progress.add_task("Creating migration...", total=100)
        
        migration_manager = ConfigMigration()
        
        # Load template
        template_path = Path(__file__).parent / "templates" / f"{template}_migration.yaml"
        if template_path.exists():
            with open(template_path, "r") as f:
                template_data = yaml.safe_load(f)
        else:
            template_data = {}
        
        # Create migration
        migration_path = migration_manager.create_migration(name, description, template_data)
        progress.update(task, completed=100)
    
    console.print(Panel(f"Created migration file: [green]{migration_path}[/green]"))
    console.print("\nNext steps:")
    console.print("1. Edit the migration file")
    console.print("2. Test the migration: [yellow]config-manager test-migration {migration_path}[/yellow]")
    console.print("3. Apply the migration: [yellow]config-manager apply-migration {migration_path}[/yellow]")

@cli.command()
@click.option('--status', '-s', type=click.Choice(['all', 'pending', 'applied']), default='all',
              help='Filter migrations by status')
@click.option('--environment', '-e', type=click.Choice(['development', 'staging', 'production']),
              help='Show environment-specific changes')
def list_migrations(status: str, environment: Optional[str]):
    """List all migrations with detailed status"""
    migration_manager = ConfigMigration()
    applied = set(migration_manager._get_applied_migrations())
    all_migrations = sorted(migration_manager.migrations_dir.glob("*.yaml"))
    
    table = Table(title="Migration Status", show_header=True, header_style="bold magenta")
    table.add_column("Status", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Version", style="yellow")
    table.add_column("Created", style="blue")
    table.add_column("Description", style="white")
    
    for migration in all_migrations:
        with open(migration, "r") as f:
            data = yaml.safe_load(f)
        
        migration_status = "✓ Applied" if migration in applied else "Pending"
        status_style = "green" if migration_status == "✓ Applied" else "yellow"
        
        if status == "all" or (status == "pending" and migration_status == "Pending") or \
           (status == "applied" and migration_status == "✓ Applied"):
            table.add_row(
                f"[{status_style}]{migration_status}[/{status_style}]",
                data["name"],
                data["version"],
                data["created_at"],
                data["description"]
            )
    
    console.print(table)
    
    if environment:
        console.print(f"\nEnvironment-specific changes for {environment}:")
        env_table = Table(show_header=True, header_style="bold magenta")
        env_table.add_column("Migration", style="green")
        env_table.add_column("Changes", style="white")
        
        for migration in all_migrations:
            with open(migration, "r") as f:
                data = yaml.safe_load(f)
            env_changes = data.get("environment_specific", {}).get(environment, {})
            if env_changes:
                env_table.add_row(
                    data["name"],
                    "\n".join(f"- {k}: {v}" for k, v in env_changes.items())
                )
        
        console.print(env_table)

@cli.command()
@click.argument('migration_path', type=click.Path(exists=True))
@click.option('--dry-run', is_flag=True, help='Show changes without applying them')
@click.option('--force', '-f', is_flag=True, help='Skip confirmation prompts')
def apply_migration(migration_path: str, dry_run: bool, force: bool):
    """Apply a specific migration with dry-run support"""
    migration_manager = ConfigMigration()
    
    with open(migration_path, "r") as f:
        migration = yaml.safe_load(f)
    
    if not force:
        console.print(Panel(f"Applying migration: [yellow]{migration['name']}[/yellow]\n"
                          f"Description: {migration['description']}\n"
                          f"Version: {migration['version']}"))
        
        if not Confirm.ask("Do you want to continue?"):
            return
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        # Pre-migration validation
        task = progress.add_task("Running pre-migration validation...", total=100)
        try:
            for rule in migration["validation_rules"]["pre"]:
                migration_manager._validate_rule(rule)
            progress.update(task, completed=100)
        except ConfigValidationError as e:
            console.print(f"[red]Pre-migration validation failed: {e}[/red]")
            return
        
        # Show changes
        if dry_run:
            console.print("\nChanges to be applied:")
            changes_table = Table(show_header=True, header_style="bold magenta")
            changes_table.add_column("Type", style="cyan")
            changes_table.add_column("Setting", style="green")
            changes_table.add_column("Value", style="yellow")
            
            for change_type, changes in migration["changes"].items():
                if isinstance(changes, dict):
                    for key, value in changes.items():
                        changes_table.add_row(change_type, key, str(value))
                elif isinstance(changes, list):
                    for key in changes:
                        changes_table.add_row(change_type, key, "N/A")
            
            console.print(changes_table)
            return
        
        # Apply changes
        task = progress.add_task("Applying changes...", total=100)
        try:
            migration_manager._apply_changes(migration["changes"])
            progress.update(task, completed=50)
            
            # Apply environment-specific changes
            env_changes = migration["environment_specific"].get(settings.environment, {})
            migration_manager._apply_changes(env_changes)
            progress.update(task, completed=100)
        except Exception as e:
            console.print(f"[red]Failed to apply changes: {e}[/red]")
            return
        
        # Post-migration validation
        task = progress.add_task("Running post-migration validation...", total=100)
        try:
            for rule in migration["validation_rules"]["post"]:
                migration_manager._validate_rule(rule)
            migration_manager.validator.validate_all()
            progress.update(task, completed=100)
        except ConfigValidationError as e:
            console.print(f"[red]Post-migration validation failed: {e}[/red]")
            return
    
    console.print("[green]Migration applied successfully![/green]")

@cli.command()
@click.argument('migration_path', type=click.Path(exists=True))
@click.option('--dry-run', is_flag=True, help='Show changes without applying them')
@click.option('--force', '-f', is_flag=True, help='Skip confirmation prompts')
def rollback_migration(migration_path: str, dry_run: bool, force: bool):
    """Rollback a specific migration with dry-run support"""
    migration_manager = ConfigMigration()
    
    with open(migration_path, "r") as f:
        migration = yaml.safe_load(f)
    
    if not force:
        console.print(Panel(f"Rolling back migration: [yellow]{migration['name']}[/yellow]\n"
                          f"Description: {migration['description']}\n"
                          f"Version: {migration['version']}"))
        
        if not Confirm.ask("Do you want to continue?"):
            return
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        # Show changes
        if dry_run:
            console.print("\nChanges to be reversed:")
            changes_table = Table(show_header=True, header_style="bold magenta")
            changes_table.add_column("Type", style="cyan")
            changes_table.add_column("Setting", style="green")
            changes_table.add_column("Value", style="yellow")
            
            for change_type, changes in migration["changes"].items():
                if isinstance(changes, dict):
                    for key, value in changes.items():
                        changes_table.add_row(change_type, key, str(value))
                elif isinstance(changes, list):
                    for key in changes:
                        changes_table.add_row(change_type, key, "N/A")
            
            console.print(changes_table)
            return
        
        # Reverse changes
        task = progress.add_task("Reversing changes...", total=100)
        try:
            migration_manager._reverse_changes(migration["changes"])
            progress.update(task, completed=50)
            
            # Reverse environment-specific changes
            env_changes = migration["environment_specific"].get(settings.environment, {})
            migration_manager._reverse_changes(env_changes)
            progress.update(task, completed=100)
        except Exception as e:
            console.print(f"[red]Failed to reverse changes: {e}[/red]")
            return
        
        # Validate configuration
        task = progress.add_task("Validating configuration...", total=100)
        try:
            migration_manager.validator.validate_all()
            progress.update(task, completed=100)
        except ConfigValidationError as e:
            console.print(f"[red]Configuration validation failed: {e}[/red]")
            return
    
    console.print("[green]Migration rolled back successfully![/green]")

@cli.command()
@click.option('--dry-run', is_flag=True, help='Show changes without applying them')
@click.option('--force', '-f', is_flag=True, help='Skip confirmation prompts')
def run_migrations(dry_run: bool, force: bool):
    """Run all pending migrations with progress tracking"""
    migration_manager = ConfigMigration()
    pending = migration_manager.get_pending_migrations()
    
    if not pending:
        console.print("[yellow]No pending migrations found[/yellow]")
        return
    
    if not force:
        console.print(Panel(f"Found [yellow]{len(pending)}[/yellow] pending migrations"))
        if not Confirm.ask("Do you want to continue?"):
            return
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        overall_task = progress.add_task("Running migrations...", total=len(pending))
        
        for migration in pending:
            with open(migration, "r") as f:
                data = yaml.safe_load(f)
            
            task = progress.add_task(f"Applying {data['name']}...", total=100)
            
            try:
                if dry_run:
                    console.print(f"\nChanges for {data['name']}:")
                    changes_table = Table(show_header=True, header_style="bold magenta")
                    changes_table.add_column("Type", style="cyan")
                    changes_table.add_column("Setting", style="green")
                    changes_table.add_column("Value", style="yellow")
                    
                    for change_type, changes in data["changes"].items():
                        if isinstance(changes, dict):
                            for key, value in changes.items():
                                changes_table.add_row(change_type, key, str(value))
                        elif isinstance(changes, list):
                            for key in changes:
                                changes_table.add_row(change_type, key, "N/A")
                    
                    console.print(changes_table)
                else:
                    if not migration_manager.apply_migration(migration):
                        raise Exception("Migration failed")
                
                progress.update(task, completed=100)
                progress.update(overall_task, advance=1)
            
            except Exception as e:
                console.print(f"[red]Failed to apply migration {data['name']}: {e}[/red]")
                if not force:
                    if not Confirm.ask("Continue with remaining migrations?"):
                        return
    
    if not dry_run:
        console.print("[green]All migrations completed successfully![/green]")

@cli.command()
@click.option('--format', '-f', type=click.Choice(['text', 'json', 'yaml']), default='text',
              help='Output format')
@click.option('--output', '-o', type=click.Path(), help='Output file path')
def validate(format: str, output: Optional[str]):
    """Validate current configuration with detailed reporting"""
    report = validate_config()
    
    if format == 'text':
        if report["valid"]:
            console.print("[green]Configuration is valid[/green]")
        else:
            console.print("[red]Configuration validation failed:[/red]")
            for error in report["errors"]:
                console.print(f"- [red]{error}[/red]")
        
        if report["warnings"]:
            console.print("\n[yellow]Warnings:[/yellow]")
            for warning in report["warnings"]:
                console.print(f"- [yellow]{warning}[/yellow]")
    
    elif format in ['json', 'yaml']:
        output_data = {
            "valid": report["valid"],
            "errors": report["errors"],
            "warnings": report["warnings"],
            "environment": report["environment"],
            "version": report["version"],
            "validation_timestamp": report["validation_timestamp"],
            "system_info": report["system_info"]
        }
        
        if output:
            with open(output, "w") as f:
                if format == 'json':
                    json.dump(output_data, f, indent=2)
                else:
                    yaml.dump(output_data, f, default_flow_style=False)
            console.print(f"[green]Report saved to {output}[/green]")
        else:
            if format == 'json':
                console.print(json.dumps(output_data, indent=2))
            else:
                console.print(yaml.dump(output_data, default_flow_style=False))

@cli.command()
@click.argument('migration_path', type=click.Path(exists=True))
@click.option('--show-diff', is_flag=True, help='Show configuration changes')
def test_migration(migration_path: str, show_diff: bool):
    """Test a migration in a temporary environment with detailed reporting"""
    migration_manager = ConfigMigration()
    temp_dir = tempfile.mkdtemp()
    
    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            # Setup task
            task = progress.add_task("Setting up test environment...", total=100)
            
            # Copy current configuration
            config_dir = Path("config")
            temp_config = Path(temp_dir) / "config"
            shutil.copytree(config_dir, temp_config)
            progress.update(task, completed=50)
            
            # Apply migration in temporary environment
            temp_migration = temp_config / "migrations" / Path(migration_path).name
            shutil.copy2(migration_path, temp_migration)
            progress.update(task, completed=100)
            
            # Run validation
            task = progress.add_task("Running validation...", total=100)
            report = validate_config()
            progress.update(task, completed=100)
        
        if report["valid"]:
            console.print("[green]Migration test successful![/green]")
            
            if show_diff:
                console.print("\nConfiguration changes:")
                diff_table = Table(show_header=True, header_style="bold magenta")
                diff_table.add_column("Setting", style="green")
                diff_table.add_column("Before", style="yellow")
                diff_table.add_column("After", style="cyan")
                
                with open(migration_path, "r") as f:
                    migration = yaml.safe_load(f)
                
                for change_type, changes in migration["changes"].items():
                    if isinstance(changes, dict):
                        for key, value in changes.items():
                            diff_table.add_row(key, "N/A", str(value))
                    elif isinstance(changes, list):
                        for key in changes:
                            diff_table.add_row(key, "N/A", "Removed")
                
                console.print(diff_table)
        else:
            console.print("[red]Migration test failed:[/red]")
            for error in report["errors"]:
                console.print(f"- [red]{error}[/red]")
            exit(1)
    
    finally:
        # Cleanup
        shutil.rmtree(temp_dir)

@cli.command()
@click.option('--format', '-f', type=click.Choice(['markdown', 'html']), default='markdown',
              help='Documentation format')
@click.option('--output', '-o', type=click.Path(), help='Output file path')
def generate_docs(format: str, output: Optional[str]):
    """Generate documentation for all migrations with rich formatting"""
    migration_manager = ConfigMigration()
    all_migrations = sorted(migration_manager.migrations_dir.glob("*.yaml"))
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console
    ) as progress:
        task = progress.add_task("Generating documentation...", total=len(all_migrations))
        
        if format == 'markdown':
            docs = ["# Configuration Migrations\n"]
            
            for migration in all_migrations:
                with open(migration, "r") as f:
                    data = yaml.safe_load(f)
                
                docs.extend([
                    f"## {data['name']}",
                    f"**Version:** {data['version']}",
                    f"**Created:** {data['created_at']}",
                    f"**Description:** {data['description']}\n",
                    "### Changes",
                    "#### Added",
                    *[f"- `{k}`" for k in data["changes"]["add"].keys()],
                    "\n#### Modified",
                    *[f"- `{k}`" for k in data["changes"]["modify"].keys()],
                    "\n#### Removed",
                    *[f"- `{k}`" for k in data["changes"]["remove"]],
                    "\n#### Deprecated",
                    *[f"- `{k}`" for k in data["changes"]["deprecate"]],
                    "\n### Environment-Specific Changes",
                    *[f"#### {env}\n" + "\n".join(f"- `{k}`" for k in changes.keys())
                      for env, changes in data["environment_specific"].items()],
                    "\n### Validation Rules",
                    "#### Pre-Migration",
                    *[f"- {rule['type']}: {rule['field']}" for rule in data["validation_rules"]["pre"]],
                    "\n#### Post-Migration",
                    *[f"- {rule['type']}: {rule['field']}" for rule in data["validation_rules"]["post"]],
                    "\n---\n"
                ])
                
                progress.update(task, advance=1)
            
            docs_path = output or Path("docs/migrations.md")
            docs_path.parent.mkdir(parents=True, exist_ok=True)
            with open(docs_path, "w") as f:
                f.write("\n".join(docs))
            
            console.print(f"[green]Documentation generated at {docs_path}[/green]")
        
        else:  # HTML format
            from jinja2 import Template
            import os
            
            template_path = Path(__file__).parent / "templates" / "migrations.html"
            with open(template_path, "r") as f:
                template = Template(f.read())
            
            migrations_data = []
            for migration in all_migrations:
                with open(migration, "r") as f:
                    data = yaml.safe_load(f)
                migrations_data.append(data)
                progress.update(task, advance=1)
            
            html = template.render(migrations=migrations_data)
            
            docs_path = output or Path("docs/migrations.html")
            docs_path.parent.mkdir(parents=True, exist_ok=True)
            with open(docs_path, "w") as f:
                f.write(html)
            
            console.print(f"[green]Documentation generated at {docs_path}[/green]")

if __name__ == "__main__":
    cli() 