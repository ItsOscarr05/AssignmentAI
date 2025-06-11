from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models.assignment import Assignment, AssignmentSubmission, AssignmentStatus
from datetime import datetime

class GradingService:
    def __init__(self, db: Session):
        self.db = db

    async def grade_submission(
        self,
        submission_id: int,
        score: int,
        feedback: Optional[str] = None,
        rubric_criteria: Optional[Dict[str, Any]] = None
    ) -> AssignmentSubmission:
        """
        Grade a submission and update the assignment status
        
        Args:
            submission_id: ID of the submission to grade
            score: Numerical score for the submission
            feedback: Optional feedback for the student
            rubric_criteria: Optional dictionary of rubric criteria scores
            
        Returns:
            Updated submission object
        """
        submission = self.db.query(AssignmentSubmission).filter(
            AssignmentSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        # Update submission
        submission.score = score
        submission.feedback = feedback
        submission.graded_at = datetime.utcnow()
        
        # Update assignment
        assignment = submission.assignment
        assignment.current_score = score
        assignment.feedback = feedback
        assignment.status = AssignmentStatus.GRADED
        
        # Save changes
        self.db.commit()
        self.db.refresh(submission)
        
        return submission

    async def calculate_late_penalty(
        self,
        submission: AssignmentSubmission,
        penalty_percentage: float = 10.0
    ) -> float:
        """
        Calculate late penalty for a submission
        
        Args:
            submission: The submission to calculate penalty for
            penalty_percentage: Percentage to deduct per day late
            
        Returns:
            Calculated penalty score
        """
        assignment = submission.assignment
        if not assignment.due_date:
            return 0.0
            
        days_late = (submission.submitted_at - assignment.due_date).days
        if days_late <= 0:
            return 0.0
            
        penalty = (penalty_percentage * days_late) / 100.0
        return min(penalty, 1.0)  # Cap at 100% penalty

    async def apply_late_penalty(
        self,
        submission: AssignmentSubmission,
        penalty_percentage: float = 10.0
    ) -> AssignmentSubmission:
        """
        Apply late penalty to a submission
        
        Args:
            submission: The submission to apply penalty to
            penalty_percentage: Percentage to deduct per day late
            
        Returns:
            Updated submission object
        """
        if not submission.score:
            return submission
            
        penalty = await self.calculate_late_penalty(submission, penalty_percentage)
        if penalty > 0:
            submission.score = int(submission.score * (1 - penalty))
            submission.assignment.status = AssignmentStatus.LATE
            self.db.commit()
            self.db.refresh(submission)
            
        return submission

    async def get_grading_statistics(
        self,
        assignment_id: int
    ) -> Dict[str, Any]:
        """
        Get grading statistics for an assignment
        
        Args:
            assignment_id: ID of the assignment
            
        Returns:
            Dictionary containing grading statistics
        """
        submissions = self.db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id
        ).all()
        
        if not submissions:
            return {
                "total_submissions": 0,
                "graded_submissions": 0,
                "average_score": 0,
                "highest_score": 0,
                "lowest_score": 0,
                "late_submissions": 0
            }
            
        graded_submissions = [s for s in submissions if s.score is not None]
        late_submissions = [s for s in submissions if s.assignment.status == AssignmentStatus.LATE]
        
        scores = [s.score for s in graded_submissions if s.score is not None]
        
        return {
            "total_submissions": len(submissions),
            "graded_submissions": len(graded_submissions),
            "average_score": sum(scores) / len(scores) if scores else 0,
            "highest_score": max(scores) if scores else 0,
            "lowest_score": min(scores) if scores else 0,
            "late_submissions": len(late_submissions)
        } 