import pytest
import asyncio
from typing import AsyncGenerator, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base_class import Base
from app.models.user import User, UserRole
from app.models.class_model import Class
from app.models.assignment import Assignment, AssignmentStatus, DifficultyLevel
from app.models.submission import Submission, SubmissionStatus
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
from app.core.security import get_password_hash

# Create async engine with asyncpg
SQLALCHEMY_DATABASE_URI = settings.SQLALCHEMY_DATABASE_URI.replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URI,
    echo=True,
    future=True
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for a test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def test_user(db: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        role=UserRole.STUDENT
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture(scope="function")
async def test_admin(db: AsyncSession) -> User:
    """Create a test admin user."""
    admin = User(
        email="admin@example.com",
        hashed_password=get_password_hash("adminpassword"),
        full_name="Test Admin",
        role=UserRole.ADMIN
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin

@pytest.fixture(scope="function")
async def test_class(db: AsyncSession, test_user: User) -> Class:
    """Create a test class."""
    class_ = Class(
        name="Test Class",
        code="TEST101",
        description="Test Description",
        teacher_id=test_user.id
    )
    db.add(class_)
    await db.commit()
    await db.refresh(class_)
    return class_

@pytest.fixture(scope="function")
async def test_assignment(db: AsyncSession, test_class: Class) -> Assignment:
    """Create a test assignment."""
    assignment = Assignment(
        title="Test Assignment",
        description="Test Description",
        due_date=datetime.utcnow(),
        class_id=test_class.id,
        status=AssignmentStatus.DRAFT,
        difficulty=DifficultyLevel.EASY,
        subject="Mathematics",
        grade_level="10",
        assignment_type="homework",
        topic="Algebra",
        estimated_time=60,
        content="Test content",
        user_id=test_class.teacher_id,
        created_by_id=test_class.teacher_id,
        teacher_id=test_class.teacher_id
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment

@pytest.fixture(scope="function")
async def test_submission(db: AsyncSession, test_assignment: Assignment, test_user: User) -> Submission:
    """Create a test submission."""
    submission = Submission(
        title="Test Submission",
        content="Test Submission",
        assignment_id=test_assignment.id,
        user_id=test_user.id,
        status=SubmissionStatus.SUBMITTED
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return submission

@pytest.fixture(scope="function")
async def test_ai_assignment(db: AsyncSession, test_assignment: Assignment) -> AIAssignment:
    """Create a test AI assignment."""
    ai_assignment = AIAssignment(
        prompt="Test Prompt",
        generated_content="Test Generated Content",
        assignment_id=test_assignment.id,
        model_version="1.0",
        confidence_score=0.95,
        generated_at=datetime.utcnow()
    )
    db.add(ai_assignment)
    await db.commit()
    await db.refresh(ai_assignment)
    return ai_assignment

@pytest.fixture(scope="function")
async def test_feedback(db: AsyncSession, test_submission: Submission) -> Feedback:
    """Create a test feedback."""
    feedback = Feedback(
        content="Test Feedback",
        submission_id=test_submission.id,
        score=90
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback 