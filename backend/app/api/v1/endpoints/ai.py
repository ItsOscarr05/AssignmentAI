import json
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.core.config import settings
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
        
        # Estimate tokens needed based on assignment complexity
        tokens_needed = 1000  # Base estimate
        if assignment_request.difficulty == "hard":
            tokens_needed = 1500
        elif assignment_request.difficulty == "easy":
            tokens_needed = 800
        
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
        
        # Estimate tokens needed based on submission length
        tokens_needed = 500  # Base estimate
        if len(submission.content) > 2000:
            tokens_needed = 800
        elif len(submission.content) < 500:
            tokens_needed = 300
        
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
        from app.crud import user as user_crud
        from app.crud import ai_assignment as ai_assignment_crud
        from app.crud.assignment import create_assignment_sync
        from app.models.subscription import Subscription, SubscriptionStatus
        from app.schemas.assignment import AssignmentCreate

        PLAN_DEFAULT_MODELS = {
            "free": "gpt-5-nano",
            "plus": "gpt-4.1-mini",
            "pro": "gpt-4-turbo",
            "max": "gpt-5",
        }
        ALLOWED_MODELS = {
            "gpt-4",
            "gpt-4-turbo",
            "gpt-4.1-mini",
            "gpt-5-nano",
            "gpt-5",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-16k",
            "claude-3",
            "claude-2",
        }

        requirements: Dict[str, Any] = request.requirements or {}

        def _coerce_int(value: Any) -> Optional[int]:
            if value is None:
                return None
            if isinstance(value, int):
                return value
            if isinstance(value, str) and value.strip().isdigit():
                return int(value.strip())
            return None

        def _extract_requirement(*keys: str) -> Any:
            for key in keys:
                if key in requirements:
                    return requirements[key]
                # Support camelCase to snake_case fallback
                snake_key = re.sub(r'(?<!^)(?=[A-Z])', '_', key).lower()
                if snake_key in requirements:
                    return requirements[snake_key]
            return None

        def _parse_estimated_duration(duration: Optional[str]) -> int:
            if not duration:
                return 60
            match = re.match(r'^\s*(\d+)\s*(hour|hours|minute|minutes)\s*$', duration, re.IGNORECASE)
            if not match:
                return 60
            value = int(match.group(1))
            unit = match.group(2).lower()
            minutes = value * 60 if "hour" in unit else value
            return max(15, min(minutes, 8 * 60))

        def _ensure_class_id() -> int:
            class_id_from_requirements = _coerce_int(_extract_requirement("class_id", "classId"))
            if class_id_from_requirements:
                class_instance = db.query(models.Class).filter(models.Class.id == class_id_from_requirements).first()
                if class_instance:
                    return class_instance.id

            existing_class = (
                db.query(models.Class)
                .filter(models.Class.teacher_id == user_id)
                .order_by(models.Class.id.asc())
                .first()
            )
            if existing_class:
                return existing_class.id

            unique_code = f"AI{user_id}{int(datetime.utcnow().timestamp())}"
            new_class = models.Class(
                name=f"AI Generated Class {user_id}",
                code=unique_code,
                description="Auto-generated class for AI-generated assignments",
                teacher_id=user_id
            )
            db.add(new_class)
            db.commit()
            db.refresh(new_class)
            return new_class.id

        def _parse_due_date(value: Any) -> datetime:
            if isinstance(value, datetime):
                return value
            if isinstance(value, str):
                try:
                    return datetime.fromisoformat(value)
                except ValueError:
                    try:
                        days = int(value)
                        return datetime.utcnow() + timedelta(days=days)
                    except (ValueError, TypeError):
                        pass
            if isinstance(value, (int, float)):
                return datetime.utcnow() + timedelta(days=int(value))
            return datetime.utcnow() + timedelta(days=7)

        def _sanitize_attachments(raw_value: Any) -> Optional[List[str]]:
            if raw_value is None:
                return None
            if isinstance(raw_value, list):
                return [str(item) for item in raw_value]
            return [str(raw_value)]

        def _calculate_confidence_score(generated: GeneratedAssignment) -> float:
            score = 0.0
            if generated.title:
                score += 0.2
            if generated.description:
                score += 0.2
            content = generated.content
            if content.objectives:
                score += 0.15
            if content.instructions:
                score += 0.15
            if content.requirements:
                score += 0.15
            if content.evaluation_criteria:
                score += 0.1
            if content.resources:
                score += 0.05
            return round(min(score, 1.0), 2)

        def _create_assignment_from_generated() -> Optional[int]:
            try:
                class_id = _ensure_class_id()
                due_date_value = _extract_requirement("due_date", "dueDate")
                estimated_duration = assignment.content.estimated_duration if assignment.content else None
                estimated_time = _parse_estimated_duration(estimated_duration)
                attachments = _sanitize_attachments(_extract_requirement("attachments"))
                max_score_value = _coerce_int(_extract_requirement("max_score", "maxScore")) or 100
                assignment_type_value = _extract_requirement("assignment_type", "assignmentType") or "ai_generated"

                content_payload = assignment.model_dump()
                content_payload["request_context"] = request.model_dump()

                assignment_create = AssignmentCreate(
                    title=assignment.title,
                    description=assignment.description,
                    subject=request.subject,
                    grade_level=request.grade_level,
                    due_date=_parse_due_date(due_date_value),
                    max_score=max_score_value,
                    attachments=attachments,
                    assignment_type=str(assignment_type_value),
                    topic=request.topic,
                    difficulty=request.difficulty,
                    estimated_time=estimated_time,
                    content=json.dumps(content_payload, ensure_ascii=False),
                    class_id=class_id
                )

                created_assignment = create_assignment_sync(
                    db=db,
                    assignment=assignment_create,
                    user_id=user_id
                )
                return created_assignment.id
            except Exception as creation_error:
                logger.error(f"Failed to create assignment from generated content: {creation_error}")
                return None

        # Create the AI assignment record with required parameters
        assignment_id = _coerce_int(_extract_requirement("assignment_id", "assignmentId"))
        assignment_id_source = "requirements" if assignment_id else None

        if not assignment_id:
            assignment_id = _create_assignment_from_generated()
            assignment_id_source = "auto_created" if assignment_id else None

        if not assignment_id:
            fallback_assignment = (
                db.query(models.Assignment)
                .filter(models.Assignment.user_id == user_id)
                .order_by(models.Assignment.id.desc())
                .first()
            )
            if fallback_assignment:
                assignment_id = fallback_assignment.id
                assignment_id_source = "fallback_latest"

        if not assignment_id:
            logger.error("Could not determine assignment_id for AI assignment persistence; skipping storage.")
            return

        subscription = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
            .order_by(Subscription.updated_at.desc())
            .first()
        )

        plan_name = (subscription.plan_name.lower() if subscription else "free")
        ai_settings = {}
        try:
            ai_settings = user_crud.get_ai_settings(db, str(user_id))
        except Exception as settings_error:
            logger.warning(f"Failed to load AI settings for user {user_id}: {settings_error}")

        preferred_model = None
        if subscription and subscription.ai_model:
            preferred_model = subscription.ai_model
        if not preferred_model:
            user_record = db.query(models.User).filter(models.User.id == user_id).first()
            if user_record and isinstance(user_record.preferences, dict):
                ai_pref = user_record.preferences.get("ai_settings", {})
                pref_model = ai_pref.get("model") if isinstance(ai_pref, dict) else None
                if pref_model:
                    preferred_model = str(pref_model)

        preferred_model = preferred_model or PLAN_DEFAULT_MODELS.get(plan_name, "gpt-4")
        if preferred_model not in ALLOWED_MODELS:
            preferred_model = PLAN_DEFAULT_MODELS.get(plan_name, "gpt-4")

        plan_token_limit = settings.AI_RESPONSE_LIMITS.get(plan_name, settings.AI_MAX_TOKENS)
        max_tokens_setting = ai_settings.get("tokenContextLimit")
        try:
            max_tokens_value = int(max_tokens_setting) if max_tokens_setting is not None else plan_token_limit
        except (TypeError, ValueError):
            max_tokens_value = plan_token_limit
        max_tokens_value = max(1, min(max_tokens_value, 4000))

        temperature_setting = ai_settings.get("temperature")
        try:
            temperature_value = float(temperature_setting) if temperature_setting is not None else settings.AI_TEMPERATURE
        except (TypeError, ValueError):
            temperature_value = settings.AI_TEMPERATURE
        temperature_value = max(0.0, min(temperature_value, 2.0))

        confidence_score = _calculate_confidence_score(assignment)

        generation_metadata: Dict[str, Any] = {
            "subject": request.subject,
            "grade_level": request.grade_level,
            "topic": request.topic,
            "difficulty": request.difficulty,
            "generated_by": user_id,
            "plan": plan_name,
            "assignment_id_source": assignment_id_source,
            "requirements": requirements,
            "max_tokens_allowed": max_tokens_value,
            "temperature_used": temperature_value,
        }
        if subscription:
            generation_metadata["subscription_id"] = subscription.id

        ai_assignment = AIAssignmentCreate(
            assignment_id=assignment_id,
            prompt=request.model_dump_json(),
            model=preferred_model,
            max_tokens=max_tokens_value,
            temperature=temperature_value,
            user_id=user_id,
            generated_content=assignment.model_dump_json(),
            model_version=settings.AI_MODEL_VERSION,
            confidence_score=confidence_score,
            generation_metadata=generation_metadata
        )
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
        
        # Estimate tokens needed based on submission length and analysis complexity
        tokens_needed = 1000  # Base estimate
        if len(submission.content) > 3000:
            tokens_needed = 1500
        elif len(submission.content) < 1000:
            tokens_needed = 700
        
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
