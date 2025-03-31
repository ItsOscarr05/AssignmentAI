from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.services.assignment import assignment_service

router = APIRouter()

@router.get("/assignments", response_model=List[schemas.Assignment])
def read_assignments(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
    search: Optional[str] = None,
    subject: Optional[str] = None,
) -> Any:
    """
    Retrieve assignments.
    """
    assignments = crud.assignment.get_by_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    
    # Apply filters
    if search:
        assignments = [
            a for a in assignments
            if search.lower() in a.title.lower() or
               search.lower() in a.subject.lower() or
               search.lower() in a.topic.lower()
        ]
    
    if subject:
        assignments = [a for a in assignments if a.subject.lower() == subject.lower()]
    
    return assignments

@router.post("/assignments", response_model=schemas.Assignment)
def create_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_in: schemas.AssignmentCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new assignment.
    """
    assignment = crud.assignment.create_with_user(
        db=db, obj_in=assignment_in, user_id=current_user.id
    )
    return assignment

@router.get("/assignments/{assignment_id}", response_model=schemas.Assignment)
def read_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get assignment by ID.
    """
    assignment = crud.assignment.get(db=db, id=assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return assignment

@router.put("/assignments/{assignment_id}", response_model=schemas.Assignment)
def update_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_id: int,
    assignment_in: schemas.AssignmentUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update assignment.
    """
    assignment = crud.assignment.get(db=db, id=assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    assignment = crud.assignment.update(
        db=db, db_obj=assignment, obj_in=assignment_in
    )
    return assignment

@router.delete("/assignments/{assignment_id}", response_model=schemas.Assignment)
def delete_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete assignment.
    """
    assignment = crud.assignment.get(db=db, id=assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    assignment = crud.assignment.remove(db=db, id=assignment_id)
    return assignment

@router.post("/assignments/{assignment_id}/duplicate", response_model=schemas.Assignment)
def duplicate_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_id: int,
    title: str,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Duplicate assignment.
    """
    assignment = crud.assignment.duplicate(
        db=db, assignment_id=assignment_id, user_id=current_user.id, title=title
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment 