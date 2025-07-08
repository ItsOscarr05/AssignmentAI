import pytest
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timedelta

class DummySettings:
    BACKUP_SCHEDULE = "*/5 * * * *"
    BACKUP_DIR = "test_backups"

class DummyBadSettings:
    BACKUP_SCHEDULE = "invalid cron"
    BACKUP_DIR = "test_backups"

@pytest.fixture
def backup_service_mock(monkeypatch):
    backup_service = MagicMock()
    backup_service.create_database_backup = AsyncMock(return_value="db_backup_file")
    backup_service.create_file_backup = AsyncMock(return_value="file_backup_file")
    backup_service.cleanup_old_backups = AsyncMock()
    monkeypatch.setattr("app.services.backup_service.backup_service", backup_service)
    return backup_service

@pytest.fixture(autouse=True)
def patch_logger(monkeypatch):
    logger_mock = MagicMock()
    monkeypatch.setattr("app.services.logging_service.logger", logger_mock)
    yield

class TestBackupScheduler:
    def test_init_valid_schedule(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        assert scheduler.schedule == "*/5 * * * *"
        assert scheduler.is_running is False
        assert scheduler._task is None
        assert scheduler._last_backup is None
        assert scheduler._backup_stats["total_backups"] == 0

    def test_init_invalid_schedule(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())  # Use valid settings for construction
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        # Create scheduler with valid settings
        scheduler = BackupScheduler()
        # Now test validation with invalid schedule
        scheduler.schedule = "invalid cron"
        with pytest.raises(ValueError):
            scheduler._validate_cron_schedule()

    @pytest.mark.asyncio
    async def test_start_and_stop(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        await scheduler.start()
        assert scheduler.is_running is True
        assert scheduler._task is not None
        await scheduler.stop()
        assert scheduler.is_running is False

    @pytest.mark.asyncio
    async def test_start_when_already_running(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        await scheduler.start()
        await scheduler.start()
        await scheduler.stop()

    @pytest.mark.asyncio
    async def test_stop_when_not_running(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        await scheduler.stop()

    @pytest.mark.asyncio
    async def test_run_scheduler_success(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        async def fake_wait():
            scheduler.is_running = False
        monkeypatch.setattr(scheduler, "_wait_until_next_backup", fake_wait)
        monkeypatch.setattr(scheduler, "_create_backups", AsyncMock())
        monkeypatch.setattr("app.services.backup_service.backup_service.cleanup_old_backups", AsyncMock())
        await scheduler.start()
        await asyncio.sleep(0.1)
        await scheduler.stop()
        assert scheduler._backup_stats["total_backups"] == 1
        assert scheduler._backup_stats["successful_backups"] == 1

    @pytest.mark.asyncio
    async def test_run_scheduler_exception(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        # Make the backup service raise an exception when called
        backup_service_mock.create_database_backup.side_effect = Exception("fail")
        # Don't mock _create_backups - let it call the real method which will use our mock
        # Don't mock _wait_until_next_backup - let it run normally but break after error
        monkeypatch.setattr("app.services.backup_service.backup_service.cleanup_old_backups", AsyncMock())
        # Patch the global backup_service variable that's used in the _create_backups method
        monkeypatch.setattr("app.services.backup_scheduler.backup_service", backup_service_mock)
        # Start the scheduler
        await scheduler.start()
        # Wait a bit for the scheduler to run and hit the exception
        await asyncio.sleep(0.5)
        # Stop the scheduler
        await scheduler.stop()
        # Check that the exception was caught and stats were updated
        assert scheduler._backup_stats["failed_backups"] >= 1
        assert scheduler._backup_stats["last_error"] == "fail"

    @pytest.mark.asyncio
    async def test_create_backups_success(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        await scheduler._create_backups()

    @pytest.mark.asyncio
    async def test_create_backups_failure(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        # Set the side effect before patching
        backup_service_mock.create_database_backup.side_effect = Exception("db fail")
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        # Patch the global backup_service variable that's used in the _create_backups method
        monkeypatch.setattr("app.services.backup_scheduler.backup_service", backup_service_mock)
        with pytest.raises(Exception, match="db fail"):
            await scheduler._create_backups()

    @pytest.mark.asyncio
    async def test_wait_until_next_backup(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        now = datetime.now()
        monkeypatch.setattr(scheduler, "_get_next_backup_time", lambda _: now + timedelta(seconds=1))
        monkeypatch.setattr(asyncio, "sleep", AsyncMock())
        await scheduler._wait_until_next_backup()

    @pytest.mark.asyncio
    async def test_wait_until_next_backup_error(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        monkeypatch.setattr(scheduler, "_get_next_backup_time", lambda _: (_ for _ in ()).throw(Exception("fail")))
        monkeypatch.setattr(asyncio, "sleep", AsyncMock())
        await scheduler._wait_until_next_backup()

    def test_get_next_backup_time(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        now = datetime.now()
        next_time = scheduler._get_next_backup_time(now)
        assert isinstance(next_time, datetime)
        assert next_time > now

    def test_get_next_backup_time_invalid(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        with patch("app.services.backup_scheduler.croniter", side_effect=Exception("bad cron")):
            with pytest.raises(ValueError):
                scheduler._get_next_backup_time(datetime.now())

    def test_get_stats(self, monkeypatch, backup_service_mock):
        monkeypatch.setattr("app.core.config.settings", DummySettings())
        monkeypatch.setattr("app.services.backup_service.backup_service", backup_service_mock)
        from app.services.backup_scheduler import BackupScheduler
        scheduler = BackupScheduler()
        stats = scheduler.get_stats()
        assert isinstance(stats, dict)
        assert "total_backups" in stats
        assert "is_running" in stats 