import pytest
import os
import uuid
from typing import Dict, Any
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.config import settings
from app.db.base_class import Base
from app.models.user import User
from app.models.class_model import Class
from app.models.assignment import Assignment, AssignmentStatus, DifficultyLevel
from app.models.submission import Submission, SubmissionStatus
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
from app.core.security import get_password_hash, create_access_token
from app.database import engine, get_db
from app.core.rate_limit import FallbackRateLimiter

# Set testing environment
os.environ["TESTING"] = "true"

# Create test database session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    FallbackRateLimiter.requests.clear()
    FallbackRateLimiter.reset_times.clear()
    yield

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Clean up all data from tables and reset sequences
        try:
            with engine.connect() as conn:
                # Disable foreign key checks temporarily
                conn.execute("SET session_replication_role = replica;")
                
                # Get all table names
                result = conn.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
                tables = [row[0] for row in result]
                
                # Truncate all tables and reset identity
                for table in tables:
                    try:
                        conn.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;")
                    except Exception:
                        pass
                
                # Re-enable foreign key checks
                conn.execute("SET session_replication_role = DEFAULT;")
                conn.commit()
        except Exception:
            # If cleanup fails, just continue
            pass

@pytest.fixture
def client(db):
    """Create a test client."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="function")
def test_user(db) -> User:
    """Create a test user."""
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        email=f"test-{unique_id}@example.com",
        hashed_password=get_password_hash("testpassword"),
        name=f"Test User {unique_id}",
        is_active=True,
        is_verified=True,
        is_superuser=True,  # Make superuser for security tests
        updated_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_teacher(db) -> User:
    """Create a test teacher user."""
    unique_id = str(uuid.uuid4())[:8]
    teacher = User(
        email=f"teacher-{unique_id}@example.com",
        hashed_password=get_password_hash("teacherpassword"),
        name=f"Test Teacher {unique_id}",
        updated_at=datetime.utcnow()
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher

@pytest.fixture(scope="function")
def test_student(db) -> User:
    """Create a test student user."""
    unique_id = str(uuid.uuid4())[:8]
    student = User(
        email=f"student-{unique_id}@example.com",
        hashed_password=get_password_hash("studentpassword"),
        name=f"Test Student {unique_id}",
        updated_at=datetime.utcnow()
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@pytest.fixture(scope="function")
def test_class(db, test_teacher) -> Class:
    """Create a test class."""
    teacher = test_teacher
    unique_id = str(uuid.uuid4())[:8]
    class_ = Class(
        name=f"Test Class {unique_id}",
        code=f"TEST{unique_id}",
        description=f"Test Description {unique_id}",
        teacher_id=teacher.id
    )
    db.add(class_)
    db.commit()
    db.refresh(class_)
    return class_

@pytest.fixture(scope="function")
def test_assignment(db, test_user) -> Assignment:
    """Create a test assignment."""
    user = test_user
    unique_id = str(uuid.uuid4())[:8]
    
    # Create a test class for the assignment
    test_class = Class(
        name=f"Test Class {unique_id}",
        code=f"TEST{unique_id}",
        description=f"Test Description {unique_id}",
        teacher_id=user.id
    )
    db.add(test_class)
    db.commit()
    db.refresh(test_class)
    
    assignment = Assignment(
        title=f"Test Assignment {unique_id}",
        description=f"Test Description {unique_id}",
        due_date=datetime.utcnow() + timedelta(days=7),  # Set due date to 7 days from now
        class_id=test_class.id,
        status=AssignmentStatus.DRAFT,
        difficulty=DifficultyLevel.EASY,
        subject="Mathematics",
        grade_level="10",
        assignment_type="homework",
        topic="Algebra",
        estimated_time=60,
        content=f"Test content {unique_id}",
        user_id=user.id,
        created_by_id=user.id,
        teacher_id=user.id,
        max_score=100.0,
        is_active=True
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@pytest.fixture(scope="function")
def test_submission(db, test_assignment, test_user) -> Submission:
    """Create a test submission."""
    assignment = test_assignment
    user = test_user
    unique_id = str(uuid.uuid4())[:8]
    submission = Submission(
        title=f"Test Submission {unique_id}",
        content=f"Test Submission {unique_id}",
        assignment_id=assignment.id,
        user_id=user.id,
        status=SubmissionStatus.SUBMITTED
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@pytest.fixture(scope="function")
def test_ai_assignment(db, test_assignment, test_user) -> AIAssignment:
    """Create a test AI assignment."""
    assignment = test_assignment
    user = test_user
    unique_id = str(uuid.uuid4())[:8]
    ai_assignment = AIAssignment(
        assignment_id=assignment.id,
        user_id=user.id,
        prompt=f"Test Prompt {unique_id}",
        model="gpt-4",
        max_tokens=1000,
        temperature=0.7,
        status="pending",
        generated_content=f"Test Generated Content {unique_id}",
        model_version="1.0",
        confidence_score=0.95,
        generation_metadata={"test": "data"},
        generated_at=datetime.utcnow()
    )
    db.add(ai_assignment)
    db.commit()
    db.refresh(ai_assignment)
    return ai_assignment

@pytest.fixture(scope="function")
def test_feedback(db, test_submission) -> Feedback:
    """Create a test feedback."""
    submission = test_submission
    unique_id = str(uuid.uuid4())[:8]
    feedback = Feedback(
        content=f"Test Feedback {unique_id}",
        feedback_type="content",
        confidence_score=0.8,
        submission_id=submission.id,
        score=90,
        feedback_metadata={"test": "data"}
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@pytest.fixture(autouse=True)
def cleanup_feedback(db):
    """Delete all feedback records before each feedback test."""
    db.query(Feedback).delete()
    db.commit()
    yield

@pytest.fixture(scope="function")
def test_token(test_user) -> str:
    """Create a test token."""
    user = test_user
    token = create_access_token(subject=str(user.id))
    return token 