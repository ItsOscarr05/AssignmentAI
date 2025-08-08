"""Add missing fields to subscriptions table

Revision ID: add_subscription_fields
Revises: add_backup_codes
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_subscription_fields'
down_revision = 'add_backup_codes'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to subscriptions table
    op.add_column('subscriptions', sa.Column('plan_id', sa.String(100), nullable=True))
    op.add_column('subscriptions', sa.Column('ai_model', sa.String(100), nullable=True))
    op.add_column('subscriptions', sa.Column('token_limit', sa.Integer(), nullable=True))
    
    # Update existing subscriptions with default values based on plan_name
    connection = op.get_bind()
    
    # Update Free plan subscriptions
    connection.execute(
        sa.text("""
            UPDATE subscriptions 
            SET plan_id = 'price_free', ai_model = 'gpt-3.5-turbo', token_limit = 30000 
            WHERE plan_name = 'Free'
        """)
    )
    
    # Update Plus plan subscriptions
    connection.execute(
        sa.text("""
            UPDATE subscriptions 
            SET plan_id = 'price_plus', ai_model = 'gpt-4', token_limit = 100000 
            WHERE plan_name = 'Plus'
        """)
    )
    
    # Update Pro plan subscriptions
    connection.execute(
        sa.text("""
            UPDATE subscriptions 
            SET plan_id = 'price_pro', ai_model = 'gpt-4', token_limit = 500000 
            WHERE plan_name = 'Pro'
        """)
    )
    
    # Update Max plan subscriptions
    connection.execute(
        sa.text("""
            UPDATE subscriptions 
            SET plan_id = 'price_max', ai_model = 'gpt-4-turbo', token_limit = 1000000 
            WHERE plan_name = 'Max'
        """)
    )
    
    # Set defaults for any remaining subscriptions
    connection.execute(
        sa.text("""
            UPDATE subscriptions 
            SET plan_id = COALESCE(plan_id, 'price_pro'), 
                ai_model = COALESCE(ai_model, 'gpt-4'), 
                token_limit = COALESCE(token_limit, 500000) 
            WHERE plan_id IS NULL OR ai_model IS NULL OR token_limit IS NULL
        """)
    )


def downgrade():
    # Remove the columns
    op.drop_column('subscriptions', 'token_limit')
    op.drop_column('subscriptions', 'ai_model')
    op.drop_column('subscriptions', 'plan_id') 