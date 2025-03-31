from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import ai_assignment as ai_assignment_crud
from app.schemas.ai_assignment import AIAssignment, AIAssignmentCreate, AIAssignmentUpdate

router = APIRouter()

@router.get("/{ai_assignment_id}", response_model=AIAssignment)
def get_ai_assignment(
    ai_assignment_id: int,
    db: Session = Depends(deps.get_db),
):
    """Get AI-generated assignment by ID."""
    ai_assignment = ai_assignment_crud.get_ai_assignment(db, ai_assignment_id)
    if not ai_assignment:
        raise HTTPException(status_code=404, detail="AI-generated assignment not found")
    return ai_assignment

@router.get("/assignment/{assignment_id}", response_model=List[AIAssignment])
def get_ai_assignment_by_assignment(
    assignment_id: int,
    db: Session = Depends(deps.get_db),
):
    """Get all AI-generated assignments for a specific assignment."""
    return ai_assignment_crud.get_ai_assignment_by_assignment(db, assignment_id)

@router.post("/", response_model=AIAssignment)
def create_ai_assignment(
    ai_assignment: AIAssignmentCreate,
    db: Session = Depends(deps.get_db),
):
    """Create new AI-generated assignment."""
    return ai_assignment_crud.create_ai_assignment(db, ai_assignment)

@router.put("/{ai_assignment_id}", response_model=AIAssignment)
def update_ai_assignment(
    ai_assignment_id: int,
    ai_assignment: AIAssignmentUpdate,
    db: Session = Depends(deps.get_db),
):
    """Update AI-generated assignment."""
    updated_ai_assignment = ai_assignment_crud.update_ai_assignment(db, ai_assignment_id, ai_assignment)
    if not updated_ai_assignment:
        raise HTTPException(status_code=404, detail="AI-generated assignment not found")
    return updated_ai_assignment

@router.delete("/{ai_assignment_id}")
def delete_ai_assignment(
    ai_assignment_id: int,
    db: Session = Depends(deps.get_db),
):
    """Delete AI-generated assignment."""
    success = ai_assignment_crud.delete_ai_assignment(db, ai_assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="AI-generated assignment not found")
    return {"message": "AI-generated assignment deleted successfully"} 