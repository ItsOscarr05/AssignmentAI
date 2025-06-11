import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
from app.models.user import User, UserRole
from app.models.assignment import Assignment, AssignmentStatus, DifficultyLevel
from app.models.submission import Submission, SubmissionStatus
from app.models.class_model import Class
from app.schemas.user import UserCreate
from app.schemas.assignment import AssignmentCreate
from app.schemas.submission import SubmissionCreate
from app.schemas.feedback import FeedbackCreate
from app.schemas.ai_assignment import AIAssignmentCreate
from app.core.security import get_password_hash

pytestmark = pytest.mark.asyncio

@pytest.fixture
def sample_user_data():
    return {
        "email": "test@example.com",
        "hashed_password": "hashed_password",
        "full_name": "Test User",
        "role": UserRole.TEACHER
    }

@pytest.fixture
def sample_class_data():
    return {
        "name": "Test Class",
        "code": "TEST101",
        "description": "Test class description"
    }

@pytest.fixture
async def test_class(db: AsyncSession, sample_class_data, test_user):
    class_ = Class(**sample_class_data, teacher_id=test_user.id)
    db.add(class_)
    await db.commit()
    await db.refresh(class_)
    return class_

@pytest.fixture
async def test_user(db: AsyncSession, sample_user_data):
    user = User(**sample_user_data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
def sample_assignment_data():
    return {
        "title": "Test Assignment",
        "description": "Test Description",
        "due_date": datetime.utcnow(),
        "max_score": 100,
        "subject": "Mathematics",
        "grade_level": "10",
        "assignment_type": "homework",
        "topic": "Algebra",
        "difficulty": DifficultyLevel.MEDIUM,
        "estimated_time": 60,
        "content": "Test content",
        "status": AssignmentStatus.DRAFT,
        "is_active": True
    }

@pytest.fixture
def sample_submission_data():
    return {
        "title": "Test Submission",
        "content": "Test submission content",
        "score": 85,
        "status": SubmissionStatus.SUBMITTED,
        "submitted_at": datetime.utcnow()
    }

@pytest.fixture
def sample_ai_assignment_data():
    return {
        "prompt": "Generate a math assignment",
        "generated_content": "Sample assignment content",
        "model_version": "1.0",
        "confidence_score": 0.8,
        "generation_metadata": {"key": "value"}
    }

@pytest.fixture
def sample_feedback_data():
    return {
        "content": "Good work overall",
        "score": 85,
        "feedback_metadata": {"model_version": "1.0"}
    }

async def test_create_user(db: AsyncSession):
    """Test creating a user."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword"),
        full_name="Test User",
        role=UserRole.STUDENT
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.role == UserRole.STUDENT

async def test_create_class(db: AsyncSession, test_user: User):
    """Test creating a class."""
    class_ = Class(
        name="Test Class",
        code="TEST101",
        description="Test Description",
        teacher_id=test_user.id
    )
    db.add(class_)
    await db.commit()
    await db.refresh(class_)
    assert class_.id is not None
    assert class_.name == "Test Class"
    assert class_.teacher_id == test_user.id

async def test_create_assignment(db: AsyncSession, test_class: Class):
    """Test creating an assignment."""
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
    assert assignment.id is not None
    assert assignment.title == "Test Assignment"
    assert assignment.class_id == test_class.id

async def test_create_submission(db: AsyncSession, test_assignment: Assignment, test_user: User):
    """Test creating a submission."""
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
    assert submission.id is not None
    assert submission.assignment_id == test_assignment.id
    assert submission.user_id == test_user.id

async def test_create_ai_assignment(db: AsyncSession, test_assignment: Assignment):
    """Test creating an AI assignment."""
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
    assert ai_assignment.id is not None
    assert ai_assignment.assignment_id == test_assignment.id
    assert ai_assignment.confidence_score == 0.95

async def test_create_feedback(db: AsyncSession, test_submission: Submission):
    """Test creating feedback."""
    feedback = Feedback(
        content="Test Feedback",
        submission_id=test_submission.id,
        score=90
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    assert feedback.id is not None
    assert feedback.submission_id == test_submission.id
    assert feedback.score == 90

async def test_relationships(db: AsyncSession, test_feedback: Feedback):
    """Test model relationships."""
    feedback = test_feedback
    # Get submission and related objects
    submission = await db.get(Submission, feedback.submission_id)
    assignment = await db.get(Assignment, submission.assignment_id)
    student = await db.get(User, submission.user_id)
    class_ = await db.get(Class, assignment.class_id)
    teacher = await db.get(User, class_.teacher_id)

    assert feedback.submission == submission
    assert submission.assignment == assignment
    assert submission.user == student
    assert assignment.class_ == class_
    assert class_.teacher == teacher

async def test_cascade_delete(db: AsyncSession, test_class: Class):
    """Test cascade delete functionality."""
    class_id = test_class.id
    await db.delete(test_class)
    await db.commit()
    
    # Verify cascade delete
    deleted_class = await db.get(Class, class_id)
    assert deleted_class is None
    
    # Check for deleted assignments
    result = await db.execute(
        select(Assignment).where(Assignment.class_id == class_id)
    )
    assignments = result.scalars().all()
    assert len(assignments) == 0 