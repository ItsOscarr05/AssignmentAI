import asyncio
from datetime import datetime
import logging
from typing import Optional, Dict, Any
from croniter import croniter
from app.core.config import settings
from app.services.backup_service import backup_service
from app.services.logging_service import logger

class BackupScheduler:
    """A scheduler for managing automated database and file backups.
    
    This class handles the scheduling and execution of backup tasks based on
    the configured schedule in settings. It supports both database and file
    system backups.
    """
    
    def __init__(self) -> None:
        """Initialize the backup scheduler with settings from config."""
        if not hasattr(settings, 'BACKUP_SCHEDULE'):
            raise ValueError("BACKUP_SCHEDULE not found in settings")
            
        self.schedule: str = settings.BACKUP_SCHEDULE
        self._validate_cron_schedule()
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None
        self._last_backup: Optional[datetime] = None
        self._backup_stats: Dict[str, Any] = {
            "total_backups": 0,
            "successful_backups": 0,
            "failed_backups": 0,
            "last_error": None
        }

    def _validate_cron_schedule(self) -> None:
        """Validate the cron schedule format.
        
        Raises:
            ValueError: If the cron schedule is invalid
        """
        try:
            # Try to parse the schedule to validate it
            croniter(self.schedule, datetime.now())
        except Exception as e:
            raise ValueError(f"Invalid cron schedule format: {self.schedule}. Error: {str(e)}")

    async def start(self) -> None:
        """Start the backup scheduler.
        
        This method initializes the scheduler and begins the backup cycle.
        It should be called when the application starts.
        """
        if self.is_running:
            logger.warning("Backup scheduler is already running")
            return
            
        if backup_service is None:
            raise RuntimeError("Backup service not initialized")
            
        self.is_running = True
        self._task = asyncio.create_task(self._run_scheduler())
        logger.info("Backup scheduler started successfully")

    async def stop(self) -> None:
        """Stop the backup scheduler.
        
        This method gracefully stops the scheduler and any ongoing backup tasks.
        It should be called when the application is shutting down.
        """
        if not self.is_running:
            logger.warning("Backup scheduler is not running")
            return
            
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Backup scheduler stopped successfully")

    async def _run_scheduler(self) -> None:
        """Run the backup scheduler loop.
        
        This is the main loop that handles the backup scheduling and execution.
        It runs continuously until the scheduler is stopped.
        """
        while self.is_running:
            try:
                # Create backups
                await self._create_backups()
                
                # Clean up old backups
                await backup_service.cleanup_old_backups()
                
                # Update last backup time
                self._last_backup = datetime.now()
                self._backup_stats["total_backups"] += 1
                self._backup_stats["successful_backups"] += 1
                
                # Wait until next scheduled time
                await self._wait_until_next_backup()
                
            except asyncio.CancelledError:
                logger.info("Backup scheduler task cancelled")
                break
            except Exception as e:
                logger.error(f"Error in backup scheduler: {str(e)}")
                self._backup_stats["failed_backups"] += 1
                self._backup_stats["last_error"] = str(e)
                await asyncio.sleep(60)  # Wait a minute before retrying

    async def _create_backups(self) -> None:
        """Create database and file backups.
        
        This method handles the creation of both database and file system backups.
        It logs the success or failure of each backup operation.
        
        Raises:
            RuntimeError: If backup service is not initialized
        """
        if backup_service is None:
            raise RuntimeError("Backup service not initialized")
            
        try:
            # Create database backup
            db_backup = await backup_service.create_database_backup()
            if db_backup:
                logger.info(f"Database backup created successfully: {db_backup}")
            else:
                logger.warning("Database backup creation returned no result")

            # Create file backup
            file_backup = await backup_service.create_file_backup()
            if file_backup:
                logger.info(f"File backup created successfully: {file_backup}")
            else:
                logger.warning("File backup creation returned no result")

        except Exception as e:
            logger.error(f"Error creating backups: {str(e)}")
            raise

    async def _wait_until_next_backup(self) -> None:
        """Wait until the next scheduled backup time.
        
        This method calculates the next backup time based on the cron schedule
        and waits until that time is reached.
        """
        try:
            # Calculate next backup time
            now = datetime.now()
            next_backup = self._get_next_backup_time(now)
            
            # Calculate wait time
            wait_seconds = (next_backup - now).total_seconds()
            
            if wait_seconds > 0:
                logger.info(f"Waiting {wait_seconds} seconds until next backup")
                await asyncio.sleep(wait_seconds)
                
        except Exception as e:
            logger.error(f"Error calculating next backup time: {str(e)}")
            await asyncio.sleep(3600)  # Wait an hour before retrying

    def _get_next_backup_time(self, now: datetime) -> datetime:
        """Calculate the next backup time based on cron schedule.
        
        Args:
            now: Current datetime
            
        Returns:
            The next scheduled backup time
            
        Raises:
            ValueError: If the cron schedule is invalid
        """
        try:
            # Create cron iterator
            cron = croniter(self.schedule, now)
            
            # Get next occurrence
            next_time = cron.get_next(datetime)
            
            return next_time
        except Exception as e:
            raise ValueError(f"Error calculating next backup time: {str(e)}")

    def get_stats(self) -> Dict[str, Any]:
        """Get current backup statistics.
        
        Returns:
            A dictionary containing backup statistics including total backups,
            successful backups, failed backups, and last error message.
        """
        return {
            **self._backup_stats,
            "last_backup": self._last_backup.isoformat() if self._last_backup else None,
            "is_running": self.is_running
        }

# Create global instance
backup_scheduler = BackupScheduler() 