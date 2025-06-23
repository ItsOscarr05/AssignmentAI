from typing import List, Optional, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.crud import assignment as assignment_crud
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentList
)
from app.models.assignment import AssignmentStatus
from app.services.file_service import file_service
from app.models.user import User
from app.models.assignment import Assignment

router = APIRouter()

@router.post("/", response_model=AssignmentResponse)
async def create_assignment(
    title: str,
    description: str,
    subject: str,
    grade_level: str,
    due_date: datetime,
    max_score: int = 100,
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new assignment with optional file attachments.
    """
    # Handle file uploads
    file_urls = []
    if files:
        try:
            file_paths = await file_service.save_files(files, f"assignments/{current_user.id}")
            file_urls = [file_service.get_file_url(path) for path in file_paths]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")
    
    assignment = AssignmentCreate(
        title=title,
        description=description,
        subject=subject,
        grade_level=grade_level,
        due_date=due_date,
        max_score=max_score,
        attachments=file_urls
    )
    
    return assignment_crud.create_assignment(db, assignment, current_user.id)

@router.get("/", response_model=AssignmentList)
def list_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    search: Optional[str] = None,
    status: Optional[AssignmentStatus] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List all assignments with optional filtering and sorting.
    """
    total = assignment_crud.get_assignments_count(
        db, search=search, status=status,
        subject=subject, grade_level=grade_level
    )
    items = assignment_crud.get_assignments(
        db, skip=skip, limit=limit,
        sort_by=sort_by, sort_order=sort_order,
        search=search, status=status,
        subject=subject, grade_level=grade_level
    )
    return {"total": total, "items": items}

@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a specific assignment by ID.
    """
    assignment = assignment_crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    due_date: Optional[datetime] = None,
    max_score: Optional[int] = None,
    status: Optional[AssignmentStatus] = None,
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update an assignment with optional file attachments.
    """
    db_assignment = assignment_crud.get_assignment(db, assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if db_assignment.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Handle file uploads
    file_urls = db_assignment.attachments or []
    if files:
        try:
            file_paths = await file_service.save_files(files, f"assignments/{current_user.id}")
            file_urls.extend([file_service.get_file_url(path) for path in file_paths])
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")
    
    assignment = AssignmentUpdate(
        title=title,
        description=description,
        subject=subject,
        grade_level=grade_level,
        due_date=due_date,
        max_score=max_score,
        status=status,
        attachments=file_urls
    )
    
    return assignment_crud.update_assignment(db, assignment_id, assignment)

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete an assignment.
    """
    db_assignment = assignment_crud.get_assignment(db, assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if db_assignment.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete associated files
    if db_assignment.attachments:
        file_paths = [url.split("/files/")[1] for url in db_assignment.attachments]
        if not file_service.delete_files(file_paths):
            raise HTTPException(status_code=500, detail="Failed to delete assignment files")
    
    if not assignment_crud.delete_assignment(db, assignment_id):
        raise HTTPException(status_code=500, detail="Failed to delete assignment")
    return {"message": "Assignment deleted successfully"} 
