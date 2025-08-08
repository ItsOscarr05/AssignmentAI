"""update preferences table structure

Revision ID: update_preferences_structure
Revises: add_subscription_fields
Create Date: 2025-08-08 12:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = 'update_preferences_structure'
down_revision = 'add_subscription_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to preferences table
    op.add_column('preferences', sa.Column('theme', sa.String(length=20), nullable=True))
    op.add_column('preferences', sa.Column('language', sa.String(length=10), nullable=True))
    op.add_column('preferences', sa.Column('font_size', sa.String(length=20), nullable=True))
    op.add_column('preferences', sa.Column('compact_mode', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('email_notifications', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('push_notifications', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('notification_types', sa.JSON(), nullable=True))
    op.add_column('preferences', sa.Column('show_profile', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('show_progress', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('show_activity', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('high_contrast', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('reduced_motion', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('screen_reader', sa.Boolean(), nullable=True))
    op.add_column('preferences', sa.Column('custom_preferences', sa.JSON(), nullable=True))
    
    # Create index on user_id
    op.create_index(op.f('ix_preferences_user_id'), 'preferences', ['user_id'], unique=False)
    
    # Drop old columns (only if they exist)
    try:
        op.drop_column('preferences', 'preference_metadata')
    except:
        pass
    try:
        op.drop_column('preferences', 'preference_type')
    except:
        pass
    try:
        op.drop_column('preferences', 'is_public')
    except:
        pass
    try:
        op.drop_column('preferences', 'preference_value')
    except:
        pass
    try:
        op.drop_column('preferences', 'preference_key')
    except:
        pass


def downgrade() -> None:
    # Recreate old columns
    op.add_column('preferences', sa.Column('preference_key', sa.VARCHAR(length=100), nullable=False))
    op.add_column('preferences', sa.Column('preference_value', sa.TEXT(), nullable=False))
    op.add_column('preferences', sa.Column('is_public', sa.BOOLEAN(), nullable=True))
    op.add_column('preferences', sa.Column('preference_type', sa.VARCHAR(length=50), nullable=False))
    op.add_column('preferences', sa.Column('preference_metadata', sqlite.JSON(), nullable=True))
    
    # Drop new columns
    op.drop_index(op.f('ix_preferences_user_id'), table_name='preferences')
    op.drop_column('preferences', 'custom_preferences')
    op.drop_column('preferences', 'screen_reader')
    op.drop_column('preferences', 'reduced_motion')
    op.drop_column('preferences', 'high_contrast')
    op.drop_column('preferences', 'show_activity')
    op.drop_column('preferences', 'show_progress')
    op.drop_column('preferences', 'show_profile')
    op.drop_column('preferences', 'notification_types')
    op.drop_column('preferences', 'push_notifications')
    op.drop_column('preferences', 'email_notifications')
    op.drop_column('preferences', 'compact_mode')
    op.drop_column('preferences', 'font_size')
    op.drop_column('preferences', 'language')
    op.drop_column('preferences', 'theme')
