import asyncio
from datetime import datetime
import logging
from app.core.config import settings
from app.services.backup_service import backup_service
from app.services.logging_service import logger

class BackupScheduler:
    def __init__(self):
        self.schedule = settings.BACKUP_SCHEDULE
        self.is_running = False

    async def start(self):
        """Start the backup scheduler."""
        self.is_running = True
        logger.info("Backup scheduler started")
        await self._run_scheduler()

    async def stop(self):
        """Stop the backup scheduler."""
        self.is_running = False
        logger.info("Backup scheduler stopped")

    async def _run_scheduler(self):
        """Run the backup scheduler loop."""
        while self.is_running:
            try:
                # Create backups
                await self._create_backups()
                
                # Clean up old backups
                await backup_service.cleanup_old_backups()
                
                # Wait until next scheduled time
                await self._wait_until_next_backup()
                
            except Exception as e:
                logger.error(f"Error in backup scheduler: {str(e)}")
                await asyncio.sleep(60)  # Wait a minute before retrying

    async def _create_backups(self):
        """Create database and file backups."""
        try:
            # Create database backup
            db_backup = await backup_service.create_database_backup()
            if db_backup:
                logger.info(f"Database backup created: {db_backup}")

            # Create file backup
            file_backup = await backup_service.create_file_backup()
            if file_backup:
                logger.info(f"File backup created: {file_backup}")

        except Exception as e:
            logger.error(f"Error creating backups: {str(e)}")

    async def _wait_until_next_backup(self):
        """Wait until the next scheduled backup time."""
        try:
            # Parse cron schedule
            minute, hour, day, month, weekday = self.schedule.split()
            
            # Calculate next backup time
            now = datetime.now()
            next_backup = self._get_next_backup_time(now, minute, hour, day, month, weekday)
            
            # Calculate wait time
            wait_seconds = (next_backup - now).total_seconds()
            
            if wait_seconds > 0:
                logger.info(f"Waiting {wait_seconds} seconds until next backup")
                await asyncio.sleep(wait_seconds)
                
        except Exception as e:
            logger.error(f"Error calculating next backup time: {str(e)}")
            await asyncio.sleep(3600)  # Wait an hour before retrying

    def _get_next_backup_time(self, now, minute, hour, day, month, weekday):
        """Calculate the next backup time based on cron schedule."""
        from croniter import croniter
        
        # Create cron iterator
        cron = croniter(f"{minute} {hour} {day} {month} {weekday}", now)
        
        # Get next occurrence
        next_time = cron.get_next(datetime)
        
        return next_time

# Create global instance
backup_scheduler = BackupScheduler() 