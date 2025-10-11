from fastapi import APIRouter, Depends
from app.api.v1.endpoints import (
    auth,
    users,
    assignments,
    submissions,
    ai,
    admin,
    logs,
    files,
    feedback,
    ai_assignment,
    payments,
    dashboard,
    citations,
    templates,
    assignment_input,
    workshop,
    oauth,
    security,
    activities,
    classes,
    preferences,
    usage,
    diagrams,
    image_analysis,
    contact,
    smart_features,
    file_processing,
    file_uploads,
    assignment_processing,
    file_completion_chat
)
from app.crud import feedback as feedback_crud
from app.schemas.feedback import Feedback
from typing import List
from app.core.deps import get_db
from app.crud import submission as submission_crud
from app.schemas.submission import SubmissionList
from app.crud import ai_assignment as ai_assignment_crud
from app.schemas.ai_assignment import AIAssignment

api_router = APIRouter()

# Include routers with tags for better organization
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(oauth.router, prefix="/auth/oauth", tags=["oauth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
api_router.include_router(logs.router, prefix="/logs", tags=["Logs"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])
api_router.include_router(ai_assignment.router, prefix="/ai-assignments", tags=["AI Assignments"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(citations.router, prefix="/citations", tags=["citations"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(assignment_input.router, prefix="/assignment-input", tags=["Assignment Input"])
api_router.include_router(workshop.router, prefix="/workshop", tags=["workshop"])
api_router.include_router(security.router, prefix="/security", tags=["security"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])

api_router.include_router(preferences.router, prefix="/preferences", tags=["preferences"])
api_router.include_router(usage.router, prefix="/usage", tags=["usage"])
api_router.include_router(diagrams.router, prefix="/diagrams", tags=["diagrams"])
api_router.include_router(image_analysis.router, prefix="/image-analysis", tags=["image-analysis"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(smart_features.router, prefix="/smart-features", tags=["smart-features"])
api_router.include_router(file_processing.router, prefix="/file-processing", tags=["file-processing"])
api_router.include_router(file_uploads.router, prefix="/file-uploads", tags=["file-uploads"])
api_router.include_router(assignment_processing.router, prefix="/assignment-processing", tags=["assignment-processing"])
api_router.include_router(file_completion_chat.router, prefix="/file-completion", tags=["file-completion"])

@api_router.get("/submissions/{submission_id}/feedback", tags=["Feedback"])
def get_feedback_by_submission(submission_id: int, db=Depends(get_db)):
    """Get all feedback for a submission (root-level endpoint)."""
    items = feedback_crud.get_feedback_by_submission(db, submission_id)
    return {"items": items}

@api_router.get("/users/{user_id}/feedback", tags=["Feedback"])
def get_feedback_by_user(user_id: int, db=Depends(get_db)):
    """Get all feedback for a user (root-level endpoint)."""
    items = feedback_crud.get_feedback_by_user(db, user_id)
    result = []
    for fb in items:
        fb_dict = fb.__dict__.copy()
        if hasattr(fb, 'submission') and fb.submission is not None and hasattr(fb.submission, 'user_id'):
            fb_dict['user_id'] = fb.submission.user_id
        result.append(fb_dict)
    return {"items": result}

@api_router.get("/assignments/{assignment_id}/submissions", tags=["Submissions"])
def get_submissions_by_assignment(assignment_id: int, db=Depends(get_db)):
    items = submission_crud.get_by_assignment_sync(db, assignment_id=assignment_id)
    # Map user_id to student_id in each item
    result = []
    for sub in items:
        sub_dict = sub.__dict__.copy()
        sub_dict["student_id"] = sub_dict.pop("user_id", None)
        result.append(sub_dict)
    return {"items": result, "total": len(result)}

@api_router.get("/users/{user_id}/submissions", tags=["Submissions"])
def get_submissions_by_user(user_id: int, db=Depends(get_db)):
    items = submission_crud.get_by_user_sync(db, user_id=user_id)
    result = []
    for sub in items:
        sub_dict = sub.__dict__.copy()
        sub_dict["student_id"] = sub_dict.pop("user_id", None)
        result.append(sub_dict)
    return {"items": result, "total": len(result)}

@api_router.get("/assignments/{assignment_id}/ai-assignments", tags=["AI Assignments"])
def get_ai_assignments_by_assignment(assignment_id: int, skip: int = 0, limit: int = 100, db=Depends(get_db)):
    """Get all AI-generated assignments for a specific assignment."""
    ai_assignments = ai_assignment_crud.get_ai_assignment_by_assignment(db, assignment_id, skip=skip, limit=limit)
    total = ai_assignment_crud.count_ai_assignments_by_assignment(db, assignment_id)
    items = []
    for a in ai_assignments:
        try:
            items.append(AIAssignment.model_validate(a))
        except Exception:
            continue
    return {
        "items": items,
        "total": len(items),
        "skip": skip,
        "limit": limit
    }

@api_router.get("/users/{user_id}/ai-assignments", tags=["AI Assignments"])
def get_ai_assignments_by_user(user_id: int, skip: int = 0, limit: int = 100, db=Depends(get_db)):
    """Get all AI-generated assignments for a specific user."""
    ai_assignments = ai_assignment_crud.get_ai_assignments_by_user(db, user_id, skip=skip, limit=limit)
    total = ai_assignment_crud.count_ai_assignments_by_user(db, user_id)
    items = []
    for a in ai_assignments:
        try:
            items.append(AIAssignment.model_validate(a))
        except Exception:
            continue
    return {
        "items": items,
        "total": len(items),
        "skip": skip,
        "limit": limit
    } 