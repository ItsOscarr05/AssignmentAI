"""
Feedback routes for AssignmentAI.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database.models import Feedback, Assignment
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from security import get_current_user
from schemas import FeedbackCreate, FeedbackUpdate, FeedbackResponse

router = APIRouter()

@router.post("/feedback/", response_model=FeedbackResponse)
async def create_feedback(
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create new feedback for an assignment."""
    # Check if assignment exists
    assignment = await db.get(Assignment, feedback.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Only teachers and admins can give feedback
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to give feedback")
    
    # Create feedback
    db_feedback = Feedback(
        assignment_id=feedback.assignment_id,
        reviewer_id=current_user.id,
        content=feedback.content,
        score=feedback.score,
        rubric_data=feedback.rubric_data
    )
    db.add(db_feedback)
    await db.commit()
    await db.refresh(db_feedback)
    return db_feedback

@router.get("/feedback/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get feedback by ID."""
    feedback = await db.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Check if user has access to this feedback
    assignment = await db.get(Assignment, feedback.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if (current_user.role not in ["teacher", "admin"] and 
        assignment.user_id != current_user.id and 
        feedback.reviewer_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this feedback")
    
    return feedback

@router.put("/feedback/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(
    feedback_id: int,
    feedback_update: FeedbackUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update feedback."""
    feedback = await db.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Only the reviewer can update their feedback
    if feedback.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this feedback")
    
    for field, value in feedback_update.dict(exclude_unset=True).items():
        setattr(feedback, field, value)
    
    await db.commit()
    await db.refresh(feedback)
    return feedback

@router.delete("/feedback/{feedback_id}")
async def delete_feedback(
    feedback_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete feedback."""
    feedback = await db.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Only the reviewer or an admin can delete feedback
    if current_user.role != "admin" and feedback.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this feedback")
    
    await db.delete(feedback)
    await db.commit()
    return {"message": "Feedback deleted"}

@router.get("/assignments/{assignment_id}/feedback", response_model=List[FeedbackResponse])
async def list_assignment_feedback(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all feedback for an assignment."""
    assignment = await db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if user has access to this assignment's feedback
    if (current_user.role not in ["teacher", "admin"] and 
        assignment.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this assignment's feedback")
    
    feedback = await db.query(Feedback).filter(Feedback.assignment_id == assignment_id).all()
    return feedback 