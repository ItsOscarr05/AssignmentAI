"""add user settings table

Revision ID: add_user_settings
Revises: previous_migration
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_user_settings'
down_revision = 'previous_migration'  # Update this to your last migration
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'user_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('dark_mode', sa.Boolean(), default=False),
        sa.Column('language', sa.String(), default='en'),
        sa.Column('font_size', sa.Integer(), default=14),
        sa.Column('animations', sa.Boolean(), default=True),
        sa.Column('compact_mode', sa.Boolean(), default=False),
        sa.Column('sound_effects', sa.Boolean(), default=True),
        sa.Column('volume', sa.Integer(), default=70),
        sa.Column('quiet_hours_start', sa.Integer(), default=22),
        sa.Column('quiet_hours_end', sa.Integer(), default=7),
        sa.Column('time_zone', sa.String(), default='UTC'),
        sa.Column('date_format', sa.String(), default='MM/DD/YYYY'),
        sa.Column('auto_translate', sa.Boolean(), default=False),
        sa.Column('show_original_text', sa.Boolean(), default=True),
        sa.Column('use_metric_system', sa.Boolean(), default=False),
        sa.Column('use_24_hour_format', sa.Boolean(), default=False),
        sa.Column('haptic_feedback', sa.Boolean(), default=True),
        sa.Column('notification_sounds', sa.Boolean(), default=True),
        sa.Column('typing_sounds', sa.Boolean(), default=False),
        sa.Column('completion_sounds', sa.Boolean(), default=True),
        sa.Column('ai_model', sa.String(), default='gpt-4-0125-preview'),
        sa.Column('max_tokens', sa.Integer(), default=1000),
        sa.Column('temperature', sa.Float(), default=0.7),
        sa.Column('context_length', sa.Integer(), default=10),
        sa.Column('auto_complete', sa.Boolean(), default=True),
        sa.Column('code_snippets', sa.Boolean(), default=True),
        sa.Column('ai_suggestions', sa.Boolean(), default=True),
        sa.Column('real_time_analysis', sa.Boolean(), default=True),
        sa.Column('notifications', postgresql.JSON(astext_type=sa.Text()), default={
            "email": True,
            "desktop": True,
            "sound": True,
            "assignments": True,
            "deadlines": True,
            "feedback": True,
            "updates": True
        }),
        sa.Column('two_factor_auth', sa.Boolean(), default=False),
        sa.Column('biometric_login', sa.Boolean(), default=False),
        sa.Column('data_collection', sa.Boolean(), default=True),
        sa.Column('share_analytics', sa.Boolean(), default=True),
        sa.Column('show_online_status', sa.Boolean(), default=True),
        sa.Column('allow_tracking', sa.Boolean(), default=False),
        sa.Column('auto_lock', sa.Boolean(), default=True),
        sa.Column('lock_timeout', sa.Integer(), default=5),
        sa.Column('password_expiry', sa.Integer(), default=90),
        sa.Column('session_timeout', sa.Integer(), default=30),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_settings_id'), 'user_settings', ['id'], unique=False)
    op.create_index(op.f('ix_user_settings_user_id'), 'user_settings', ['user_id'], unique=True)

def downgrade():
    op.drop_index(op.f('ix_user_settings_user_id'), table_name='user_settings')
    op.drop_index(op.f('ix_user_settings_id'), table_name='user_settings')
    op.drop_table('user_settings') 