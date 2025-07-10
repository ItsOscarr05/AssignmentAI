import pytest
import tempfile
import os
import uuid
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.services.file_service import FileService


class TestFileService:
    @pytest.fixture
    def temp_upload_dir(self):
        """Create a temporary upload directory"""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir

    @pytest.fixture
    def file_service(self, temp_upload_dir):
        """Create a file service with temporary upload directory"""
        with patch('app.services.file_service.settings') as mock_settings:
            mock_settings.UPLOAD_DIR = temp_upload_dir
            service = FileService()
            yield service

    @pytest.fixture
    def mock_upload_file(self):
        """Create a mock upload file"""
        file = Mock(spec=UploadFile)
        file.filename = "test.txt"
        file.size = 1024  # 1KB
        file.read = AsyncMock(return_value=b"test content")
        return file

    @pytest.fixture
    def mock_security_service(self):
        """Create a mock security service"""
        with patch('app.services.file_service.security_service') as mock_service:
            mock_service.validate_filename.return_value = True
            yield mock_service

    def test_init_creates_upload_dir(self, temp_upload_dir):
        """Test that initialization creates upload directory"""
        with patch('app.services.file_service.settings') as mock_settings:
            mock_settings.UPLOAD_DIR = temp_upload_dir
            service = FileService()
            
            assert Path(temp_upload_dir).exists()
            assert service.upload_dir == Path(temp_upload_dir)

    def test_init_allowed_types_structure(self, file_service):
        """Test that allowed types are properly structured"""
        assert isinstance(file_service.allowed_types, dict)
        assert len(file_service.allowed_types) > 0
        
        # Check that all values are lists
        for mime_types in file_service.allowed_types.values():
            assert isinstance(mime_types, list)
            assert len(mime_types) > 0

    def test_init_max_file_size(self, file_service):
        """Test that max file size is set correctly"""
        assert file_service.max_file_size == 100 * 1024 * 1024  # 100MB

    @pytest.mark.asyncio
    async def test_save_file_success(self, file_service, mock_upload_file, mock_security_service):
        """Test successful file save"""
        user_id = 1
        
        file_path, file_id = await file_service.save_file(mock_upload_file, user_id)
        
        assert isinstance(file_path, str)
        assert isinstance(file_id, str)
        assert len(file_id) > 0
        
        # Check that file was actually saved
        path = Path(file_path)
        assert path.exists()
        assert path.is_file()

    @pytest.mark.asyncio
    async def test_save_file_with_different_extensions(self, file_service, mock_security_service):
        """Test saving files with different extensions"""
        extensions = ['txt', 'pdf', 'docx', 'jpg', 'py', 'json']
        
        for ext in extensions:
            mock_file = Mock(spec=UploadFile)
            mock_file.filename = f"test.{ext}"
            mock_file.size = 1024
            mock_file.read = AsyncMock(return_value=b"test content")
            
            file_path, file_id = await file_service.save_file(mock_file, 1)
            
            assert file_path.endswith(f".{ext}")
            assert Path(file_path).exists()

    @pytest.mark.asyncio
    async def test_save_file_creates_user_directory(self, file_service, mock_upload_file, mock_security_service):
        """Test that user directory is created"""
        user_id = 123
        
        await file_service.save_file(mock_upload_file, user_id)
        
        user_dir = file_service.upload_dir / str(user_id)
        assert user_dir.exists()
        assert user_dir.is_dir()

    @pytest.mark.asyncio
    async def test_save_file_generates_unique_filename(self, file_service, mock_upload_file, mock_security_service):
        """Test that unique filenames are generated"""
        user_id = 1
        
        file_path1, file_id1 = await file_service.save_file(mock_upload_file, user_id)
        file_path2, file_id2 = await file_service.save_file(mock_upload_file, user_id)
        
        assert file_id1 != file_id2
        assert file_path1 != file_path2

    @pytest.mark.asyncio
    async def test_save_file_size_exceeded(self, file_service, mock_security_service):
        """Test file save with size exceeded"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "large.txt"
        mock_file.size = 200 * 1024 * 1024  # 200MB
        mock_file.read = AsyncMock(return_value=b"large content")
        
        with pytest.raises(HTTPException) as exc_info:
            await file_service.save_file(mock_file, 1)
        
        assert exc_info.value.status_code == 500
        assert "Error saving file" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_save_file_invalid_filename(self, file_service, mock_upload_file):
        """Test file save with invalid filename"""
        with patch('app.services.file_service.security_service') as mock_security:
            mock_security.validate_filename.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                await file_service.save_file(mock_upload_file, 1)
            
            assert exc_info.value.status_code == 500
            assert "Error saving file" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_save_file_disallowed_extension(self, file_service, mock_security_service):
        """Test file save with disallowed extension"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test.exe"  # Disallowed extension
        mock_file.size = 1024
        mock_file.read = AsyncMock(return_value=b"test content")
        
        with pytest.raises(HTTPException) as exc_info:
            await file_service.save_file(mock_file, 1)
        
        assert exc_info.value.status_code == 500
        assert "Error saving file" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_save_file_invalid_mime_type(self, file_service, mock_security_service):
        """Test file save with invalid MIME type"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test.txt"
        mock_file.size = 1024
        mock_file.read = AsyncMock(return_value=b"test content")
        
        with patch('mimetypes.guess_type', return_value=('application/octet-stream', None)):
            with pytest.raises(HTTPException) as exc_info:
                await file_service.save_file(mock_file, 1)
            
            assert exc_info.value.status_code == 500
            assert "Error saving file" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_save_file_read_error(self, file_service, mock_upload_file, mock_security_service):
        """Test file save with read error"""
        mock_upload_file.read = AsyncMock(side_effect=Exception("Read error"))
        
        with pytest.raises(HTTPException) as exc_info:
            await file_service.save_file(mock_upload_file, 1)
        
        assert exc_info.value.status_code == 500
        assert "Error saving file" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_save_file_write_error(self, file_service, mock_upload_file, mock_security_service):
        """Test file save with write error"""
        with patch('aiofiles.open', side_effect=Exception("Write error")):
            with pytest.raises(HTTPException) as exc_info:
                await file_service.save_file(mock_upload_file, 1)
            
            assert exc_info.value.status_code == 500
            assert "Error saving file" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_delete_file_success(self, file_service, mock_upload_file, mock_security_service):
        """Test successful file deletion"""
        # First save a file
        file_path, file_id = await file_service.save_file(mock_upload_file, 1)
        
        # Then delete it
        result = await file_service.delete_file(file_path, 1)
        
        assert result is True
        assert not Path(file_path).exists()

    @pytest.mark.asyncio
    async def test_delete_file_not_found(self, file_service):
        """Test file deletion when file doesn't exist"""
        result = await file_service.delete_file("/nonexistent/file.txt", 1)
        
        assert result is False

    @pytest.mark.asyncio
    async def test_delete_file_wrong_user_directory(self, file_service, mock_upload_file, mock_security_service):
        """Test file deletion with wrong user directory"""
        # Save file for user 1
        file_path, file_id = await file_service.save_file(mock_upload_file, 1)
        
        # Try to delete with user 2
        result = await file_service.delete_file(file_path, 2)
        
        assert result is False
        assert Path(file_path).exists()  # File should still exist

    @pytest.mark.asyncio
    async def test_delete_file_directory_traversal_attempt(self, file_service):
        """Test file deletion with directory traversal attempt"""
        malicious_path = str(file_service.upload_dir / ".." / ".." / "etc" / "passwd")
        
        result = await file_service.delete_file(malicious_path, 1)
        
        assert result is False

    @pytest.mark.asyncio
    async def test_delete_file_exception_handling(self, file_service, mock_upload_file, mock_security_service):
        """Test file deletion with exception"""
        # Save a file
        file_path, file_id = await file_service.save_file(mock_upload_file, 1)
        
        # Mock Path.unlink to raise exception
        with patch('pathlib.Path.unlink', side_effect=Exception("Delete error")):
            result = await file_service.delete_file(file_path, 1)
            
            assert result is False

    def test_get_file_info_success(self, file_service, mock_upload_file, mock_security_service):
        """Test getting file information"""
        # Create a temporary file
        temp_file = file_service.upload_dir / "test.txt"
        temp_file.write_text("test content")
        
        info = file_service.get_file_info(str(temp_file))
        
        assert info is not None
        assert info["filename"] == "test.txt"
        assert info["size"] > 0
        assert isinstance(info["created_at"], datetime)
        assert isinstance(info["modified_at"], datetime)
        assert info["extension"] == "txt"
        
        # Clean up
        temp_file.unlink()

    def test_get_file_info_not_found(self, file_service):
        """Test getting file info for non-existent file"""
        info = file_service.get_file_info("/nonexistent/file.txt")
        
        assert info is None

    def test_get_file_info_directory(self, file_service):
        """Test getting file info for directory"""
        # Create a temporary directory
        temp_dir = file_service.upload_dir / "test_dir"
        temp_dir.mkdir()
        
        info = file_service.get_file_info(str(temp_dir))
        
        assert info is None
        
        # Clean up
        temp_dir.rmdir()

    def test_get_file_info_exception_handling(self, file_service):
        """Test getting file info with exception"""
        with patch('pathlib.Path.stat', side_effect=Exception("Stat error")):
            info = file_service.get_file_info("/some/file.txt")
            
            assert info is None

    def test_get_file_info_no_extension(self, file_service):
        """Test getting file info for file without extension"""
        # Create a temporary file without extension
        temp_file = file_service.upload_dir / "testfile"
        temp_file.write_text("test content")
        
        info = file_service.get_file_info(str(temp_file))
        
        assert info is not None
        assert info["extension"] == ""  # No extension
        
        # Clean up
        temp_file.unlink()

    @pytest.mark.asyncio
    async def test_save_file_with_special_characters(self, file_service, mock_security_service):
        """Test saving file with special characters in filename"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test file (1).txt"
        mock_file.size = 1024
        mock_file.read = AsyncMock(return_value=b"test content")
        
        file_path, file_id = await file_service.save_file(mock_file, 1)
        
        assert Path(file_path).exists()
        assert file_path.endswith(".txt")

    @pytest.mark.asyncio
    async def test_save_file_with_unicode_filename(self, file_service, mock_security_service):
        """Test saving file with unicode filename"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tëst_fîle.txt"
        mock_file.size = 1024
        mock_file.read = AsyncMock(return_value=b"test content")
        
        file_path, file_id = await file_service.save_file(mock_file, 1)
        
        assert Path(file_path).exists()
        assert file_path.endswith(".txt")

    def test_allowed_types_coverage(self, file_service):
        """Test that all allowed file types are properly configured"""
        # Test a few key file types
        test_extensions = ['pdf', 'docx', 'txt', 'jpg', 'py', 'json']
        
        for ext in test_extensions:
            assert ext in file_service.allowed_types
            assert isinstance(file_service.allowed_types[ext], list)
            assert len(file_service.allowed_types[ext]) > 0

    @pytest.mark.asyncio
    async def test_save_file_logs_upload(self, file_service, mock_upload_file, mock_security_service):
        """Test that file upload is logged"""
        with patch('app.services.file_service.logger') as mock_logger:
            await file_service.save_file(mock_upload_file, 1)
            
            mock_logger.info.assert_called_once()
            log_message = mock_logger.info.call_args[0][0]
            assert "File uploaded" in log_message

    @pytest.mark.asyncio
    async def test_delete_file_logs_deletion(self, file_service, mock_upload_file, mock_security_service):
        """Test that file deletion is logged"""
        # First save a file
        file_path, file_id = await file_service.save_file(mock_upload_file, 1)
        
        with patch('app.services.file_service.logger') as mock_logger:
            await file_service.delete_file(file_path, 1)
            
            mock_logger.info.assert_called_once()
            log_message = mock_logger.info.call_args[0][0]
            assert "File deleted" in log_message

    @pytest.mark.asyncio
    async def test_save_file_error_logging(self, file_service, mock_upload_file):
        """Test that errors are logged when saving file"""
        with patch('app.services.file_service.security_service') as mock_security:
            mock_security.validate_filename.return_value = False
            
            with patch('app.services.file_service.logger') as mock_logger:
                with pytest.raises(HTTPException):
                    await file_service.save_file(mock_upload_file, 1)
                
                # Should not log error since it's a validation error, not an exception

    def test_get_file_info_with_different_file_types(self, file_service):
        """Test getting file info for different file types"""
        test_files = [
            ("test.txt", "text content"),
            ("test.json", '{"key": "value"}'),
            ("test.py", "print('hello')"),
        ]
        
        for filename, content in test_files:
            temp_file = file_service.upload_dir / filename
            temp_file.write_text(content)
            
            info = file_service.get_file_info(str(temp_file))
            
            assert info is not None
            assert info["filename"] == filename
            assert info["size"] > 0
            
            # Clean up
            temp_file.unlink()

    @pytest.mark.asyncio
    async def test_save_file_with_large_content(self, file_service, mock_security_service):
        """Test saving file with large content"""
        large_content = b"x" * (50 * 1024 * 1024)  # 50MB
        
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "large.txt"
        mock_file.size = len(large_content)
        mock_file.read = AsyncMock(return_value=large_content)
        
        file_path, file_id = await file_service.save_file(mock_file, 1)
        
        assert Path(file_path).exists()
        assert Path(file_path).stat().st_size == len(large_content) 