from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.core.rate_limit import check_rate_limit, get_rate_limiter
from app.services.ai import AIService as AIAIService
from pydantic import BaseModel

router = APIRouter()

class FeedbackRequest(BaseModel):
    submission_content: str
    feedback_type: str
    submission_id: int

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
        # Use the AI service from app.services.ai for content generation
        content = await AIAIService.generate_assignment_content(assignment_in)
        
        # Create assignment with generated content using sync method
        assignment_data = assignment_in.model_dump()
        assignment_data["content"] = content
        
        from app.crud.assignment import create_assignment_sync
        assignment = create_assignment_sync(
            db=db, assignment=schemas.AssignmentCreate(**assignment_data), user_id=current_user.id
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
    """
    # Check rate limit
    client_id = request.client.host if request.client else "unknown"
    try:
        check_rate_limit(client_id)
    except HTTPException as e:
        if e.status_code == 429:
            raise e
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Create a mock async session for AIService (temporary fix)
        class MockAsyncSession:
            def __init__(self, sync_session):
                self.sync_session = sync_session
            async def execute(self, *args, **kwargs):
                class Subscription:
                    ai_model = 'gpt-4'
                class Result:
                    def scalar_one_or_none(self):
                        return Subscription()
                return Result()
            async def commit(self):
                pass
            async def refresh(self, obj):
                pass
            async def add(self, obj):
                pass
        
        mock_async_db = MockAsyncSession(db)
        ai_service = AIService(mock_async_db)  # type: ignore
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
    feedback_request: FeedbackRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Generate feedback for a submission using AI.
    """
    # Check rate limit
    client_id = request.client.host if request.client else "unknown"
    try:
        check_rate_limit(client_id)
    except HTTPException as e:
        if e.status_code == 429:
            raise e
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        # Create a mock async session for AIService (temporary fix)
        class MockAsyncSession:
            def __init__(self, sync_session):
                self.sync_session = sync_session
            async def execute(self, *args, **kwargs):
                # Mock implementation
                pass
            async def commit(self):
                pass
            async def refresh(self, obj):
                pass
            async def add(self, obj):
                pass
        
        mock_async_db = MockAsyncSession(db)
        ai_service = AIService(mock_async_db)  # type: ignore
        tokens_needed = 500
        await ai_service.enforce_token_limit(current_user.id, tokens_needed)
        feedback = await ai_service.generate_feedback(
            user_id=current_user.id,
            submission_content=feedback_request.submission_content,
            feedback_type=feedback_request.feedback_type,
            submission_id=feedback_request.submission_id
        )
        
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
        # Create the AI assignment record with required parameters
        ai_assignment = AIAssignmentCreate(
            assignment_id=1,  # TODO: Get actual assignment_id
            prompt=request.model_dump_json(),
            model="gpt-4",  # TODO: Get from settings
            max_tokens=1000,  # TODO: Get from settings
            temperature=0.7,  # TODO: Get from settings
            user_id=user_id,
            generated_content=assignment.model_dump_json(),
            model_version="1.0",  # TODO: Get from settings
            confidence_score=0.8,  # TODO: Get from AI model
            generation_metadata={
                "subject": request.subject,
                "grade_level": request.grade_level,
                "topic": request.topic,
                "difficulty": request.difficulty,
                "generated_by": user_id
            }
        )
        
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
        feedback.feedback_metadata["generated_by"] = user_id
        
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
    """
    from app.crud.submission import get_sync
    submission = get_sync(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if not submission.content:
        raise HTTPException(status_code=400, detail="Submission has no content to analyze")
    
    try:
        # Create a mock async session for AIService (temporary fix)
        class MockAsyncSession:
            def __init__(self, sync_session):
                self.sync_session = sync_session
            async def execute(self, *args, **kwargs):
                # Mock implementation
                pass
            async def commit(self):
                pass
            async def refresh(self, obj):
                pass
            async def add(self, obj):
                pass
        
        mock_async_db = MockAsyncSession(db)
        ai_service = AIService(mock_async_db)  # type: ignore
        tokens_needed = 1000
        await ai_service.enforce_token_limit(current_user.id, tokens_needed)
        analysis = await ai_service.analyze_submission(
            submission_content=submission.content,
            assignment_requirements=submission.assignment.content,
            user_id=current_user.id
        )
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze submission: {str(e)}"
        ) 
