"""add_file_uploads_table

Revision ID: 442c5678aa90
Revises: ee821189a449
Create Date: 2025-09-21 15:29:10.572740

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '442c5678aa90'
down_revision = 'ee821189a449'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create file_uploads table
    op.create_table('file_uploads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('extracted_content', sa.Text(), nullable=True),
        sa.Column('ai_analysis', sa.Text(), nullable=True),
        sa.Column('processing_status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('assignment_id', sa.Integer(), nullable=True),
        sa.Column('upload_metadata', sa.JSON(), nullable=True),
        sa.Column('is_link', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('link_url', sa.String(length=500), nullable=True),
        sa.Column('link_title', sa.String(length=255), nullable=True),
        sa.Column('link_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['assignment_id'], ['assignments.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_file_uploads_id'), 'file_uploads', ['id'], unique=False)
    op.create_index('idx_file_uploads_user', 'file_uploads', ['user_id'], unique=False)
    op.create_index('idx_file_uploads_assignment', 'file_uploads', ['assignment_id'], unique=False)
    op.create_index('idx_file_uploads_created', 'file_uploads', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop file_uploads table
    op.drop_index('idx_file_uploads_created', table_name='file_uploads')
    op.drop_index('idx_file_uploads_assignment', table_name='file_uploads')
    op.drop_index('idx_file_uploads_user', table_name='file_uploads')
    op.drop_index(op.f('ix_file_uploads_id'), table_name='file_uploads')
    op.drop_table('file_uploads')
