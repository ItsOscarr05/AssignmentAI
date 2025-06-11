"""add backup codes

Revision ID: add_backup_codes
Revises: previous_revision
Create Date: 2024-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'add_backup_codes'
down_revision = 'previous_revision'  # Replace with your previous migration
branch_labels = None
depends_on = None

def upgrade():
    # Add backup_codes column to users table
    op.add_column('users', sa.Column('backup_codes', JSON, nullable=True))

def downgrade():
    # Remove backup_codes column from users table
    op.drop_column('users', 'backup_codes') 