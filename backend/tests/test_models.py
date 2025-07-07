import pytest
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
from app.models.user import User
from app.models.assignment import Assignment, AssignmentStatus, DifficultyLevel
from app.models.submission import Submission, SubmissionStatus
from app.models.class_model import Class
from app.schemas.user import UserCreate
from app.schemas.assignment import AssignmentCreate
from app.schemas.submission import SubmissionCreate
from app.schemas.feedback import FeedbackCreate
from app.schemas.ai_assignment import AIAssignmentCreate
from app.core.security import get_password_hash
from app.db.base_class import Base
from app.database import engine
import uuid

# Create sync session factory for testing
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_create_user(db):
    """Test creating a user."""
    session = db
    try:
        # Use a unique email for each test run
        user = User(  # type: ignore[misc]
            email=f"test-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("testpassword"),
            name="Test User",
            updated_at=datetime.utcnow()
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        assert user.id is not None
        assert user.email.startswith("test-")
        assert user.name == "Test User"
    finally:
        session.rollback()

def test_create_class(db):
    """Test creating a class."""
    session = db
    try:
        # First create a teacher user
        teacher = User(  # type: ignore[call-arg]
            email=f"teacher-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("teacherpassword"),
            name="Test Teacher",
            updated_at=datetime.utcnow()
        )
        session.add(teacher)
        session.commit()
        session.refresh(teacher)
        
        # Then create the class
        class_ = Class(  # type: ignore[call-arg]
            name="Test Class",
            code=f"TEST101-{uuid.uuid4()}",
            description="Test Description",
            teacher_id=teacher.id
        )
        session.add(class_)
        session.commit()
        session.refresh(class_)
        assert class_.id is not None
        assert class_.name == "Test Class"
        assert class_.teacher_id == teacher.id
    finally:
        session.rollback()

def test_create_assignment(db):
    """Test creating an assignment."""
    session = db
    try:
        # First create a teacher and class
        teacher = User(  # type: ignore[call-arg]
            email=f"teacher-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("teacherpassword"),
            name="Test Teacher",
            updated_at=datetime.utcnow()
        )
        session.add(teacher)
        session.commit()
        session.refresh(teacher)
        
        class_ = Class(  # type: ignore[call-arg]
            name="Test Class",
            code=f"TEST101-{uuid.uuid4()}",
            description="Test Description",
            teacher_id=teacher.id
        )
        session.add(class_)
        session.commit()
        session.refresh(class_)
        
        # Then create the assignment
        assignment = Assignment(  # type: ignore[call-arg]
            title="Test Assignment",
            description="Test Description",
            due_date=datetime.utcnow(),
            class_id=class_.id,
            status=AssignmentStatus.DRAFT,
            difficulty=DifficultyLevel.EASY,
            subject="Mathematics",
            grade_level="10",
            assignment_type="homework",
            topic="Algebra",
            estimated_time=60,
            content="Test content",
            user_id=class_.teacher_id,
            created_by_id=class_.teacher_id,
            teacher_id=class_.teacher_id
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        assert assignment.id is not None
        assert assignment.title == "Test Assignment"
        assert assignment.class_id == class_.id
    finally:
        session.rollback()
        session.close()

def test_create_submission(db):
    """Test creating a submission."""
    session = db
    try:
        # Create all required objects
        teacher = User(  # type: ignore[call-arg]
            email=f"teacher-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("teacherpassword"),
            name="Test Teacher",
            updated_at=datetime.utcnow()
        )
        session.add(teacher)
        session.commit()
        session.refresh(teacher)
        
        class_ = Class(  # type: ignore[call-arg]
            name="Test Class",
            code=f"TEST101-{uuid.uuid4()}",
            description="Test Description",
            teacher_id=teacher.id
        )
        session.add(class_)
        session.commit()
        session.refresh(class_)
        
        assignment = Assignment(  # type: ignore[call-arg]
            title="Test Assignment",
            description="Test Description",
            due_date=datetime.utcnow(),
            class_id=class_.id,
            status=AssignmentStatus.DRAFT,
            difficulty=DifficultyLevel.EASY,
            subject="Mathematics",
            grade_level="10",
            assignment_type="homework",
            topic="Algebra",
            estimated_time=60,
            content="Test content",
            user_id=class_.teacher_id,
            created_by_id=class_.teacher_id,
            teacher_id=class_.teacher_id
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        
        student = User(  # type: ignore[call-arg]
            email=f"student-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("studentpassword"),
            name="Test Student",
            updated_at=datetime.utcnow()
        )
        session.add(student)
        session.commit()
        session.refresh(student)
        
        # Create submission
        submission = Submission(  # type: ignore[call-arg]
            title="Test Submission",
            content="Test Submission",
            assignment_id=assignment.id,
            user_id=student.id,
            status=SubmissionStatus.SUBMITTED
        )
        session.add(submission)
        session.commit()
        session.refresh(submission)
        assert submission.id is not None
        assert submission.assignment_id == assignment.id
        assert submission.user_id == student.id
    finally:
        session.rollback()

def test_create_ai_assignment(db):
    """Test creating an AI assignment."""
    session = db
    try:
        # Create required objects
        teacher = User(  # type: ignore[call-arg]
            email=f"teacher-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("teacherpassword"),
            name="Test Teacher",
            updated_at=datetime.utcnow()
        )
        session.add(teacher)
        session.commit()
        session.refresh(teacher)
        
        class_ = Class(  # type: ignore[call-arg]
            name="Test Class",
            code=f"TEST101-{uuid.uuid4()}",
            description="Test Description",
            teacher_id=teacher.id
        )
        session.add(class_)
        session.commit()
        session.refresh(class_)
        
        assignment = Assignment(  # type: ignore[call-arg]
            title="Test Assignment",
            description="Test Description",
            due_date=datetime.utcnow(),
            class_id=class_.id,
            status=AssignmentStatus.DRAFT,
            difficulty=DifficultyLevel.EASY,
            subject="Mathematics",
            grade_level="10",
            assignment_type="homework",
            topic="Algebra",
            estimated_time=60,
            content="Test content",
            user_id=class_.teacher_id,
            created_by_id=class_.teacher_id,
            teacher_id=class_.teacher_id
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        
        # Create AI assignment
        ai_assignment = AIAssignment(  # type: ignore[call-arg]
            prompt="Generate a math problem",
            generated_content="Solve for x: 2x + 5 = 13",
            assignment_id=assignment.id,
            user_id=teacher.id,  # Set user_id to teacher.id
            model="gpt-4",  # Set model to satisfy NOT NULL constraint
            max_tokens=256,  # Set max_tokens to satisfy NOT NULL constraint
            temperature=0.7,  # Set temperature to satisfy NOT NULL constraint
            model_version="gpt-4",
            confidence_score=0.95,
            generated_at=datetime.utcnow()
        )
        session.add(ai_assignment)
        session.commit()
        session.refresh(ai_assignment)
        assert ai_assignment.id is not None
        assert ai_assignment.assignment_id == assignment.id
        assert ai_assignment.prompt == "Generate a math problem"
    finally:
        session.rollback()

def test_create_feedback(db):
    """Test creating feedback."""
    session = db
    try:
        # Create required objects
        teacher = User(  # type: ignore[call-arg]
            email=f"teacher-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("teacherpassword"),
            name="Test Teacher",
            updated_at=datetime.utcnow()
        )
        session.add(teacher)
        session.commit()
        session.refresh(teacher)
        
        class_ = Class(  # type: ignore[call-arg]
            name="Test Class",
            code=f"TEST101-{uuid.uuid4()}",
            description="Test Description",
            teacher_id=teacher.id
        )
        session.add(class_)
        session.commit()
        session.refresh(class_)
        
        assignment = Assignment(  # type: ignore[call-arg]
            title="Test Assignment",
            description="Test Description",
            due_date=datetime.utcnow(),
            class_id=class_.id,
            status=AssignmentStatus.DRAFT,
            difficulty=DifficultyLevel.EASY,
            subject="Mathematics",
            grade_level="10",
            assignment_type="homework",
            topic="Algebra",
            estimated_time=60,
            content="Test content",
            user_id=class_.teacher_id,
            created_by_id=class_.teacher_id,
            teacher_id=class_.teacher_id
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        
        student = User(  # type: ignore[call-arg]
            email=f"student-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("studentpassword"),
            name="Test Student",
            updated_at=datetime.utcnow()
        )
        session.add(student)
        session.commit()
        session.refresh(student)
        
        submission = Submission(  # type: ignore[call-arg]
            title="Test Submission",
            content="Test Submission",
            assignment_id=assignment.id,
            user_id=student.id,
            status=SubmissionStatus.SUBMITTED
        )
        session.add(submission)
        session.commit()
        session.refresh(submission)
        
        # Create feedback
        feedback = Feedback(  # type: ignore[call-arg]
            content="Great work!",
            feedback_type="positive",
            submission_id=submission.id,
            score=85
        )
        session.add(feedback)
        session.commit()
        session.refresh(feedback)
        assert feedback.id is not None
        assert feedback.submission_id == submission.id
        assert feedback.score == 85
    finally:
        session.rollback()

def test_relationships(db):
    """Test model relationships."""
    session = db
    try:
        # Create teacher
        teacher = User(  # type: ignore[call-arg]
            email=f"teacher-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("teacherpassword"),
            name="Test Teacher",
            updated_at=datetime.utcnow()
        )
        session.add(teacher)
        session.commit()
        session.refresh(teacher)
        
        # Create class
        class_ = Class(  # type: ignore[call-arg]
            name="Test Class",
            code=f"TEST101-{uuid.uuid4()}",
            description="Test Description",
            teacher_id=teacher.id
        )
        session.add(class_)
        session.commit()
        session.refresh(class_)
        
        # Create assignment
        assignment = Assignment(  # type: ignore[call-arg]
            title="Test Assignment",
            description="Test Description",
            due_date=datetime.utcnow(),
            class_id=class_.id,
            status=AssignmentStatus.DRAFT,
            difficulty=DifficultyLevel.EASY,
            subject="Mathematics",
            grade_level="10",
            assignment_type="homework",
            topic="Algebra",
            estimated_time=60,
            content="Test content",
            user_id=class_.teacher_id,
            created_by_id=class_.teacher_id,
            teacher_id=class_.teacher_id
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        
        # Test relationships
        assert assignment.class_id == class_.id
        assert class_.teacher_id == teacher.id
        assert assignment.teacher_id == teacher.id
    finally:
        session.rollback()

def test_cascade_delete(db):
    """Test cascade delete functionality."""
    session = db
    try:
        # Create teacher
        teacher = User(  # type: ignore[call-arg]
            email=f"teacher-{uuid.uuid4()}@example.com",
            hashed_password=get_password_hash("teacherpassword"),
            name="Test Teacher",
            updated_at=datetime.utcnow()
        )
        session.add(teacher)
        session.commit()
        session.refresh(teacher)
        
        # Create class
        class_ = Class(  # type: ignore[call-arg]
            name="Test Class",
            code=f"TEST101-{uuid.uuid4()}",
            description="Test Description",
            teacher_id=teacher.id
        )
        session.add(class_)
        session.commit()
        session.refresh(class_)
        
        # Create assignment
        assignment = Assignment(  # type: ignore[call-arg]
            title="Test Assignment",
            description="Test Description",
            due_date=datetime.utcnow(),
            class_id=class_.id,
            status=AssignmentStatus.DRAFT,
            difficulty=DifficultyLevel.EASY,
            subject="Mathematics",
            grade_level="10",
            assignment_type="homework",
            topic="Algebra",
            estimated_time=60,
            content="Test content",
            user_id=class_.teacher_id,
            created_by_id=class_.teacher_id,
            teacher_id=class_.teacher_id
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        
        # Delete class and verify cascade
        session.delete(class_)
        session.commit()
        
        # Verify assignment is also deleted
        result = session.execute(select(Assignment).where(Assignment.id == assignment.id))
        assert result.scalar_one_or_none() is None
    finally:
        session.rollback() 