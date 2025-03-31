"""merge multiple heads

Revision ID: 7b60d87b9f88
Revises: a8afa23dec45, create_logs_table
Create Date: 2025-03-30 16:39:24.151003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7b60d87b9f88'
down_revision = ('a8afa23dec45', 'create_logs_table')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
