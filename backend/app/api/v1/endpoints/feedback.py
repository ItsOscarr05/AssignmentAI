from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.crud import feedback as feedback_crud
from app.schemas.feedback import Feedback, FeedbackCreate, FeedbackUpdate

router = APIRouter()

@router.get("/{feedback_id}", response_model=Feedback)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
):
    """Get feedback by ID."""
    feedback = feedback_crud.get_feedback(db, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback

@router.get("/submission/{submission_id}", response_model=List[Feedback])
def get_feedback_by_submission(
    submission_id: int,
    db: Session = Depends(get_db),
):
    """Get all feedback for a submission."""
    return feedback_crud.get_feedback_by_submission(db, submission_id)

@router.post("/", response_model=Feedback)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
):
    """Create new feedback."""
    return feedback_crud.create_feedback(db, feedback)

@router.put("/{feedback_id}", response_model=Feedback)
def update_feedback(
    feedback_id: int,
    feedback: FeedbackUpdate,
    db: Session = Depends(get_db),
):
    """Update feedback."""
    updated_feedback = feedback_crud.update_feedback(db, feedback_id, feedback)
    if not updated_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return updated_feedback

@router.delete("/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
):
    """Delete feedback."""
    success = feedback_crud.delete_feedback(db, feedback_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {"message": "Feedback deleted successfully"} 
