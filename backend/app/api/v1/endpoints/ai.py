from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.deps import get_current_user, get_db
from app.services.ai_service import AIService
from app.schemas.ai_assignment import (
    AssignmentGenerationRequest,
    AssignmentGenerationResponse,
    GeneratedAssignment,
    AIAssignment,
    AIAssignmentCreate
)
from app.schemas.feedback import Feedback, FeedbackCreate
from app.core.logger import logger
from app.core.rate_limit import check_rate_limit, rate_limiter
from app.services.ai import ai_service

router = APIRouter()

@router.post("/generate", response_model=schemas.Assignment)
async def generate_assignment(
    *,
    db: Session = Depends(get_db),
    assignment_in: schemas.AssignmentCreate,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Generate a new assignment using AI.
    """
    try:
        ai_service = AIService(db)
        tokens_needed = 1000
        await ai_service.enforce_token_limit(current_user.id, tokens_needed)
        # Generate assignment content using AI
        content = await ai_service.generate_assignment_content(assignment_in)
        
        # Create assignment with generated content
        assignment_data = assignment_in.model_dump()
        assignment_data["content"] = content
        
        assignment = crud.assignment.create_with_user(
            db=db, obj_in=schemas.AssignmentCreate(**assignment_data), user_id=current_user.id
        )
        return assignment
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating assignment: {str(e)}"
        )

@router.post("/generate-assignment", response_model=AssignmentGenerationResponse)
async def generate_assignment_old(
    request: Request,
    assignment_request: AssignmentGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Generate an assignment using AI.
    Only teachers can generate assignments.
    """
    # Check user role
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can generate assignments"
        )
    
    # Check rate limit
    client_id = request.client.host
    remaining = check_rate_limit(client_id)
    
    try:
        ai_service = AIService(db)
        tokens_needed = 1000
        await ai_service.enforce_token_limit(current_user.id, tokens_needed)
        response = await ai_service.generate_assignment(assignment_request)
        
        if response.success and response.assignment:
            # Store the generated assignment in the background
            background_tasks.add_task(
                _store_generated_assignment,
                db,
                response.assignment,
                assignment_request,
                current_user.id
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in generate_assignment endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating the assignment"
        )

@router.post("/generate-feedback", response_model=Feedback)
async def generate_feedback(
    request: Request,
    submission_content: str,
    feedback_type: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Generate feedback for a submission using AI.
    Only teachers can generate feedback.
    """
    # Check user role
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can generate feedback"
        )
    
    # Check rate limit
    client_id = request.client.host
    remaining = check_rate_limit(client_id)
    
    try:
        ai_service = AIService(db)
        tokens_needed = 500
        await ai_service.enforce_token_limit(current_user.id, tokens_needed)
        feedback = await ai_service.generate_feedback(submission_content, feedback_type)
        
        if not feedback:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate feedback"
            )
        
        # Store the feedback in the background
        background_tasks.add_task(
            _store_generated_feedback,
            db,
            feedback,
            current_user.id
        )
        
        return feedback
        
    except Exception as e:
        logger.error(f"Error in generate_feedback endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating feedback"
        )

async def _store_generated_assignment(
    db: Session,
    assignment: GeneratedAssignment,
    request: AssignmentGenerationRequest,
    user_id: int
):
    """
    Store the generated assignment in the database.
    """
    try:
        # Create the AI assignment record
        ai_assignment = AIAssignmentCreate(
            prompt=request.model_dump_json(),
            generated_content=assignment.model_dump_json(),
            model_version="1.0",  # TODO: Get from settings
            confidence_score=0.8,  # TODO: Get from AI model
            metadata={
                "subject": request.subject,
                "grade_level": request.grade_level,
                "topic": request.topic,
                "difficulty": request.difficulty,
                "generated_by": user_id
            }
        )
        
        # TODO: Add assignment_id once we have the assignment creation endpoint
        # ai_assignment.assignment_id = assignment_id
        
        from app.crud import ai_assignment as ai_assignment_crud
        ai_assignment_crud.create_ai_assignment(db, ai_assignment)
        
    except Exception as e:
        logger.error(f"Error storing generated assignment: {str(e)}")

async def _store_generated_feedback(
    db: Session,
    feedback: FeedbackCreate,
    user_id: int
):
    """
    Store the generated feedback in the database.
    """
    try:
        # Add user_id to feedback metadata
        feedback.metadata["generated_by"] = user_id
        
        from app.crud import feedback as feedback_crud
        feedback_crud.create_feedback(db, feedback)
        
    except Exception as e:
        logger.error(f"Error storing generated feedback: {str(e)}")

@router.post("/analyze/{submission_id}", response_model=Dict[str, Any])
async def analyze_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Analyze a submission using AI and provide feedback.
    Only teachers can analyze submissions.
    """
    # Check user role
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can analyze submissions"
        )
    
    submission = crud.submission.get(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    try:
        ai_service = AIService(db)
        tokens_needed = 1000
        await ai_service.enforce_token_limit(current_user.id, tokens_needed)
        analysis = await ai_service.analyze_submission(
            submission_content=submission.content,
            assignment_requirements=submission.assignment.content
        )
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze submission: {str(e)}"
        ) 
