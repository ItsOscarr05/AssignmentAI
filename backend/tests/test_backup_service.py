import pytest
from unittest.mock import patch, MagicMock, AsyncMock, mock_open
from app.services.backup_service import BackupService
from datetime import datetime, timedelta
from pathlib import Path
import os
import shutil
import tarfile

@pytest.fixture
def backup_service():
    with patch.object(BackupService, '__init__', lambda self: None):
        service = BackupService()
        service.backup_dir = Path('/tmp/backups')
        service.max_backups = 3
        service.retention_days = 7
        return service

@pytest.mark.asyncio
async def test_create_database_backup_success(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.asyncio.create_subprocess_exec', new_callable=AsyncMock) as mock_subproc, \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'
        mock_settings.BACKUP_DIR = '/tmp/backups'
        mock_settings.MAX_BACKUPS = 3
        mock_settings.BACKUP_RETENTION_DAYS = 7
        mock_proc = MagicMock()
        mock_proc.communicate = AsyncMock(return_value=(b'out', b''))
        mock_proc.returncode = 0
        mock_subproc.return_value = mock_proc
        result = await backup_service.create_database_backup()
        assert result is not None
        mock_logger.info.assert_called()

@pytest.mark.asyncio
async def test_create_database_backup_failure(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.asyncio.create_subprocess_exec', new_callable=AsyncMock) as mock_subproc, \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'
        mock_proc = MagicMock()
        mock_proc.communicate = AsyncMock(return_value=(b'', b'error'))
        mock_proc.returncode = 1
        mock_subproc.return_value = mock_proc
        result = await backup_service.create_database_backup()
        assert result is None
        mock_logger.error.assert_called()

@pytest.mark.asyncio
async def test_create_database_backup_exception(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.asyncio.create_subprocess_exec', side_effect=Exception('fail')), \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'
        result = await backup_service.create_database_backup()
        assert result is None
        mock_logger.error.assert_called()

@pytest.mark.asyncio
async def test_create_file_backup_success(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.datetime') as mock_datetime, \
         patch('app.services.backup_service.Path.mkdir'), \
         patch('app.services.backup_service.shutil.copytree'), \
         patch('app.services.backup_service.tarfile.open') as mock_tar, \
         patch('app.services.backup_service.shutil.rmtree'), \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.UPLOAD_DIR = '/tmp/uploads'
        mock_settings.BACKUP_DIR = '/tmp/backups'
        mock_datetime.now.return_value = datetime(2024, 1, 1, 12, 0, 0)
        mock_tar.return_value.__enter__.return_value = MagicMock()
        result = await backup_service.create_file_backup()
        assert result is not None
        mock_logger.info.assert_called()

@pytest.mark.asyncio
async def test_create_file_backup_exception(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.Path.mkdir', side_effect=Exception('fail')), \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.UPLOAD_DIR = '/tmp/uploads'
        result = await backup_service.create_file_backup()
        assert result is None
        mock_logger.error.assert_called()

@pytest.mark.asyncio
async def test_restore_database_backup_success(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.asyncio.create_subprocess_exec', new_callable=AsyncMock) as mock_subproc, \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'
        mock_proc = MagicMock()
        mock_proc.communicate = AsyncMock(return_value=(b'out', b''))
        mock_proc.returncode = 0
        mock_subproc.return_value = mock_proc
        result = await backup_service.restore_database_backup('backup.sql')
        assert result is True
        mock_logger.info.assert_called()

@pytest.mark.asyncio
async def test_restore_database_backup_failure(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.asyncio.create_subprocess_exec', new_callable=AsyncMock) as mock_subproc, \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'
        mock_proc = MagicMock()
        mock_proc.communicate = AsyncMock(return_value=(b'', b'error'))
        mock_proc.returncode = 1
        mock_subproc.return_value = mock_proc
        result = await backup_service.restore_database_backup('backup.sql')
        assert result is False
        mock_logger.error.assert_called()

@pytest.mark.asyncio
async def test_restore_database_backup_exception(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.asyncio.create_subprocess_exec', side_effect=Exception('fail')), \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'
        result = await backup_service.restore_database_backup('backup.sql')
        assert result is False
        mock_logger.error.assert_called()

@pytest.mark.asyncio
async def test_restore_file_backup_success(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.Path.mkdir'), \
         patch('app.services.backup_service.tarfile.open') as mock_tar, \
         patch('app.services.backup_service.Path.iterdir', return_value=iter([Path('/tmp/backups/temp_restore/dir')])), \
         patch('app.services.backup_service.shutil.rmtree'), \
         patch('app.services.backup_service.shutil.copytree'), \
         patch('app.services.backup_service.Path.exists', return_value=True), \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.UPLOAD_DIR = '/tmp/uploads'
        mock_settings.BACKUP_DIR = '/tmp/backups'
        mock_tar.return_value.__enter__.return_value = MagicMock()
        result = await backup_service.restore_file_backup('backup.tar.gz')
        assert result is True
        mock_logger.info.assert_called()

@pytest.mark.asyncio
async def test_restore_file_backup_exception(backup_service):
    with patch('app.services.backup_service.settings') as mock_settings, \
         patch('app.services.backup_service.Path.mkdir', side_effect=Exception('fail')), \
         patch('app.services.backup_service.logger') as mock_logger:
        mock_settings.UPLOAD_DIR = '/tmp/uploads'
        result = await backup_service.restore_file_backup('backup.tar.gz')
        assert result is False
        mock_logger.error.assert_called()

@pytest.mark.asyncio
async def test_cleanup_old_backups(backup_service):
    now = datetime.now().timestamp()
    # 5 files: 3 recent, 2 old (to trigger both max_backups and retention deletion)
    files = [MagicMock(spec=Path) for _ in range(5)]
    for i, f in enumerate(files):
        # First 3 are recent, last 2 are old
        if i < 3:
            f.stat.return_value.st_mtime = now
        else:
            f.stat.return_value.st_mtime = now - (10 * 24 * 3600)  # 10 days ago
        f.name = f"file{i}.sql"
        f.unlink = MagicMock()
    def glob_side_effect(pattern):
        return files
    with patch.object(Path, 'glob', side_effect=glob_side_effect), \
         patch('app.services.backup_service.logger') as mock_logger:
        await backup_service.cleanup_old_backups()
        # At least one file should be deleted (either by retention or max_backups)
        deleted = [f for f in files if f.unlink.called]
        assert deleted
        mock_logger.info.assert_called()

@pytest.mark.asyncio
async def test_cleanup_old_backups_exception(backup_service):
    def glob_side_effect(pattern):
        raise Exception('fail')
    with patch.object(Path, 'glob', side_effect=glob_side_effect), \
         patch('app.services.backup_service.logger') as mock_logger:
        await backup_service.cleanup_old_backups()
        mock_logger.error.assert_called()

@pytest.mark.asyncio
async def test_list_backups_success(backup_service):
    now = datetime.now().timestamp()
    file1 = MagicMock(spec=Path)
    file1.name = 'backup1.sql'
    file1.stat.return_value.st_mtime = now
    file1.stat.return_value.st_size = 100
    file2 = MagicMock(spec=Path)
    file2.name = 'backup2.tar.gz'
    file2.stat.return_value.st_mtime = now - 1000
    file2.stat.return_value.st_size = 200
    def glob_side_effect(pattern):
        if pattern == '*.sql':
            return [file1]
        elif pattern == '*.tar.gz':
            return [file2]
        else:
            return []
    with patch.object(Path, 'glob', side_effect=glob_side_effect):
        result = await backup_service.list_backups()
        assert len(result) == 2
        assert result[0]['filename'] == 'backup1.sql'
        assert result[1]['filename'] == 'backup2.tar.gz'

@pytest.mark.asyncio
async def test_list_backups_exception(backup_service):
    def glob_side_effect(self, pattern):
        raise Exception('fail')
    with patch.object(Path, 'glob', side_effect=glob_side_effect), \
         patch('app.services.backup_service.logger') as mock_logger:
        result = await backup_service.list_backups()
        assert result == []
        mock_logger.error.assert_called() 