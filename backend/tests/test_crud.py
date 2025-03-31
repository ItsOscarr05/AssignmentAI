import pytest
from sqlalchemy.orm import Session
from app.models.ai_assignment import AIAssignment
from app.models.feedback import Feedback
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

@pytest.fixture
def sample_ai_assignment_data():
    return {
        "assignment_id": 1,
        "prompt": "Generate a math assignment",
        "generated_content": "Sample assignment content",
        "model_version": "1.0",
        "confidence_score": 0.8,
        "metadata": {"key": "value"}
    }

@pytest.fixture
def sample_feedback_data():
    return {
        "submission_id": 1,
        "content": "Good work overall",
        "feedback_type": "content",
        "confidence_score": 0.8,
        "metadata": {"model_version": "1.0"}
    }

def test_create_ai_assignment(db: Session, sample_ai_assignment_data):
    # Create AI assignment
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    
    # Assert
    assert ai_assignment.assignment_id == sample_ai_assignment_data["assignment_id"]
    assert ai_assignment.prompt == sample_ai_assignment_data["prompt"]
    assert ai_assignment.generated_content == sample_ai_assignment_data["generated_content"]
    assert ai_assignment.model_version == sample_ai_assignment_data["model_version"]
    assert ai_assignment.confidence_score == sample_ai_assignment_data["confidence_score"]
    assert ai_assignment.metadata == sample_ai_assignment_data["metadata"]

def test_get_ai_assignment(db: Session, sample_ai_assignment_data):
    # Create AI assignment
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    
    # Get AI assignment
    retrieved = get_ai_assignment(db, ai_assignment.id)
    
    # Assert
    assert retrieved.id == ai_assignment.id
    assert retrieved.assignment_id == ai_assignment.assignment_id
    assert retrieved.prompt == ai_assignment.prompt

def test_get_ai_assignment_by_assignment(db: Session, sample_ai_assignment_data):
    # Create multiple AI assignments for same assignment
    ai_assignment1 = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    ai_assignment2 = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    
    # Get AI assignments by assignment_id
    assignments = get_ai_assignment_by_assignment(db, sample_ai_assignment_data["assignment_id"])
    
    # Assert
    assert len(assignments) == 2
    assert assignments[0].id == ai_assignment1.id
    assert assignments[1].id == ai_assignment2.id

def test_update_ai_assignment(db: Session, sample_ai_assignment_data):
    # Create AI assignment
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    
    # Update AI assignment
    update_data = AIAssignmentUpdate(
        prompt="Updated prompt",
        generated_content="Updated content",
        confidence_score=0.9
    )
    updated = update_ai_assignment(db, ai_assignment.id, update_data)
    
    # Assert
    assert updated.id == ai_assignment.id
    assert updated.prompt == "Updated prompt"
    assert updated.generated_content == "Updated content"
    assert updated.confidence_score == 0.9
    assert updated.model_version == ai_assignment.model_version  # Unchanged

def test_delete_ai_assignment(db: Session, sample_ai_assignment_data):
    # Create AI assignment
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    
    # Delete AI assignment
    delete_ai_assignment(db, ai_assignment.id)
    
    # Assert
    deleted = get_ai_assignment(db, ai_assignment.id)
    assert deleted is None

def test_create_feedback(db: Session, sample_feedback_data):
    # Create feedback
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    
    # Assert
    assert feedback.submission_id == sample_feedback_data["submission_id"]
    assert feedback.content == sample_feedback_data["content"]
    assert feedback.feedback_type == sample_feedback_data["feedback_type"]
    assert feedback.confidence_score == sample_feedback_data["confidence_score"]
    assert feedback.metadata == sample_feedback_data["metadata"]

def test_get_feedback(db: Session, sample_feedback_data):
    # Create feedback
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    
    # Get feedback
    retrieved = get_feedback(db, feedback.id)
    
    # Assert
    assert retrieved.id == feedback.id
    assert retrieved.submission_id == feedback.submission_id
    assert retrieved.content == feedback.content

def test_get_feedback_by_submission(db: Session, sample_feedback_data):
    # Create multiple feedback entries for same submission
    feedback1 = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    feedback2 = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    
    # Get feedback by submission_id
    feedback_list = get_feedback_by_submission(db, sample_feedback_data["submission_id"])
    
    # Assert
    assert len(feedback_list) == 2
    assert feedback_list[0].id == feedback1.id
    assert feedback_list[1].id == feedback2.id

def test_update_feedback(db: Session, sample_feedback_data):
    # Create feedback
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    
    # Update feedback
    update_data = FeedbackUpdate(
        content="Updated feedback",
        confidence_score=0.9
    )
    updated = update_feedback(db, feedback.id, update_data)
    
    # Assert
    assert updated.id == feedback.id
    assert updated.content == "Updated feedback"
    assert updated.confidence_score == 0.9
    assert updated.feedback_type == feedback.feedback_type  # Unchanged

def test_delete_feedback(db: Session, sample_feedback_data):
    # Create feedback
    feedback = create_feedback(db, FeedbackCreate(**sample_feedback_data))
    
    # Delete feedback
    delete_feedback(db, feedback.id)
    
    # Assert
    deleted = get_feedback(db, feedback.id)
    assert deleted is None

def test_cascade_delete(db: Session, sample_ai_assignment_data):
    # Create AI assignment
    ai_assignment = create_ai_assignment(db, AIAssignmentCreate(**sample_ai_assignment_data))
    
    # Create feedback linked to AI assignment
    feedback_data = {
        "submission_id": ai_assignment.id,
        "content": "Good work overall",
        "feedback_type": "content",
        "confidence_score": 0.8,
        "metadata": {"model_version": "1.0"}
    }
    feedback = create_feedback(db, FeedbackCreate(**feedback_data))
    
    # Delete AI assignment
    delete_ai_assignment(db, ai_assignment.id)
    
    # Assert feedback is also deleted
    deleted_feedback = get_feedback(db, feedback.id)
    assert deleted_feedback is None 