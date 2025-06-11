import asyncio
import os
import subprocess
import shutil
from datetime import datetime, timedelta
from pathlib import Path
import tarfile
from typing import Optional, List
import logging
from app.core.config import settings
from app.services.logging_service import logger

class BackupService:
    def __init__(self):
        self.backup_dir = Path(settings.BACKUP_DIR)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.max_backups = settings.MAX_BACKUPS
        self.retention_days = settings.BACKUP_RETENTION_DAYS

    async def create_database_backup(self) -> Optional[str]:
        """Create a database backup using pg_dump."""
        try:
            # Parse database URL to get credentials
            db_url = settings.DATABASE_URL
            db_name = db_url.split('/')[-1]
            db_user = db_url.split('://')[1].split(':')[0]
            db_host = db_url.split('@')[1].split(':')[0]
            db_port = db_url.split(':')[-1].split('/')[0]

            # Create backup filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f"db_backup_{timestamp}.sql"

            # Construct pg_dump command
            cmd = [
                'pg_dump',
                '-h', db_host,
                '-p', db_port,
                '-U', db_user,
                '-d', db_name,
                '-F', 'c',  # Custom format
                '-f', str(backup_file)
            ]

            # Set PGPASSWORD environment variable
            env = os.environ.copy()
            env['PGPASSWORD'] = db_url.split(':')[2].split('@')[0]

            # Execute backup
            process = await asyncio.create_subprocess_exec(
                *cmd,
                env=env,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.error(f"Database backup failed: {stderr.decode()}")
                return None

            logger.info(f"Database backup created successfully: {backup_file}")
            return str(backup_file)

        except Exception as e:
            logger.error(f"Error creating database backup: {str(e)}")
            return None

    async def create_file_backup(self) -> Optional[str]:
        """Create a backup of uploaded files."""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir = self.backup_dir / f"files_backup_{timestamp}"
            uploads_dir = Path(settings.UPLOAD_DIR)

            # Create backup directory
            backup_dir.mkdir(parents=True, exist_ok=True)

            # Copy files
            shutil.copytree(uploads_dir, backup_dir / "uploads")

            # Create archive
            archive_file = self.backup_dir / f"files_backup_{timestamp}.tar.gz"
            with tarfile.open(archive_file, "w:gz") as tar:
                tar.add(backup_dir, arcname=os.path.basename(backup_dir))

            # Clean up temporary directory
            shutil.rmtree(backup_dir)

            logger.info(f"File backup created successfully: {archive_file}")
            return str(archive_file)

        except Exception as e:
            logger.error(f"Error creating file backup: {str(e)}")
            return None

    async def restore_database_backup(self, backup_file: str) -> bool:
        """Restore database from a backup file."""
        try:
            # Parse database URL
            db_url = settings.DATABASE_URL
            db_name = db_url.split('/')[-1]
            db_user = db_url.split('://')[1].split(':')[0]
            db_host = db_url.split('@')[1].split(':')[0]
            db_port = db_url.split(':')[-1].split('/')[0]

            # Drop existing connections
            drop_cmd = [
                'psql',
                '-h', db_host,
                '-p', db_port,
                '-U', db_user,
                '-d', 'postgres',
                '-c', f"SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '{db_name}' AND pid <> pg_backend_pid();"
            ]

            # Restore command
            restore_cmd = [
                'pg_restore',
                '-h', db_host,
                '-p', db_port,
                '-U', db_user,
                '-d', db_name,
                '-c',  # Clean (drop) database objects before recreating
                backup_file
            ]

            # Set PGPASSWORD environment variable
            env = os.environ.copy()
            env['PGPASSWORD'] = db_url.split(':')[2].split('@')[0]

            # Execute commands
            for cmd in [drop_cmd, restore_cmd]:
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    env=env,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()

                if process.returncode != 0:
                    logger.error(f"Database restore failed: {stderr.decode()}")
                    return False

            logger.info(f"Database restored successfully from: {backup_file}")
            return True

        except Exception as e:
            logger.error(f"Error restoring database backup: {str(e)}")
            return False

    async def restore_file_backup(self, backup_file: str) -> bool:
        """Restore files from a backup archive."""
        try:
            uploads_dir = Path(settings.UPLOAD_DIR)
            temp_dir = self.backup_dir / "temp_restore"

            # Create temporary directory
            temp_dir.mkdir(parents=True, exist_ok=True)

            # Extract backup
            with tarfile.open(backup_file, "r:gz") as tar:
                tar.extractall(temp_dir)

            # Find the extracted backup directory
            backup_dir = next(temp_dir.iterdir())

            # Remove existing uploads
            if uploads_dir.exists():
                shutil.rmtree(uploads_dir)

            # Copy restored files
            shutil.copytree(backup_dir / "uploads", uploads_dir)

            # Clean up
            shutil.rmtree(temp_dir)

            logger.info(f"Files restored successfully from: {backup_file}")
            return True

        except Exception as e:
            logger.error(f"Error restoring file backup: {str(e)}")
            return False

    async def cleanup_old_backups(self):
        """Remove old backups based on retention policy."""
        try:
            # Get all backup files
            backup_files = []
            for ext in ['.sql', '.tar.gz']:
                backup_files.extend(list(self.backup_dir.glob(f'*{ext}')))

            # Sort by modification time
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)

            # Remove excess backups based on max_backups
            for file in backup_files[self.max_backups:]:
                file.unlink()
                logger.info(f"Removed excess backup: {file}")

            # Remove old backups based on retention days
            cutoff_date = datetime.now() - timedelta(days=self.retention_days)
            for file in backup_files:
                if datetime.fromtimestamp(file.stat().st_mtime) < cutoff_date:
                    file.unlink()
                    logger.info(f"Removed expired backup: {file}")

        except Exception as e:
            logger.error(f"Error cleaning up old backups: {str(e)}")

    async def list_backups(self) -> List[dict]:
        """List all available backups with metadata."""
        try:
            backups = []
            for ext in ['.sql', '.tar.gz']:
                for file in self.backup_dir.glob(f'*{ext}'):
                    stat = file.stat()
                    backups.append({
                        'filename': file.name,
                        'type': 'database' if ext == '.sql' else 'files',
                        'size': stat.st_size,
                        'created_at': datetime.fromtimestamp(stat.st_mtime),
                        'path': str(file)
                    })
            return sorted(backups, key=lambda x: x['created_at'], reverse=True)
        except Exception as e:
            logger.error(f"Error listing backups: {str(e)}")
            return []

# Create global instance
backup_service = BackupService() 