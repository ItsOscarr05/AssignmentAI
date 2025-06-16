from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentList,
)
from app.schemas.submission import SubmissionCreate
from app.auth import get_current_user
from app.models.user import User
from app.utils.file_upload import upload_file, delete_file

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.post("/", response_model=AssignmentResponse)
async def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new assignment"""
    db_assignment = Assignment(
        **assignment.dict(),
        created_by_id=current_user.id,
        status="draft"
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/", response_model=AssignmentList)
async def list_assignments(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all assignments with pagination and filtering"""
    query = db.query(Assignment)

    if search:
        query = query.filter(
            (Assignment.title.ilike(f"%{search}%")) |
            (Assignment.description.ilike(f"%{search}%")) |
            (Assignment.subject.ilike(f"%{search}%"))
        )

    # Apply sorting
    if sort_by in ["title", "created_at", "due_date"]:
        sort_column = getattr(Assignment, sort_by)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    total = query.count()
    assignments = query.offset(skip).limit(limit).all()

    return {
        "assignments": assignments,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific assignment by ID"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an assignment"""
    db_assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    for key, value in assignment.dict(exclude_unset=True).items():
        setattr(db_assignment, key, value)

    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an assignment"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Delete associated files
    if assignment.attachments:
        for attachment in assignment.attachments:
            delete_file(attachment)

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}

@router.post("/{assignment_id}/submit", response_model=SubmissionCreate)
async def submit_assignment(
    assignment_id: int,
    files: List[UploadFile] = File(...),
    comment: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit an assignment"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if assignment is past due
    if assignment.due_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Assignment is past due")

    # Upload files
    file_urls = []
    for file in files:
        file_url = await upload_file(file)
        file_urls.append(file_url)

    # Create submission
    submission = Submission(
        assignment_id=assignment_id,
        user_id=current_user.id,
        files=file_urls,
        comment=comment,
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/{assignment_id}/submissions")
async def list_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all submissions for an assignment"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submissions = db.query(Submission).filter(Submission.assignment_id == assignment_id).all()
    return submissions

@router.get("/recent", response_model=List[AssignmentResponse])
async def get_recent_assignments(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent assignments for the dashboard"""
    assignments = (
        db.query(Assignment)
        .filter(Assignment.user_id == current_user.id)
        .order_by(Assignment.created_at.desc())
        .limit(limit)
        .all()
    )
    return assignments 