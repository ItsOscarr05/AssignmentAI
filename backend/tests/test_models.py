import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
from app.models.user import User
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.schemas.user import UserCreate
from app.schemas.assignment import AssignmentCreate
from app.schemas.submission import SubmissionCreate
from app.schemas.feedback import FeedbackCreate
from app.schemas.ai_assignment import AIAssignmentCreate

@pytest.fixture
def sample_user_data():
    return {
        "email": "test@example.com",
        "hashed_password": "hashed_password",
        "full_name": "Test User",
        "role": "teacher"
    }

@pytest.fixture
def sample_assignment_data():
    return {
        "title": "Test Assignment",
        "description": "Test Description",
        "due_date": datetime.utcnow(),
        "max_score": 100,
        "status": "draft"
    }

@pytest.fixture
def sample_submission_data():
    return {
        "content": "Test submission content",
        "score": 85,
        "status": "submitted",
        "submitted_at": datetime.utcnow()
    }

@pytest.fixture
def sample_ai_assignment_data():
    return {
        "prompt": "Generate a math assignment",
        "generated_content": "Sample assignment content",
        "model_version": "1.0",
        "confidence_score": 0.8,
        "metadata": {"key": "value"}
    }

@pytest.fixture
def sample_feedback_data():
    return {
        "content": "Good work overall",
        "feedback_type": "content",
        "confidence_score": 0.8,
        "metadata": {"model_version": "1.0"}
    }

def test_create_user(db: Session, sample_user_data):
    # Create user
    user = User(**sample_user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Assert
    assert user.id is not None
    assert user.email == sample_user_data["email"]
    assert user.hashed_password == sample_user_data["hashed_password"]
    assert user.full_name == sample_user_data["full_name"]
    assert user.role == sample_user_data["role"]
    assert user.created_at is not None
    assert user.updated_at is not None

def test_create_assignment(db: Session, sample_user_data, sample_assignment_data):
    # Create user
    user = User(**sample_user_data)
    db.add(user)
    db.commit()
    
    # Create assignment
    assignment = Assignment(**sample_assignment_data, created_by_id=user.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    # Assert
    assert assignment.id is not None
    assert assignment.title == sample_assignment_data["title"]
    assert assignment.description == sample_assignment_data["description"]
    assert assignment.due_date == sample_assignment_data["due_date"]
    assert assignment.max_score == sample_assignment_data["max_score"]
    assert assignment.status == sample_assignment_data["status"]
    assert assignment.created_by_id == user.id
    assert assignment.created_at is not None
    assert assignment.updated_at is not None

def test_create_submission(db: Session, sample_user_data, sample_assignment_data, sample_submission_data):
    # Create user and assignment
    user = User(**sample_user_data)
    db.add(user)
    db.commit()
    
    assignment = Assignment(**sample_assignment_data, created_by_id=user.id)
    db.add(assignment)
    db.commit()
    
    # Create submission
    submission = Submission(**sample_submission_data, user_id=user.id, assignment_id=assignment.id)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Assert
    assert submission.id is not None
    assert submission.content == sample_submission_data["content"]
    assert submission.score == sample_submission_data["score"]
    assert submission.status == sample_submission_data["status"]
    assert submission.submitted_at == sample_submission_data["submitted_at"]
    assert submission.user_id == user.id
    assert submission.assignment_id == assignment.id
    assert submission.created_at is not None
    assert submission.updated_at is not None

def test_create_ai_assignment(db: Session, sample_assignment_data, sample_ai_assignment_data):
    # Create assignment
    assignment = Assignment(**sample_assignment_data, created_by_id=1)
    db.add(assignment)
    db.commit()
    
    # Create AI assignment
    ai_assignment = AIAssignment(**sample_ai_assignment_data, assignment_id=assignment.id)
    db.add(ai_assignment)
    db.commit()
    db.refresh(ai_assignment)
    
    # Assert
    assert ai_assignment.id is not None
    assert ai_assignment.prompt == sample_ai_assignment_data["prompt"]
    assert ai_assignment.generated_content == sample_ai_assignment_data["generated_content"]
    assert ai_assignment.model_version == sample_ai_assignment_data["model_version"]
    assert ai_assignment.confidence_score == sample_ai_assignment_data["confidence_score"]
    assert ai_assignment.metadata == sample_ai_assignment_data["metadata"]
    assert ai_assignment.assignment_id == assignment.id
    assert ai_assignment.created_at is not None
    assert ai_assignment.updated_at is not None

def test_create_feedback(db: Session, sample_submission_data, sample_feedback_data):
    # Create submission
    submission = Submission(**sample_submission_data, user_id=1, assignment_id=1)
    db.add(submission)
    db.commit()
    
    # Create feedback
    feedback = Feedback(**sample_feedback_data, submission_id=submission.id)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    # Assert
    assert feedback.id is not None
    assert feedback.content == sample_feedback_data["content"]
    assert feedback.feedback_type == sample_feedback_data["feedback_type"]
    assert feedback.confidence_score == sample_feedback_data["confidence_score"]
    assert feedback.metadata == sample_feedback_data["metadata"]
    assert feedback.submission_id == submission.id
    assert feedback.created_at is not None
    assert feedback.updated_at is not None

def test_relationships(db: Session, sample_user_data, sample_assignment_data, sample_submission_data, sample_feedback_data):
    # Create user
    user = User(**sample_user_data)
    db.add(user)
    db.commit()
    
    # Create assignment
    assignment = Assignment(**sample_assignment_data, created_by_id=user.id)
    db.add(assignment)
    db.commit()
    
    # Create submission
    submission = Submission(**sample_submission_data, user_id=user.id, assignment_id=assignment.id)
    db.add(submission)
    db.commit()
    
    # Create feedback
    feedback = Feedback(**sample_feedback_data, submission_id=submission.id)
    db.add(feedback)
    db.commit()
    
    # Test relationships
    assert submission.user == user
    assert submission.assignment == assignment
    assert feedback.submission == submission
    assert user.submissions == [submission]
    assert assignment.submissions == [submission]
    assert submission.feedback == [feedback]

def test_cascade_delete(db: Session, sample_user_data, sample_assignment_data, sample_submission_data, sample_feedback_data):
    # Create user
    user = User(**sample_user_data)
    db.add(user)
    db.commit()
    
    # Create assignment
    assignment = Assignment(**sample_assignment_data, created_by_id=user.id)
    db.add(assignment)
    db.commit()
    
    # Create submission
    submission = Submission(**sample_submission_data, user_id=user.id, assignment_id=assignment.id)
    db.add(submission)
    db.commit()
    
    # Create feedback
    feedback = Feedback(**sample_feedback_data, submission_id=submission.id)
    db.add(feedback)
    db.commit()
    
    # Delete submission
    db.delete(submission)
    db.commit()
    
    # Assert feedback is deleted
    deleted_feedback = db.query(Feedback).filter_by(id=feedback.id).first()
    assert deleted_feedback is None

def test_user_model(db: Session):
    """Test user model creation and relationships"""
    user_data = UserCreate(
        email="test@example.com",
        password="testpassword",
        full_name="Test User",
        role="teacher"
    )
    user = User(**user_data.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    
    assert user.id is not None
    assert user.email == user_data.email
    assert user.full_name == user_data.full_name
    assert user.role == user_data.role
    assert user.is_active is True
    assert user.is_verified is False

def test_assignment_model(db: Session, test_user: User):
    """Test assignment model creation and relationships"""
    assignment_data = AssignmentCreate(
        title="Test Assignment",
        description="Test Description",
        due_date="2024-12-31T23:59:59",
        max_score=100
    )
    assignment = Assignment(**assignment_data.dict(), teacher_id=test_user.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    assert assignment.id is not None
    assert assignment.title == assignment_data.title
    assert assignment.teacher_id == test_user.id
    assert assignment.created_at is not None
    assert assignment.updated_at is not None

def test_submission_model(db: Session, test_assignment: Assignment, test_student: User):
    """Test submission model creation and relationships"""
    submission_data = SubmissionCreate(
        content="Test Submission",
        file_path="test.pdf"
    )
    submission = Submission(
        **submission_data.dict(),
        assignment_id=test_assignment.id,
        student_id=test_student.id
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    assert submission.id is not None
    assert submission.content == submission_data.content
    assert submission.assignment_id == test_assignment.id
    assert submission.student_id == test_student.id
    assert submission.submitted_at is not None

def test_feedback_model(db: Session, test_submission: Submission, test_user: User):
    """Test feedback model creation and relationships"""
    feedback_data = FeedbackCreate(
        content="Test Feedback",
        score=85
    )
    feedback = Feedback(
        **feedback_data.dict(),
        submission_id=test_submission.id,
        teacher_id=test_user.id
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    assert feedback.id is not None
    assert feedback.content == feedback_data.content
    assert feedback.score == feedback_data.score
    assert feedback.submission_id == test_submission.id
    assert feedback.teacher_id == test_user.id
    assert feedback.created_at is not None

def test_ai_assignment_model(db: Session, test_user: User):
    """Test AI assignment model creation and relationships"""
    ai_assignment_data = AIAssignmentCreate(
        title="AI Test Assignment",
        description="AI Test Description",
        subject="Computer Science",
        difficulty="intermediate",
        num_questions=5
    )
    ai_assignment = AIAssignment(
        **ai_assignment_data.dict(),
        teacher_id=test_user.id
    )
    db.add(ai_assignment)
    db.commit()
    db.refresh(ai_assignment)
    
    assert ai_assignment.id is not None
    assert ai_assignment.title == ai_assignment_data.title
    assert ai_assignment.teacher_id == test_user.id
    assert ai_assignment.status == "pending"
    assert ai_assignment.created_at is not None

def test_model_relationships(db: Session, test_user: User):
    """Test model relationships"""
    # Create assignment
    assignment = Assignment(
        title="Test Assignment",
        description="Test Description",
        teacher_id=test_user.id
    )
    db.add(assignment)
    db.commit()
    
    # Create submission
    submission = Submission(
        content="Test Submission",
        assignment_id=assignment.id,
        student_id=test_user.id
    )
    db.add(submission)
    db.commit()
    
    # Create feedback
    feedback = Feedback(
        content="Test Feedback",
        score=85,
        submission_id=submission.id,
        teacher_id=test_user.id
    )
    db.add(feedback)
    db.commit()
    
    # Test relationships
    assert assignment.submissions == [submission]
    assert submission.feedback == [feedback]
    assert feedback.submission == submission
    assert feedback.teacher == test_user

def test_model_cascade_delete(db: Session, test_user: User):
    """Test cascade delete behavior"""
    # Create assignment
    assignment = Assignment(
        title="Test Assignment",
        description="Test Description",
        teacher_id=test_user.id
    )
    db.add(assignment)
    db.commit()
    
    # Create submission
    submission = Submission(
        content="Test Submission",
        assignment_id=assignment.id,
        student_id=test_user.id
    )
    db.add(submission)
    db.commit()
    
    # Delete assignment and verify cascade
    db.delete(assignment)
    db.commit()
    
    # Verify submission is deleted
    assert db.query(Submission).filter_by(id=submission.id).first() is None 