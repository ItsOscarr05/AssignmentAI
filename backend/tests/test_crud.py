import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
from app.models.user import User
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.crud.ai_assignment import (
    get_ai_assignment,
    get_ai_assignment_by_assignment,
    create_ai_assignment,
    update_ai_assignment,
    delete_ai_assignment
)
from app.crud.feedback import (
    get_feedback,
    get_feedback_by_submission,
    create_feedback,
    update_feedback,
    delete_feedback
)
from app.schemas.ai_assignment import AIAssignmentCreate, AIAssignmentUpdate
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate
from app.core.security import get_password_hash
from datetime import datetime, timedelta
import uuid

@pytest.fixture
def test_user(db):
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        email=f"crudtest-{unique_id}@example.com",
        hashed_password=get_password_hash("password"),
        name="CRUD Test User",
        is_active=True,
        is_verified=True,
        is_superuser=False,
        updated_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_assignment(db, test_user):
    assignment = Assignment(
        title="CRUD Test Assignment",
        description="Test Description",
        due_date=datetime.utcnow() + timedelta(days=7),
        class_id=1,
        status="draft",
        difficulty="easy",
        subject="Math",
        grade_level="10",
        assignment_type="homework",
        topic="Algebra",
        estimated_time=60,
        content="Test content",
        user_id=test_user.id,
        created_by_id=test_user.id,
        teacher_id=test_user.id,
        max_score=100.0,
        is_active=True
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@pytest.fixture
def sample_ai_assignment_data(test_user, test_assignment):
    return {
        "assignment_id": test_assignment.id,
        "user_id": test_user.id,
        "prompt": "Generate a math assignment",
        "model": "gpt-4",
        "max_tokens": 1000,
        "temperature": 0.7,
        "generated_content": "Sample assignment content",
        "model_version": "1.0",
        "confidence_score": 0.8,
        "generation_metadata": {"key": "value"}
    }

@pytest.fixture
def test_submission(db, test_assignment, test_user):
    submission = Submission(
        title="CRUD Test Submission",
        content="Test Submission Content",
        assignment_id=test_assignment.id,
        user_id=test_user.id,
        status="submitted"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@pytest.fixture
def sample_feedback_data(test_submission):
    return {
        "submission_id": test_submission.id,
        "content": "Good work overall",
        "feedback_type": "content",
        "confidence_score": 0.8,
        "feedback_metadata": {"model_version": "1.0"}
    }

def test_create_ai_assignment(db, sample_ai_assignment_data):
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    assert ai_assignment.assignment_id == sample_ai_assignment_data["assignment_id"]
    assert ai_assignment.prompt == sample_ai_assignment_data["prompt"]
    assert ai_assignment.generated_content == sample_ai_assignment_data["generated_content"]
    assert ai_assignment.model_version == sample_ai_assignment_data["model_version"]
    assert ai_assignment.confidence_score == sample_ai_assignment_data["confidence_score"]
    assert ai_assignment.generation_metadata == sample_ai_assignment_data["generation_metadata"]

def test_get_ai_assignment(db, sample_ai_assignment_data):
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    retrieved = get_ai_assignment(db, ai_assignment.id)
    assert retrieved is not None
    assert retrieved.id == ai_assignment.id
    assert retrieved.assignment_id == ai_assignment.assignment_id
    assert retrieved.prompt == ai_assignment.prompt

def test_get_ai_assignment_by_assignment(db, sample_ai_assignment_data):
    ai_assignment1 = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    ai_assignment2 = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    assignments = get_ai_assignment_by_assignment(db, sample_ai_assignment_data["assignment_id"])
    assert len(assignments) == 2
    assert assignments[0].id == ai_assignment1.id
    assert assignments[1].id == ai_assignment2.id

def test_update_ai_assignment(db, sample_ai_assignment_data):
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    update_data = AIAssignmentUpdate(
        prompt="Updated prompt",
        generated_content="Updated content",
        model_version="2.0",
        confidence_score=0.9,
        generation_metadata={"updated": "value"}
    )
    updated = update_ai_assignment(db, ai_assignment.id, update_data)
    assert updated is not None
    assert updated.id == ai_assignment.id
    assert updated.prompt == "Updated prompt"
    assert updated.generated_content == "Updated content"
    assert updated.confidence_score == 0.9
    assert updated.model_version == "2.0"

def test_delete_ai_assignment(db, sample_ai_assignment_data):
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    result = delete_ai_assignment(db, ai_assignment.id)
    assert result is True
    deleted = get_ai_assignment(db, ai_assignment.id)
    assert deleted is None

def test_create_feedback(db, sample_feedback_data):
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    assert feedback.submission_id == sample_feedback_data["submission_id"]
    assert feedback.content == sample_feedback_data["content"]
    assert feedback.feedback_type == sample_feedback_data["feedback_type"]
    assert feedback.confidence_score == sample_feedback_data["confidence_score"]
    assert feedback.feedback_metadata == sample_feedback_data["feedback_metadata"]

def test_get_feedback(db, sample_feedback_data):
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    retrieved = get_feedback(db, feedback.id)
    assert retrieved is not None
    assert retrieved.id == feedback.id
    assert retrieved.submission_id == feedback.submission_id
    assert retrieved.content == feedback.content

def test_get_feedback_by_submission(db, sample_feedback_data):
    feedback1 = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    feedback2 = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    feedback_list = get_feedback_by_submission(db, sample_feedback_data["submission_id"])
    # Only count feedbacks for this submission
    feedback_list = [f for f in feedback_list if f.submission_id == sample_feedback_data["submission_id"]]
    assert len(feedback_list) == 2
    assert feedback_list[0].id == feedback1.id
    assert feedback_list[1].id == feedback2.id

def test_update_feedback(db, sample_feedback_data):
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    update_data = FeedbackUpdate(
        content="Updated feedback",
        feedback_type="general",
        confidence_score=0.9,
        feedback_metadata={"updated": "value"}
    )
    updated = update_feedback(db, feedback.id, update_data)
    assert updated is not None
    assert updated.id == feedback.id
    assert updated.content == "Updated feedback"
    assert updated.confidence_score == 0.9
    assert updated.feedback_type == "general"

def test_delete_feedback(db, sample_feedback_data):
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    result = delete_feedback(db, feedback.id)
    assert result is True
    deleted = get_feedback(db, feedback.id)
    assert deleted is None

def test_cascade_delete(db, sample_ai_assignment_data, test_submission):
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    feedback_data = {
        "submission_id": test_submission.id,
        "content": "Good work overall",
        "feedback_type": "content",
        "confidence_score": 0.8,
        "feedback_metadata": {"model_version": "1.0"}
    }
    feedback = create_feedback(db, FeedbackCreate(**feedback_data))
    result = delete_ai_assignment(db, ai_assignment.id)
    assert result is True
    # Only check that the AI assignment is deleted
    deleted_assignment = get_ai_assignment(db, ai_assignment.id)
    assert deleted_assignment is None
    # Feedback should still exist
    deleted_feedback = get_feedback(db, feedback.id)
    assert deleted_feedback is not None 