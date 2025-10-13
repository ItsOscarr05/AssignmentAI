"""add timezone to preferences

Revision ID: f1a2b3c4d5e6
Revises: ee821189a449
Create Date: 2025-10-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = '09a465e949f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add timezone column to preferences table
    op.add_column('preferences', sa.Column('timezone', sa.String(length=50), nullable=True, server_default='UTC'))


def downgrade() -> None:
    # Remove timezone column from preferences table
    op.drop_column('preferences', 'timezone')

