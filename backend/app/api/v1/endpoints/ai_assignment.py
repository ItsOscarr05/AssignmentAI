from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.crud import ai_assignment as ai_assignment_crud
from app.schemas.ai_assignment import AIAssignment, AIAssignmentCreate, AIAssignmentUpdate, AIAssignmentCreateRequest
from pydantic import ValidationError

router = APIRouter()

@router.get("/", response_model=dict)
def get_ai_assignments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get all AI-generated assignments with pagination."""
    ai_assignments = ai_assignment_crud.get_ai_assignments(db, skip=skip, limit=limit)
    total = ai_assignment_crud.count_ai_assignments(db)
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

@router.get("/{ai_assignment_id}", response_model=AIAssignment)
def get_ai_assignment(
    ai_assignment_id: int,
    db: Session = Depends(get_db),
):
    """Get AI-generated assignment by ID."""
    ai_assignment = ai_assignment_crud.get_ai_assignment(db, ai_assignment_id)
    if not ai_assignment:
        raise HTTPException(status_code=404, detail="AI-generated assignment not found")
    return ai_assignment

@router.get("/assignment/{assignment_id}", response_model=dict)
def get_ai_assignment_by_assignment(
    assignment_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get all AI-generated assignments for a specific assignment."""
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

@router.get("/user/{user_id}", response_model=dict)
def get_ai_assignments_by_user(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get all AI-generated assignments for a specific user."""
    ai_assignments = ai_assignment_crud.get_ai_assignments_by_user(db, user_id, skip=skip, limit=limit)
    total = ai_assignment_crud.count_ai_assignments_by_user(db, user_id)
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

@router.post("/", response_model=AIAssignment, status_code=status.HTTP_201_CREATED)
def create_ai_assignment(
    ai_assignment: AIAssignmentCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create new AI-generated assignment."""
    # Use the validated ai_assignment object and add user_id
    ai_assignment_data = ai_assignment.model_dump()
    ai_assignment_data["user_id"] = current_user.id
    validated = AIAssignmentCreate(**ai_assignment_data)
    return ai_assignment_crud.create_ai_assignment(db, validated)

@router.put("/{ai_assignment_id}", response_model=AIAssignment)
def update_ai_assignment(
    ai_assignment_id: int,
    ai_assignment: AIAssignmentUpdate,
    db: Session = Depends(get_db),
):
    """Update AI-generated assignment."""
    updated_ai_assignment = ai_assignment_crud.update_ai_assignment(db, ai_assignment_id, ai_assignment)
    if not updated_ai_assignment:
        raise HTTPException(status_code=404, detail="AI-generated assignment not found")
    return updated_ai_assignment

@router.delete("/{ai_assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_assignment(
    ai_assignment_id: int,
    db: Session = Depends(get_db),
):
    """Delete AI-generated assignment."""
    success = ai_assignment_crud.delete_ai_assignment(db, ai_assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="AI-generated assignment not found") 
