from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
import logging
from typing import Generator, Optional
from pathlib import Path
from app.core.config import settings
from app.services.security_service import security_service
import ssl
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        # Configure SSL for database connection
        ssl_context = None
        if settings.SSL_ENABLED:
            ssl_context = ssl.create_default_context()
            if settings.SSL_CERTFILE:
                ssl_context.load_cert_chain(settings.SSL_CERTFILE, settings.SSL_KEYFILE)
            ssl_context.check_hostname = True
            ssl_context.verify_mode = ssl.CERT_REQUIRED

        # Create database engine with connection pooling
        self.engine = create_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            pool_recycle=1800,  # Recycle connections after 30 minutes
            connect_args={
                "sslmode": "require" if settings.SSL_ENABLED else None,
                "ssl_context": ssl_context
            }
        )

        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

        # Set up event listeners
        self._setup_event_listeners()

    def _setup_event_listeners(self):
        """Set up database event listeners for security monitoring"""
        
        @event.listens_for(Session, 'after_flush')
        def receive_after_flush(session, context):
            """Monitor database changes after flush"""
            for instance in session.new:
                self._log_database_change('INSERT', instance)
            for instance in session.dirty:
                self._log_database_change('UPDATE', instance)
            for instance in session.deleted:
                self._log_database_change('DELETE', instance)

    def _log_database_change(self, operation: str, instance: object):
        """Log database changes for audit purposes"""
        try:
            table_name = instance.__table__.name
            record_id = getattr(instance, 'id', None)
            
            logger.info(
                f"Database {operation} on {table_name} (ID: {record_id})"
            )
        except Exception as e:
            logger.error(f"Error logging database change: {str(e)}")

    @contextmanager
    def get_db(self) -> Generator[Session, None, None]:
        """Get database session with automatic cleanup"""
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def sanitize_query_params(self, params: dict) -> dict:
        """Sanitize query parameters to prevent SQL injection"""
        sanitized = {}
        for key, value in params.items():
            if isinstance(value, str):
                sanitized[key] = security_service.sanitize_sql_input(value)
            else:
                sanitized[key] = value
        return sanitized

    def backup_database(self) -> Optional[str]:
        """Create a database backup"""
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_dir = Path(settings.BACKUP_DIR)
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            backup_file = backup_dir / f"backup_{timestamp}.sql"
            
            # Use pg_dump for PostgreSQL
            os.system(
                f"pg_dump -h {settings.DB_HOST} -U {settings.DB_USER} "
                f"-d {settings.DB_NAME} -F c -f {backup_file}"
            )
            
            return str(backup_file)
            
        except Exception as e:
            logger.error(f"Error creating database backup: {str(e)}")
            return None

    def restore_database(self, backup_file: str) -> bool:
        """Restore database from backup"""
        try:
            # Use pg_restore for PostgreSQL
            os.system(
                f"pg_restore -h {settings.DB_HOST} -U {settings.DB_USER} "
                f"-d {settings.DB_NAME} -c {backup_file}"
            )
            return True
            
        except Exception as e:
            logger.error(f"Error restoring database: {str(e)}")
            return False

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data before storage"""
        # Implement encryption logic here
        # This is a placeholder for the actual encryption implementation
        return data

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data after retrieval"""
        # Implement decryption logic here
        # This is a placeholder for the actual decryption implementation
        return encrypted_data

# Create a global database service instance
database_service = DatabaseService() 