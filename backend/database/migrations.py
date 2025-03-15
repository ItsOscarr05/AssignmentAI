"""
Database migrations using Alembic.
"""

import os
import logging
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import text

from .base import engine
from config import settings

logger = logging.getLogger(__name__)

def get_alembic_config() -> Config:
    """Get Alembic configuration."""
    alembic_cfg = Config()
    alembic_cfg.set_main_option("script_location", "database/migrations")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    return alembic_cfg

async def get_current_revision() -> str:
    """Get current database revision."""
    async with engine.connect() as conn:
        context = MigrationContext.configure(conn)
        return context.get_current_revision()

async def get_head_revision() -> str:
    """Get latest available revision."""
    config = get_alembic_config()
    script = ScriptDirectory.from_config(config)
    return script.get_current_head()

async def create_migrations_table() -> None:
    """Create alembic_version table if it doesn't exist."""
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            )
        """))

async def run_migrations() -> None:
    """Run database migrations."""
    try:
        # Ensure migrations table exists
        await create_migrations_table()
        
        # Get current and target revisions
        current = await get_current_revision()
        head = await get_head_revision()
        
        if current == head:
            logger.info("Database is up to date")
            return
            
        logger.info(f"Running migrations from {current} to {head}")
        
        # Run migrations
        config = get_alembic_config()
        command.upgrade(config, "head")
        
        logger.info("Migrations completed successfully")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        raise

async def create_revision(message: str, autogenerate: bool = True) -> None:
    """Create new migration revision."""
    try:
        config = get_alembic_config()
        command.revision(
            config,
            message=message,
            autogenerate=autogenerate
        )
        logger.info(f"Created new migration: {message}")
    except Exception as e:
        logger.error(f"Failed to create revision: {str(e)}")
        raise

async def downgrade(revision: str) -> None:
    """Downgrade database to specific revision."""
    try:
        config = get_alembic_config()
        command.downgrade(config, revision)
        logger.info(f"Downgraded to revision: {revision}")
    except Exception as e:
        logger.error(f"Downgrade failed: {str(e)}")
        raise 