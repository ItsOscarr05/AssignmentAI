"""
Add tokens_used column to usage table
"""
revision = 'addtokensused20240701'
down_revision = '7b60d87b9f88'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('usage', sa.Column('tokens_used', sa.Integer(), nullable=True, server_default='0'))

def downgrade():
    op.drop_column('usage', 'tokens_used') 