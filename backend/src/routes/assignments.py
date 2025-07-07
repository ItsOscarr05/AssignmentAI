from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from models.assignment import Assignment, AssignmentSubmission, AssignmentAttachment, SubmissionAttachment, AssignmentStatus
from models.user import User
from services.auth import get_current_active_user
from services.file_upload import save_upload_file, delete_file
from services.grading import GradingService
from database import get_db

router = APIRouter()

# Pydantic models for request/response
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: datetime
    max_score: int = 100

class AssignmentCreate(AssignmentBase):
    student_id: Optional[int] = None

class AssignmentUpdate(AssignmentBase):
    status: Optional[AssignmentStatus] = None
    current_score: Optional[int] = None
    feedback: Optional[str] = None

class AssignmentResponse(AssignmentBase):
    id: int
    teacher_id: int
    student_id: Optional[int]
    status: AssignmentStatus
    current_score: Optional[int]
    feedback: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)

class SubmissionBase(BaseModel):
    content: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionUpdate(SubmissionBase):
    score: Optional[int] = None
    feedback: Optional[str] = None

class SubmissionResponse(SubmissionBase):
    id: int
    assignment_id: int
    student_id: int
    submitted_at: datetime
    score: Optional[int]
    feedback: Optional[str]
    model_config = ConfigDict(from_attributes=True)

# Grading routes
class GradeSubmission(BaseModel):
    score: int
    feedback: Optional[str] = None
    rubric_criteria: Optional[Dict[str, Any]] = None

# Assignment routes
@router.post("/", response_model=AssignmentResponse)
async def create_assignment(
    assignment: AssignmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create assignments"
        )
    
    db_assignment = Assignment(
        **assignment.dict(),
        teacher_id=current_user.id
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/", response_model=List[AssignmentResponse])
async def list_assignments(
    status: Optional[AssignmentStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment)
    
    if current_user.role == "student":
        query = query.filter(Assignment.student_id == current_user.id)
    elif current_user.role == "teacher":
        query = query.filter(Assignment.teacher_id == current_user.id)
    
    if status:
        query = query.filter(Assignment.status == status)
    
    return query.all()

@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if current_user.role == "student" and assignment.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this assignment"
        )
    
    return assignment

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment: AssignmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if current_user.role != "teacher" or db_assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this assignment"
        )
    
    for key, value in assignment.dict(exclude_unset=True).items():
        setattr(db_assignment, key, value)
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if current_user.role != "teacher" or db_assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this assignment"
        )
    
    # Delete associated files
    for attachment in db_assignment.attachments:
        await delete_file(attachment.file_path)
    
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}

# File upload routes
@router.post("/{assignment_id}/attachments")
async def upload_assignment_attachment(
    assignment_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if current_user.role != "teacher" or db_assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload attachments to this assignment"
        )
    
    file_name, file_path, file_type, file_size = await save_upload_file(
        file,
        f"assignments/{assignment_id}"
    )
    
    attachment = AssignmentAttachment(
        assignment_id=assignment_id,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return {
        "id": attachment.id,
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size
    }

# Submission routes
@router.post("/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: int,
    submission: SubmissionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments"
        )
    
    db_assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if db_assignment.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to submit this assignment"
        )
    
    # Create submission
    db_submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        content=submission.content
    )
    
    # Update assignment status
    db_assignment.status = AssignmentStatus.SUBMITTED
    
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    return db_submission

@router.post("/{assignment_id}/submissions/{submission_id}/attachments")
async def upload_submission_attachment(
    assignment_id: int,
    submission_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id,
        AssignmentSubmission.assignment_id == assignment_id
    ).first()
    
    if not db_submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if db_submission.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload attachments to this submission"
        )
    
    file_name, file_path, file_type, file_size = await save_upload_file(
        file,
        f"submissions/{submission_id}"
    )
    
    attachment = SubmissionAttachment(
        submission_id=submission_id,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return {
        "id": attachment.id,
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size
    }

@router.post("/{assignment_id}/submissions/{submission_id}/grade", response_model=SubmissionResponse)
async def grade_submission(
    assignment_id: int,
    submission_id: int,
    grade: GradeSubmission,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can grade submissions"
        )
    
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id,
        AssignmentSubmission.assignment_id == assignment_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to grade this submission"
        )
    
    grading_service = GradingService(db)
    try:
        graded_submission = await grading_service.grade_submission(
            submission_id=submission_id,
            score=grade.score,
            feedback=grade.feedback,
            rubric_criteria=grade.rubric_criteria
        )
        return graded_submission
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{assignment_id}/grading-statistics")
async def get_grading_statistics(
    assignment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view grading statistics"
        )
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    if assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view statistics for this assignment"
        )
    
    grading_service = GradingService(db)
    return await grading_service.get_grading_statistics(assignment_id)

@router.post("/{assignment_id}/submissions/{submission_id}/apply-late-penalty")
async def apply_late_penalty(
    assignment_id: int,
    submission_id: int,
    penalty_percentage: float = 10.0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can apply late penalties"
        )
    
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id,
        AssignmentSubmission.assignment_id == assignment_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.assignment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to apply late penalty to this submission"
        )
    
    grading_service = GradingService(db)
    updated_submission = await grading_service.apply_late_penalty(
        submission,
        penalty_percentage
    )
    
    return {
        "message": "Late penalty applied successfully",
        "submission": updated_submission
    }

@router.get("/recent", response_model=List[AssignmentResponse])
async def get_recent_assignments(
    limit: int = 5,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get recent assignments for the current user.
    For students: returns their recent assignments
    For teachers: returns their recently created assignments
    """
    query = db.query(Assignment)
    
    if current_user.role == "student":
        query = query.filter(Assignment.student_id == current_user.id)
    elif current_user.role == "teacher":
        query = query.filter(Assignment.teacher_id == current_user.id)
    
    # Order by creation date, most recent first
    query = query.order_by(Assignment.created_at.desc())
    
    # Limit the number of results
    assignments = query.limit(limit).all()
    
    return assignments 