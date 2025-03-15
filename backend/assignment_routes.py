"""
Assignment routes for AssignmentAI.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from database.models import Assignment
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from security import get_current_user
from schemas import AssignmentCreate, AssignmentUpdate, AssignmentResponse

router = APIRouter()

@router.post("/assignments/", response_model=AssignmentResponse)
async def create_assignment(
    assignment: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new assignment."""
    db_assignment = Assignment(
        user_id=current_user.id,
        title=assignment.title,
        description=assignment.description,
        subject=assignment.subject,
        grade_level=assignment.grade_level,
        due_date=assignment.due_date
    )
    db.add(db_assignment)
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment

@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get an assignment by ID."""
    assignment = await db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this assignment")
    return assignment

@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment_update: AssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an assignment."""
    assignment = await db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this assignment")
    
    for field, value in assignment_update.dict(exclude_unset=True).items():
        setattr(assignment, field, value)
    
    await db.commit()
    await db.refresh(assignment)
    return assignment

@router.delete("/assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an assignment."""
    assignment = await db.get(Assignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this assignment")
    
    await db.delete(assignment)
    await db.commit()
    return {"message": "Assignment deleted"}

@router.get("/assignments/", response_model=List[AssignmentResponse])
async def list_assignments(
    subject: Optional[str] = None,
    grade_level: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List assignments with optional filters."""
    query = db.query(Assignment).filter(Assignment.user_id == current_user.id)
    
    if subject:
        query = query.filter(Assignment.subject == subject)
    if grade_level:
        query = query.filter(Assignment.grade_level == grade_level)
    if status:
        query = query.filter(Assignment.status == status)
    
    assignments = await query.all()
    return assignments 