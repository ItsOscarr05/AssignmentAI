import os
import uuid
import warnings
from datetime import datetime, timedelta
from typing import Dict, Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.rate_limit import FallbackRateLimiter
from app.core.security import get_password_hash, create_access_token, create_refresh_token
from app.database import get_db
from app.db.base_class import Base
from app.main import app
from app.models.ai_assignment import AIAssignment
from app.models.assignment import Assignment, AssignmentStatus, DifficultyLevel
from app.models.class_model import Class
from app.models.feedback import Feedback
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User
# Silence third-party deprecation noise during tests
warnings.filterwarnings("ignore", category=DeprecationWarning, module="PyPDF2")

# Set testing environment
os.environ["TESTING"] = "true"

# Use SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test database engine
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create test database session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    FallbackRateLimiter.requests.clear()
    FallbackRateLimiter.reset_times.clear()
    yield

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    # Create a session
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Clean up all data from tables
        try:
            with test_engine.connect() as conn:
                # Get all table names
                result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"))
                tables = [row[0] for row in result]
                
                # Delete all data from tables
                for table in tables:
                    try:
                        conn.execute(text(f"DELETE FROM {table};"))
                    except Exception:
                        pass
                
                conn.commit()
        except Exception:
            # If cleanup fails, just continue
            pass

@pytest.fixture
def client(db):
    """Create a test client."""
    def override_get_db():
        try:
            yield db
        finally:
            db.expire_all()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)

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
        is_superuser=False,  # Regular user by default
        updated_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture(scope="function")
def regular_user(db) -> User:
    """Create a regular user (non-superuser) for testing unauthorized access."""
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        email=f"regular-{unique_id}@example.com",
        hashed_password=get_password_hash("regularpassword"),
        name=f"Regular User {unique_id}",
        is_active=True,
        is_verified=True,
        is_superuser=False,  # Regular user
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
    return create_access_token(test_user.id)

@pytest.fixture(scope="function")
def test_refresh_token(test_user) -> str:
    """Create a test refresh token."""
    return create_refresh_token(test_user.id)

@pytest.fixture(scope="function")
def superuser(db) -> User:
    """Create a test superuser."""
    unique_id = str(uuid.uuid4())[:8]
    superuser = User(
        email=f"superuser-{unique_id}@example.com",
        hashed_password=get_password_hash("superuserpassword"),
        name=f"Test Superuser {unique_id}",
        is_active=True,
        is_verified=True,
        is_superuser=True,  # This is the key difference
        updated_at=datetime.utcnow()
    )
    db.add(superuser)
    db.commit()
    db.refresh(superuser)
    return superuser 