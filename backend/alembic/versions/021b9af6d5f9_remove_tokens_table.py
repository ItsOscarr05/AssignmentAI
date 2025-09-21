"""remove_tokens_table

Revision ID: 021b9af6d5f9
Revises: d82219103603
Create Date: 2025-09-21 15:31:27.974828

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '021b9af6d5f9'
down_revision = 'd82219103603'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove remaining tokens table and its indexes
    op.drop_index('idx_token_expires', table_name='tokens')
    op.drop_index('idx_token_user_type', table_name='tokens')
    op.drop_index('ix_tokens_id', table_name='tokens')
    op.drop_index('ix_tokens_token', table_name='tokens')
    op.drop_table('tokens')


def downgrade() -> None:
    # Recreate tokens table (if needed for rollback)
    pass
