from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.api import deps
from app.services.canvas_service import canvas_service
from app.models.user import User
from app.core.config import settings
from typing import List, Optional

router = APIRouter()

@router.get("/auth")
async def canvas_auth():
    """Initiate Canvas OAuth2 flow"""
    auth_url = f"{settings.CANVAS_API_URL}/login/oauth2/auth"
    params = {
        "client_id": settings.CANVAS_CLIENT_ID,
        "redirect_uri": settings.CANVAS_REDIRECT_URI,
        "response_type": "code",
        "scope": "url:GET|/api/v1/courses url:GET|/api/v1/courses/:course_id/assignments url:POST|/api/v1/courses/:course_id/assignments/:assignment_id/submissions"
    }
    return {"auth_url": f"{auth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"}

@router.get("/callback")
async def canvas_callback(
    code: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Handle Canvas OAuth2 callback"""
    try:
        token_data = await canvas_service.get_access_token(code)
        # Store the access token securely (you should encrypt this)
        current_user.canvas_access_token = token_data["access_token"]
        current_user.canvas_refresh_token = token_data["refresh_token"]
        db.commit()
        return {"message": "Successfully connected to Canvas"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/courses")
async def get_canvas_courses(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all Canvas courses for the current user"""
    if not current_user.canvas_access_token:
        raise HTTPException(status_code=400, detail="Canvas not connected")
    
    try:
        courses = await canvas_service.get_user_courses(current_user.canvas_access_token)
        return courses
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/courses/{course_id}/assignments")
async def get_canvas_assignments(
    course_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all assignments for a specific Canvas course"""
    if not current_user.canvas_access_token:
        raise HTTPException(status_code=400, detail="Canvas not connected")
    
    try:
        assignments = await canvas_service.get_course_assignments(
            current_user.canvas_access_token,
            course_id
        )
        return assignments
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/courses/{course_id}/assignments/{assignment_id}/submit")
async def submit_to_canvas(
    course_id: str,
    assignment_id: str,
    files: List[dict],
    comment: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Submit an assignment to Canvas"""
    if not current_user.canvas_access_token:
        raise HTTPException(status_code=400, detail="Canvas not connected")
    
    try:
        submission = await canvas_service.submit_assignment(
            current_user.canvas_access_token,
            course_id,
            assignment_id,
            current_user.id,
            files,
            comment
        )
        return submission
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 