from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from app.core.config import settings
from app.db.base_class import Base  # Import the Base class that models actually use

# Import all models to ensure they are registered with the metadata
from app.models.user import User
print("User table:", User.__table__)
# from app.models.token import Token
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.feedback import Feedback
from app.models.ai_assignment import AIAssignment
from app.models.class_model import Class
from app.models.security import SecurityAlert, AuditLog, TwoFactorSetup
from app.models.log import SystemLog
from app.models.notification import Notification
from app.models.subscription import Subscription
from app.models.usage import Usage, UsageLimit
from app.models.activity import Activity
from app.models.preference import Preference
from app.models.session import UserSession
from app.models.template import Template
from app.models.citation import Citation
from app.models.file import File

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # Prefer alembic config URL if set, else use settings
    url = config.get_main_option("sqlalchemy.url") or str(settings.database_uri)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    # Prefer alembic config URL if set, else use settings
    configuration["sqlalchemy.url"] = configuration.get("sqlalchemy.url") or str(settings.database_uri)
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
