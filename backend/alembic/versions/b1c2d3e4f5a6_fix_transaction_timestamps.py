"""fix_transaction_timestamps

Revision ID: b1c2d3e4f5a6
Revises: a9df0f18c5cd
Create Date: 2025-09-21 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5a6'
down_revision = 'a9df0f18c5cd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # For SQLite, we'll just ensure the created_at field is properly indexed
    # The timezone issue is handled in the application layer
    # Create an index on created_at for better performance
    op.create_index('idx_transactions_created_at', 'transactions', ['created_at'])


def downgrade() -> None:
    # Drop the index
    op.drop_index('idx_transactions_created_at', table_name='transactions')
