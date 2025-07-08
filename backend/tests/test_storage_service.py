import pytest
from unittest.mock import MagicMock, AsyncMock, patch, mock_open, Mock
from app.services.storage_service import StorageService
from fastapi import UploadFile
import os
import io

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def storage_service(mock_db):
    with patch('app.services.storage_service.settings') as mock_settings:
        mock_settings.UPLOAD_DIR = "/test/upload/dir"
        return StorageService(mock_db)

@pytest.fixture
def mock_upload_file():
    file = MagicMock(spec=UploadFile)
    file.filename = "test_file.txt"
    file.read = AsyncMock(return_value=b"test content")
    return file

@pytest.fixture
def mock_file_content():
    return b"test file content"

class TestStorageService:
    """Test cases for StorageService"""

    @pytest.mark.asyncio
    async def test_save_file_success(self, storage_service, mock_db, mock_upload_file):
        """Test successful file save"""
        with patch('os.makedirs'), \
             patch('builtins.open', mock_open()), \
             patch('app.services.storage_service.LoggingService.info') as mock_log:
            
            result = await storage_service.save_file(mock_upload_file)
            expected_path = os.path.join("/test/upload/dir", "test_file.txt")
            assert result == expected_path
            mock_log.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_file_with_subdirectory(self, storage_service, mock_db, mock_upload_file):
        """Test file save with subdirectory"""
        with patch('os.makedirs'), \
             patch('builtins.open', mock_open()), \
             patch('app.services.storage_service.LoggingService.info') as mock_log:
            
            result = await storage_service.save_file(mock_upload_file, "subdir")
            expected_path = os.path.join("/test/upload/dir", "subdir", "test_file.txt")
            assert result == expected_path
            mock_log.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_file_exception(self, storage_service, mock_db, mock_upload_file):
        """Test file save with exception"""
        with patch('os.makedirs'), \
             patch('builtins.open', side_effect=Exception("IO Error")), \
             patch('app.services.storage_service.LoggingService.error') as mock_log:
            
            with pytest.raises(Exception):
                await storage_service.save_file(mock_upload_file)
            
            mock_log.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_file_read_exception(self, storage_service, mock_db, mock_upload_file):
        """Test file save when file.read() raises exception"""
        mock_upload_file.read = AsyncMock(side_effect=Exception("Read Error"))
        
        with patch('os.makedirs'), \
             patch('app.services.storage_service.LoggingService.error') as mock_log:
            
            with pytest.raises(Exception):
                await storage_service.save_file(mock_upload_file)
            
            mock_log.assert_called_once()

    def test_read_file_success(self, storage_service, mock_db):
        """Test successful file read"""
        file_path = "/test/upload/dir/test_file.txt"
        mock_content = b"test content"
        
        with patch('os.path.exists', return_value=True), \
             patch('builtins.open', mock_open(read_data=mock_content)), \
             patch('app.services.storage_service.LoggingService.info') as mock_log:
            
            result = storage_service.read_file(file_path)
            
            assert result is not None
            mock_log.assert_called_once()

    def test_read_file_not_found(self, storage_service, mock_db):
        """Test file read when file doesn't exist"""
        file_path = "/test/upload/dir/nonexistent.txt"
        
        with patch('os.path.exists', return_value=False), \
             patch('app.services.storage_service.LoggingService.error') as mock_log:
            
            with pytest.raises(FileNotFoundError):
                storage_service.read_file(file_path)
            
            mock_log.assert_called_once()

    def test_read_file_exception(self, storage_service, mock_db):
        """Test file read with exception"""
        file_path = "/test/upload/dir/test_file.txt"
        
        with patch('os.path.exists', return_value=True), \
             patch('builtins.open', side_effect=Exception("IO Error")), \
             patch('app.services.storage_service.LoggingService.error') as mock_log:
            
            with pytest.raises(Exception):
                storage_service.read_file(file_path)
            
            mock_log.assert_called_once()

    def test_delete_file_success(self, storage_service, mock_db):
        """Test successful file deletion"""
        file_path = "/test/upload/dir/test_file.txt"
        
        with patch('os.path.exists', return_value=True), \
             patch('os.remove'), \
             patch('app.services.storage_service.LoggingService.info') as mock_log:
            
            result = storage_service.delete_file(file_path)
            
            assert result is True
            mock_log.assert_called_once()

    def test_delete_file_not_found(self, storage_service, mock_db):
        """Test file deletion when file doesn't exist"""
        file_path = "/test/upload/dir/nonexistent.txt"
        
        with patch('os.path.exists', return_value=False):
            result = storage_service.delete_file(file_path)
            
            assert result is False

    def test_delete_file_exception(self, storage_service, mock_db):
        """Test file deletion with exception"""
        file_path = "/test/upload/dir/test_file.txt"
        
        with patch('os.path.exists', return_value=True), \
             patch('os.remove', side_effect=Exception("IO Error")), \
             patch('app.services.storage_service.LoggingService.error') as mock_log:
            
            result = storage_service.delete_file(file_path)
            
            assert result is False
            mock_log.assert_called_once()

    def test_get_file_size_success(self, storage_service, mock_db):
        """Test successful file size retrieval"""
        file_path = "/test/upload/dir/test_file.txt"
        expected_size = 1024
        
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=expected_size), \
             patch('app.services.storage_service.LoggingService.info') as mock_log:
            
            result = storage_service.get_file_size(file_path)
            
            assert result == expected_size
            mock_log.assert_called_once()

    def test_get_file_size_not_found(self, storage_service, mock_db):
        """Test file size retrieval when file doesn't exist"""
        file_path = "/test/upload/dir/nonexistent.txt"
        
        with patch('os.path.exists', return_value=False), \
             patch('app.services.storage_service.LoggingService.error') as mock_log:
            
            with pytest.raises(FileNotFoundError):
                storage_service.get_file_size(file_path)
            
            mock_log.assert_called_once()

    def test_get_file_size_exception(self, storage_service, mock_db):
        """Test file size retrieval with exception"""
        file_path = "/test/upload/dir/test_file.txt"
        
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', side_effect=Exception("IO Error")), \
             patch('app.services.storage_service.LoggingService.error') as mock_log:
            
            with pytest.raises(Exception):
                storage_service.get_file_size(file_path)
            
            mock_log.assert_called_once()

    def test_init_creates_upload_dir(self, mock_db):
        """Test that __init__ creates upload directory"""
        with patch('app.services.storage_service.settings') as mock_settings, \
             patch('os.makedirs') as mock_makedirs:
            mock_settings.UPLOAD_DIR = "/test/upload/dir"
            
            StorageService(mock_db)
            
            mock_makedirs.assert_called_once_with("/test/upload/dir", exist_ok=True)

    @pytest.mark.asyncio
    async def test_save_file_creates_subdirectory(self, storage_service, mock_db, mock_upload_file):
        """Test that save_file creates subdirectory when specified"""
        with patch('os.makedirs') as mock_makedirs, \
             patch('builtins.open', mock_open()), \
             patch('app.services.storage_service.LoggingService.info'):
            
            await storage_service.save_file(mock_upload_file, "subdir")
            expected_subdir = os.path.join("/test/upload/dir", "subdir")
            # Should be called at least once for the subdirectory
            assert mock_makedirs.call_count >= 1
            mock_makedirs.assert_any_call(expected_subdir, exist_ok=True)

    def test_read_file_returns_binary_file(self, storage_service, mock_db):
        """Test that read_file returns a binary file object"""
        file_path = "/test/upload/dir/test_file.txt"
        mock_content = b"test content"
        
        with patch('os.path.exists', return_value=True), \
             patch('builtins.open', mock_open(read_data=mock_content)), \
             patch('app.services.storage_service.LoggingService.info'):
            
            result = storage_service.read_file(file_path)
            
            assert hasattr(result, 'read')
            assert callable(result.read)

    def test_delete_file_returns_boolean(self, storage_service, mock_db):
        """Test that delete_file returns boolean"""
        file_path = "/test/upload/dir/test_file.txt"
        
        with patch('os.path.exists', return_value=True), \
             patch('os.remove'), \
             patch('app.services.storage_service.LoggingService.info'):
            
            result = storage_service.delete_file(file_path)
            
            assert isinstance(result, bool)
            assert result is True

    def test_get_file_size_returns_integer(self, storage_service, mock_db):
        """Test that get_file_size returns integer"""
        file_path = "/test/upload/dir/test_file.txt"
        expected_size = 1024
        
        with patch('os.path.exists', return_value=True), \
             patch('os.path.getsize', return_value=expected_size), \
             patch('app.services.storage_service.LoggingService.info'):
            
            result = storage_service.get_file_size(file_path)
            
            assert isinstance(result, int)
            assert result == expected_size 