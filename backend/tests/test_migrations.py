import pytest
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
from app.core.config import settings

@pytest.fixture(scope="session")
def alembic_config():
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", settings.SQLALCHEMY_DATABASE_URI)
    return config

@pytest.fixture(scope="session")
def engine():
    return create_engine(settings.SQLALCHEMY_DATABASE_URI)

def test_migrations_upgrade_downgrade(alembic_config, engine):
    # Upgrade to head
    command.upgrade(alembic_config, "head")
    
    # Verify tables exist
    with engine.connect() as conn:
        # Check AI assignment table
        result = conn.execute(text("SELECT * FROM ai_assignment LIMIT 1"))
        assert result is not None
        
        # Check feedback table
        result = conn.execute(text("SELECT * FROM feedback LIMIT 1"))
        assert result is not None
        
        # Check columns in ai_assignment table
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ai_assignment'
        """))
        columns = {row[0]: row[1] for row in result}
        assert "id" in columns
        assert "assignment_id" in columns
        assert "prompt" in columns
        assert "generated_content" in columns
        assert "model_version" in columns
        assert "confidence_score" in columns
        assert "metadata" in columns
        assert "created_at" in columns
        assert "updated_at" in columns
        
        # Check columns in feedback table
        result = conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'feedback'
        """))
        columns = {row[0]: row[1] for row in result}
        assert "id" in columns
        assert "submission_id" in columns
        assert "content" in columns
        assert "feedback_type" in columns
        assert "confidence_score" in columns
        assert "metadata" in columns
        assert "created_at" in columns
        assert "updated_at" in columns
    
    # Downgrade to base
    command.downgrade(alembic_config, "base")
    
    # Verify tables don't exist
    with engine.connect() as conn:
        # Check AI assignment table
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'ai_assignment'
            )
        """))
        assert not result.scalar()
        
        # Check feedback table
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'feedback'
            )
        """))
        assert not result.scalar()

def test_migration_constraints(alembic_config, engine):
    # Upgrade to head
    command.upgrade(alembic_config, "head")
    
    with engine.connect() as conn:
        # Test foreign key constraints
        # Try to insert AI assignment with non-existent assignment_id
        with pytest.raises(Exception):
            conn.execute(text("""
                INSERT INTO ai_assignment (
                    assignment_id, prompt, generated_content, 
                    model_version, confidence_score, metadata
                ) VALUES (
                    999, 'test prompt', 'test content',
                    '1.0', 0.8, '{}'
                )
            """))
        
        # Try to insert feedback with non-existent submission_id
        with pytest.raises(Exception):
            conn.execute(text("""
                INSERT INTO feedback (
                    submission_id, content, feedback_type,
                    confidence_score, metadata
                ) VALUES (
                    999, 'test feedback', 'content',
                    0.8, '{}'
                )
            """))
        
        # Test unique constraints
        # Create a test assignment
        conn.execute(text("""
            INSERT INTO assignment (
                title, description, due_date, max_score, status, created_by_id
            ) VALUES (
                'Test Assignment', 'Test Description', NOW(),
                100, 'draft', 1
            )
        """))
        assignment_id = conn.execute(text("SELECT id FROM assignment LIMIT 1")).scalar()
        
        # Try to insert duplicate AI assignment
        conn.execute(text("""
            INSERT INTO ai_assignment (
                assignment_id, prompt, generated_content,
                model_version, confidence_score, metadata
            ) VALUES (
                :assignment_id, 'test prompt', 'test content',
                '1.0', 0.8, '{}'
            )
        """), {"assignment_id": assignment_id})
        
        with pytest.raises(Exception):
            conn.execute(text("""
                INSERT INTO ai_assignment (
                    assignment_id, prompt, generated_content,
                    model_version, confidence_score, metadata
                ) VALUES (
                    :assignment_id, 'test prompt', 'test content',
                    '1.0', 0.8, '{}'
                )
            """), {"assignment_id": assignment_id})
        
        # Test check constraints
        # Try to insert AI assignment with invalid confidence score
        with pytest.raises(Exception):
            conn.execute(text("""
                INSERT INTO ai_assignment (
                    assignment_id, prompt, generated_content,
                    model_version, confidence_score, metadata
                ) VALUES (
                    :assignment_id, 'test prompt', 'test content',
                    '1.0', 1.5, '{}'
                )
            """), {"assignment_id": assignment_id})
        
        # Try to insert feedback with invalid confidence score
        with pytest.raises(Exception):
            conn.execute(text("""
                INSERT INTO feedback (
                    submission_id, content, feedback_type,
                    confidence_score, metadata
                ) VALUES (
                    1, 'test feedback', 'content',
                    1.5, '{}'
                )
            """))
    
    # Clean up
    command.downgrade(alembic_config, "base")

def test_migration_indexes(alembic_config, engine):
    # Upgrade to head
    command.upgrade(alembic_config, "head")
    
    with engine.connect() as conn:
        # Check indexes on ai_assignment table
        result = conn.execute(text("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'ai_assignment'
        """))
        indexes = {row[0]: row[1] for row in result}
        assert "ix_ai_assignment_assignment_id" in indexes
        assert "ix_ai_assignment_created_at" in indexes
        
        # Check indexes on feedback table
        result = conn.execute(text("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'feedback'
        """))
        indexes = {row[0]: row[1] for row in result}
        assert "ix_feedback_submission_id" in indexes
        assert "ix_feedback_created_at" in indexes
    
    # Clean up
    command.downgrade(alembic_config, "base") 