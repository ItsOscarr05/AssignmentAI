from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from models.assignment import AssignmentSubmission
from models.user import User
from services.auth import get_current_active_user
from services.ai import AIService
from database import get_db

router = APIRouter()

class RubricCriterion(BaseModel):
    name: str
    description: str
    weight: Optional[float] = 1.0

class AnalysisRequest(BaseModel):
    rubric_criteria: Optional[List[RubricCriterion]] = None

@router.post("/submissions/{submission_id}/analyze")
async def analyze_submission(
    submission_id: int,
    request: AnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can analyze submissions"
        )
    
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to analyze this submission"
        )
    
    ai_service = AIService(db)
    rubric_criteria = None
    if request.rubric_criteria:
        rubric_criteria = [c.dict() for c in request.rubric_criteria]
    
    try:
        analysis = await ai_service.analyze_submission(
            submission,
            rubric_criteria
        )
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing submission: {str(e)}"
        )

@router.post("/submissions/{submission_id}/check-plagiarism")
async def check_plagiarism(
    submission_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can check for plagiarism"
        )
    
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to check this submission"
        )
    
    ai_service = AIService(db)
    try:
        plagiarism_check = await ai_service.detect_plagiarism(submission)
        return plagiarism_check
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking plagiarism: {str(e)}"
        )

@router.post("/submissions/{submission_id}/smart-grade")
async def smart_grade(
    submission_id: int,
    request: AnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can use smart grading"
        )
    
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to grade this submission"
        )
    
    ai_service = AIService(db)
    rubric_criteria = None
    if request.rubric_criteria:
        rubric_criteria = [c.dict() for c in request.rubric_criteria]
    
    try:
        grade = await ai_service.generate_smart_grade(
            submission,
            rubric_criteria
        )
        return grade
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating grade: {str(e)}"
        )

@router.post("/submissions/{submission_id}/generate-feedback")
async def generate_feedback(
    submission_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can generate feedback"
        )
    
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to generate feedback for this submission"
        )
    
    ai_service = AIService(db)
    try:
        # First analyze the submission
        analysis = await ai_service.analyze_submission(submission)
        
        # Then generate feedback based on the analysis
        feedback = await ai_service.generate_feedback(submission, analysis)
        return feedback
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating feedback: {str(e)}"
        ) 