from typing import List, Optional, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.crud import assignment as assignment_crud
from app.crud import ai_assignment as ai_assignment_crud
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
from pydantic import ValidationError
from app.schemas.ai_assignment import AIAssignment

router = APIRouter()

@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new assignment.
    """
    created_assignment = assignment_crud.create_assignment_sync(db, assignment, current_user.id)
    return AssignmentResponse.model_validate(created_assignment)

@router.get("/", response_model=dict)
def list_assignments(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
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
    # Validate pagination parameters
    if page < 1:
        raise HTTPException(status_code=422, detail="Page must be greater than 0")
    if size < 1 or size > 100:
        raise HTTPException(status_code=422, detail="Size must be between 1 and 100")
    
    skip = (page - 1) * size
    total = assignment_crud.get_assignments_count_sync(
        db, search=search, status=status,
        subject=subject, grade_level=grade_level
    )
    assignments = assignment_crud.get_assignments_sync(
        db, skip=skip, limit=size,
        sort_by=sort_by, sort_order=sort_order,
        search=search, status=status,
        subject=subject, grade_level=grade_level
    )
    
    # Convert SQLAlchemy models to Pydantic models
    items = []
    for assignment in assignments:
        assignment_dict = AssignmentResponse.model_validate(assignment).model_dump()
        items.append(assignment_dict)
    
    return {
        "total": total, 
        "items": items,
        "page": page,
        "size": size
    }

@router.get("/test", response_model=dict)
def list_assignments_test(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    search: Optional[str] = None,
    status: Optional[AssignmentStatus] = None,
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List assignments for test user without authentication.
    """
    try:
        # Get or create a test user for testing purposes
        from app.models.user import User
        
        # Get existing test user - DO NOT CREATE NEW ONES
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            raise HTTPException(
                status_code=404, 
                detail="Test user not found. Test users are no longer automatically created."
            )
        
        # Validate pagination parameters
        if page < 1:
            raise HTTPException(status_code=422, detail="Page must be greater than 0")
        if size < 1 or size > 100:
            raise HTTPException(status_code=422, detail="Size must be between 1 and 100")
        
        skip = (page - 1) * size
        total = assignment_crud.get_assignments_count_sync(
            db, search=search, status=status,
            subject=subject, grade_level=grade_level
        )
        assignments = assignment_crud.get_assignments_sync(
            db, skip=skip, limit=size,
            sort_by=sort_by, sort_order=sort_order,
            search=search, status=status,
            subject=subject, grade_level=grade_level
        )
        
        # Convert SQLAlchemy models to Pydantic models
        items = []
        for assignment in assignments:
            assignment_dict = AssignmentResponse.model_validate(assignment).model_dump()
            items.append(assignment_dict)
        
        return {
            "total": total, 
            "items": items,
            "page": page,
            "size": size
        }
    except Exception as e:
        print(f"Error in test assignments endpoint: {e}")
        # Return a default test assignments response
        return {
            "total": 0,
            "items": [],
            "page": page,
            "size": size
        }

@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a specific assignment by ID.
    """
    assignment = assignment_crud.get_assignment_sync(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment_dict = AssignmentResponse.model_validate(assignment).model_dump()
    return assignment_dict

@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update an assignment.
    """
    db_assignment = assignment_crud.get_assignment_sync(db, assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if db_assignment.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_assignment = assignment_crud.update_assignment_sync(db, assignment_id, assignment)
    return AssignmentResponse.model_validate(updated_assignment)

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete an assignment.
    """
    db_assignment = assignment_crud.get_assignment_sync(db, assignment_id)
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if db_assignment.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete associated files
    if db_assignment.attachments:
        file_paths = [url.split("/files/")[1] for url in db_assignment.attachments]
        if not file_service.delete_files(file_paths):
            raise HTTPException(status_code=500, detail="Failed to delete assignment files")
    
    if not assignment_crud.delete_assignment_sync(db, assignment_id):
        raise HTTPException(status_code=500, detail="Failed to delete assignment")

@router.get("/{assignment_id}/ai-assignments", response_model=dict)
def get_ai_assignments_by_assignment(
    assignment_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    ai_assignments = ai_assignment_crud.get_ai_assignment_by_assignment(db, assignment_id, skip=skip, limit=limit)
    total = ai_assignment_crud.count_ai_assignments_by_assignment(db, assignment_id)
    items = []
    for a in ai_assignments:
        try:
            items.append(AIAssignment.model_validate(a))
        except ValidationError:
            continue
    return {
        "items": items,
        "total": len(items),
        "skip": skip,
        "limit": limit
    } 
