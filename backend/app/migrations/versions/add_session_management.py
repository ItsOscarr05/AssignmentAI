"""add session management

Revision ID: add_session_management
Revises: add_backup_codes
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_session_management'
down_revision = 'add_backup_codes'
branch_labels = None
depends_on = None

def upgrade():
    # Add session management fields
    op.add_column('users', sa.Column('sessions', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_login_ip', sa.String(), nullable=True))
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('account_locked_until', sa.DateTime(timezone=True), nullable=True))
    
    # Add security metadata fields
    op.add_column('users', sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('password_history', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('users', sa.Column('security_questions', postgresql.JSON(astext_type=sa.Text()), nullable=True))
    op.add_column('users', sa.Column('recovery_email', sa.String(), nullable=True))

def downgrade():
    # Remove session management fields
    op.drop_column('users', 'sessions')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'last_login_ip')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'account_locked_until')
    
    # Remove security metadata fields
    op.drop_column('users', 'password_changed_at')
    op.drop_column('users', 'password_history')
    op.drop_column('users', 'security_questions')
    op.drop_column('users', 'recovery_email') 