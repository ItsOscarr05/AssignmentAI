from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from models.feedback import Feedback, RubricFeedback, FeedbackType
from models.assignment import AssignmentSubmission
from datetime import datetime

class FeedbackService:
    def __init__(self, db: Session):
        self.db = db

    async def create_feedback(
        self,
        submission_id: int,
        teacher_id: int,
        content: str,
        feedback_type: FeedbackType,
        rubric_items: Optional[List[Dict[str, Any]]] = None
    ) -> Feedback:
        """
        Create feedback for a submission
        
        Args:
            submission_id: ID of the submission
            teacher_id: ID of the teacher providing feedback
            content: Feedback content
            feedback_type: Type of feedback
            rubric_items: Optional list of rubric items
            
        Returns:
            Created feedback object
        """
        feedback = Feedback(
            submission_id=submission_id,
            teacher_id=teacher_id,
            type=feedback_type,
            content=content
        )
        
        self.db.add(feedback)
        self.db.flush()  # Get feedback ID without committing
        
        if rubric_items and feedback_type == FeedbackType.RUBRIC:
            for item in rubric_items:
                rubric_feedback = RubricFeedback(
                    feedback_id=feedback.id,
                    criterion=item["criterion"],
                    score=item["score"],
                    comment=item.get("comment")
                )
                self.db.add(rubric_feedback)
        
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    async def get_submission_feedback(
        self,
        submission_id: int
    ) -> List[Feedback]:
        """
        Get all feedback for a submission
        
        Args:
            submission_id: ID of the submission
            
        Returns:
            List of feedback objects
        """
        return self.db.query(Feedback).filter(
            Feedback.submission_id == submission_id
        ).all()

    async def update_feedback(
        self,
        feedback_id: int,
        content: str,
        rubric_items: Optional[List[Dict[str, Any]]] = None
    ) -> Feedback:
        """
        Update existing feedback
        
        Args:
            feedback_id: ID of the feedback to update
            content: Updated feedback content
            rubric_items: Optional updated rubric items
            
        Returns:
            Updated feedback object
        """
        feedback = self.db.query(Feedback).filter(
            Feedback.id == feedback_id
        ).first()
        
        if not feedback:
            raise ValueError("Feedback not found")
        
        feedback.content = content
        feedback.updated_at = datetime.utcnow()
        
        if rubric_items and feedback.type == FeedbackType.RUBRIC:
            # Delete existing rubric items
            self.db.query(RubricFeedback).filter(
                RubricFeedback.feedback_id == feedback_id
            ).delete()
            
            # Add new rubric items
            for item in rubric_items:
                rubric_feedback = RubricFeedback(
                    feedback_id=feedback.id,
                    criterion=item["criterion"],
                    score=item["score"],
                    comment=item.get("comment")
                )
                self.db.add(rubric_feedback)
        
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    async def delete_feedback(
        self,
        feedback_id: int
    ) -> None:
        """
        Delete feedback
        
        Args:
            feedback_id: ID of the feedback to delete
        """
        feedback = self.db.query(Feedback).filter(
            Feedback.id == feedback_id
        ).first()
        
        if not feedback:
            raise ValueError("Feedback not found")
        
        self.db.delete(feedback)
        self.db.commit() 