"""merge heads

Revision ID: 92cbc4a8840c
Revises: addtokensused20240701, e47f03c12abd
Create Date: 2025-06-16 23:18:26.884200

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '92cbc4a8840c'
down_revision = ('addtokensused20240701', 'e47f03c12abd')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
