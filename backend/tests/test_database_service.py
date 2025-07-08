import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from pathlib import Path
import ssl
import os
from datetime import datetime

from app.services.database_service import DatabaseService, database_service


class TestDatabaseService:
    """Test cases for the DatabaseService class."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings with required configuration."""
        mock_settings = Mock()
        mock_settings.SSL_ENABLED = False
        mock_settings.SSL_CERTFILE = None
        mock_settings.SSL_KEYFILE = None
        mock_settings.SQLALCHEMY_DATABASE_URI = "postgresql://user:pass@localhost/testdb"
        mock_settings.BACKUP_DIR = "/tmp/backups"
        mock_settings.DB_HOST = "localhost"
        mock_settings.DB_USER = "testuser"
        mock_settings.DB_NAME = "testdb"
        return mock_settings

    @pytest.fixture
    def mock_ssl_context(self):
        """Mock SSL context."""
        mock_context = Mock()
        mock_context.load_cert_chain = Mock()
        mock_context.check_hostname = True
        mock_context.verify_mode = ssl.CERT_REQUIRED
        return mock_context

    @pytest.fixture
    def database_service_instance(self, mock_settings):
        """Create a DatabaseService instance with mocked dependencies."""
        with patch('app.services.database_service.settings', mock_settings), \
             patch('app.services.database_service.security_service') as mock_security:
            
            # Mock the security service
            mock_security.sanitize_sql_input.return_value = "sanitized_value"
            
            service = DatabaseService()
            return service

    def test_init_without_ssl(self, mock_settings):
        """Test DatabaseService initialization without SSL."""
        with patch('app.services.database_service.settings', mock_settings), \
             patch('app.services.database_service.create_engine') as mock_create_engine, \
             patch('app.services.database_service.sessionmaker') as mock_sessionmaker, \
             patch('app.services.database_service.event') as mock_event:
            
            mock_engine = Mock()
            mock_create_engine.return_value = mock_engine
            mock_sessionmaker.return_value = Mock()
            
            service = DatabaseService()
            
            # Verify engine creation
            mock_create_engine.assert_called_once()
            call_args = mock_create_engine.call_args
            assert call_args[0][0] == "postgresql://user:pass@localhost/testdb"
            assert call_args[1]['pool_size'] == 5
            assert call_args[1]['max_overflow'] == 10
            assert call_args[1]['pool_timeout'] == 30
            assert call_args[1]['pool_recycle'] == 1800
            
            # Verify session factory creation
            mock_sessionmaker.assert_called_once()
            
            # Verify event listeners setup
            mock_event.listens_for.assert_called()

    def test_init_with_ssl(self, mock_settings, mock_ssl_context):
        """Test DatabaseService initialization with SSL."""
        mock_settings.SSL_ENABLED = True
        mock_settings.SSL_CERTFILE = "/path/to/cert.pem"
        mock_settings.SSL_KEYFILE = "/path/to/key.pem"
        
        with patch('app.services.database_service.settings', mock_settings), \
             patch('app.services.database_service.ssl.create_default_context', return_value=mock_ssl_context), \
             patch('app.services.database_service.create_engine') as mock_create_engine, \
             patch('app.services.database_service.sessionmaker') as mock_sessionmaker, \
             patch('app.services.database_service.event') as mock_event:
            
            mock_engine = Mock()
            mock_create_engine.return_value = mock_engine
            mock_sessionmaker.return_value = Mock()
            
            service = DatabaseService()
            
            # Verify SSL context setup
            mock_ssl_context.load_cert_chain.assert_called_once_with("/path/to/cert.pem", "/path/to/key.pem")
            assert mock_ssl_context.check_hostname is True
            assert mock_ssl_context.verify_mode == ssl.CERT_REQUIRED
            
            # Verify engine creation with SSL
            call_args = mock_create_engine.call_args
            connect_args = call_args[1]['connect_args']
            assert connect_args['sslmode'] == 'require'
            assert connect_args['ssl_context'] == mock_ssl_context

    def test_setup_event_listeners(self, database_service_instance):
        """Test event listeners setup."""
        # The event listeners are set up in __init__, so we just verify they exist
        assert hasattr(database_service_instance, '_setup_event_listeners')
        assert hasattr(database_service_instance, '_log_database_change')

    def test_log_database_change_success(self, database_service_instance):
        """Test successful database change logging."""
        with patch('app.services.database_service.logger') as mock_logger:
            # Create a mock instance with table and id
            mock_instance = Mock()
            mock_table = Mock()
            mock_table.name = "users"
            mock_instance.__table__ = mock_table
            mock_instance.id = 123
            
            database_service_instance._log_database_change('INSERT', mock_instance)
            
            mock_logger.info.assert_called_once_with(
                "Database INSERT on users (ID: 123)"
            )

    def test_log_database_change_no_id(self, database_service_instance):
        """Test database change logging when instance has no id."""
        with patch('app.services.database_service.logger') as mock_logger:
            # Create a mock instance without id
            mock_instance = Mock()
            mock_table = Mock()
            mock_table.name = "users"
            mock_instance.__table__ = mock_table
            mock_instance.id = None  # Explicitly set id to None
            
            database_service_instance._log_database_change('UPDATE', mock_instance)
            
            mock_logger.info.assert_called_once_with(
                "Database UPDATE on users (ID: None)"
            )

    def test_log_database_change_error(self, database_service_instance):
        """Test database change logging with error."""
        with patch('app.services.database_service.logger') as mock_logger:
            # Create a mock instance that raises an exception when accessing __table__
            class ErrorInstance:
                @property
                def __table__(self):
                    raise Exception("Test error")
            mock_instance = ErrorInstance()
            
            database_service_instance._log_database_change('DELETE', mock_instance)
            
            mock_logger.error.assert_called_once_with(
                "Error logging database change: Test error"
            )

    def test_get_db_context_manager(self, database_service_instance):
        """Test database session context manager."""
        mock_session = Mock()
        database_service_instance.SessionLocal = Mock(return_value=mock_session)
        
        with database_service_instance.get_db() as db:
            assert db == mock_session
        
        # Verify session was closed
        mock_session.close.assert_called_once()

    def test_get_db_context_manager_with_exception(self, database_service_instance):
        """Test database session context manager with exception."""
        mock_session = Mock()
        database_service_instance.SessionLocal = Mock(return_value=mock_session)
        
        try:
            with database_service_instance.get_db() as db:
                raise Exception("Test exception")
        except Exception:
            pass
        
        # Verify session was still closed despite exception
        mock_session.close.assert_called_once()

    def test_sanitize_query_params_string_values(self, database_service_instance):
        """Test sanitizing query parameters with string values."""
        params = {
            'name': 'test_name',
            'email': 'test@example.com',
            'age': 25
        }
        with patch('app.services.database_service.security_service.sanitize_sql_input', return_value='sanitized_value'):
            sanitized = database_service_instance.sanitize_query_params(params)
            assert sanitized['name'] == 'sanitized_value'
            assert sanitized['email'] == 'sanitized_value'
            assert sanitized['age'] == 25  # Non-string values should not be sanitized

    def test_sanitize_query_params_empty_dict(self, database_service_instance):
        """Test sanitizing empty query parameters."""
        params = {}
        
        sanitized = database_service_instance.sanitize_query_params(params)
        
        assert sanitized == {}

    def test_backup_database_success(self, database_service_instance, mock_settings):
        """Test successful database backup creation."""
        with patch('app.services.database_service.settings', mock_settings), \
             patch('app.services.database_service.Path') as mock_path, \
             patch('app.services.database_service.os.system') as mock_system, \
             patch('app.services.database_service.datetime') as mock_datetime, \
             patch('app.services.database_service.logger') as mock_logger:
            
            # Mock datetime
            mock_datetime.utcnow.return_value.strftime.return_value = "20231201_143022"
            
            # Mock path operations
            mock_backup_dir = Mock()
            mock_path.return_value = mock_backup_dir
            mock_backup_dir.mkdir.return_value = None
            mock_backup_file = Mock()
            mock_backup_file.__str__ = Mock(return_value="/tmp/backups/backup_20231201_143022.sql")
            mock_backup_dir.__truediv__ = Mock(return_value=mock_backup_file)
            
            # Mock os.system
            mock_system.return_value = 0
            
            result = database_service_instance.backup_database()
            
            assert result == "/tmp/backups/backup_20231201_143022.sql"
            mock_backup_dir.mkdir.assert_called_once_with(parents=True, exist_ok=True)
            mock_system.assert_called_once()

    def test_backup_database_failure(self, database_service_instance, mock_settings):
        """Test database backup creation failure."""
        with patch('app.services.database_service.settings', mock_settings), \
             patch('app.services.database_service.Path', side_effect=Exception("Backup error")), \
             patch('app.services.database_service.logger') as mock_logger:
            
            result = database_service_instance.backup_database()
            
            assert result is None
            mock_logger.error.assert_called_once_with(
                "Error creating database backup: Backup error"
            )

    def test_restore_database_success(self, database_service_instance, mock_settings):
        """Test successful database restoration."""
        with patch('app.services.database_service.settings', mock_settings), \
             patch('app.services.database_service.os.system') as mock_system, \
             patch('app.services.database_service.logger') as mock_logger:
            
            # Mock os.system
            mock_system.return_value = 0
            
            result = database_service_instance.restore_database("/path/to/backup.sql")
            
            assert result is True
            mock_system.assert_called_once()

    def test_restore_database_failure(self, database_service_instance, mock_settings):
        """Test database restoration failure."""
        with patch('app.services.database_service.settings', mock_settings), \
             patch('app.services.database_service.os.system', side_effect=Exception("Restore error")), \
             patch('app.services.database_service.logger') as mock_logger:
            
            result = database_service_instance.restore_database("/path/to/backup.sql")
            
            assert result is False
            mock_logger.error.assert_called_once_with(
                "Error restoring database: Restore error"
            )

    def test_encrypt_sensitive_data(self, database_service_instance):
        """Test encrypting sensitive data."""
        test_data = "sensitive_information"
        
        result = database_service_instance.encrypt_sensitive_data(test_data)
        
        # Currently returns the same data (placeholder implementation)
        assert result == test_data

    def test_decrypt_sensitive_data(self, database_service_instance):
        """Test decrypting sensitive data."""
        encrypted_data = "encrypted_information"
        
        result = database_service_instance.decrypt_sensitive_data(encrypted_data)
        
        # Currently returns the same data (placeholder implementation)
        assert result == encrypted_data

    def test_global_database_service_instance(self):
        """Test that the global database service instance is created."""
        assert database_service is not None
        assert isinstance(database_service, DatabaseService) 