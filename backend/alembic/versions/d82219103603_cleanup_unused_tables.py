"""cleanup_unused_tables

Revision ID: d82219103603
Revises: 442c5678aa90
Create Date: 2025-09-21 15:30:02.768786

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd82219103603'
down_revision = '442c5678aa90'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop unused tables that are no longer in our models
    op.drop_index('ix_systemlog_id', table_name='systemlog')
    op.drop_table('systemlog')
    
    op.drop_index('idx_token_expires', table_name='tokens')
    op.drop_index('idx_token_user_type', table_name='tokens')
    op.drop_index('ix_tokens_id', table_name='tokens')
    op.drop_index('ix_tokens_token', table_name='tokens')
    op.drop_table('tokens')
    
    op.drop_index('ix_user_sessions_device_key', table_name='user_sessions')
    op.drop_index('ix_user_sessions_id', table_name='user_sessions')
    op.drop_table('user_sessions')


def downgrade() -> None:
    # Recreate the dropped tables (if needed for rollback)
    # Note: This is a destructive migration, so rollback may not be fully possible
    pass
