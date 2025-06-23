from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.deps import get_current_user, get_db
from app.core.config import settings
import os
from app.crud import submission as submission_crud
from app.crud import assignment as assignment_crud
from app.schemas.submission import (
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionResponse,
    SubmissionList
)
from app.models.submission import SubmissionStatus
from datetime import datetime
from app.services.file_service import file_service

router = APIRouter()

@router.get("/submissions", response_model=List[schemas.Submission])
def read_submissions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve submissions.
    """
    submissions = crud.submission.get_by_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return submissions

@router.post("/submissions", response_model=schemas.Submission)
async def create_submission(
    *,
    db: Session = Depends(get_db),
    submission_in: schemas.SubmissionCreate,
    file: UploadFile = File(None),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Create new submission.
    """
    # Handle file upload if provided
    file_path = None
    if file:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [f".{ext}" for ext in settings.ALLOWED_FILE_TYPES]:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_TYPES)}"
            )
        
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Save file
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    
    # Create submission with file path
    submission_data = submission_in.model_dump()
    if file_path:
        submission_data["file_path"] = file_path
    
    submission = crud.submission.create_with_user(
        db=db, obj_in=schemas.SubmissionCreate(**submission_data), user_id=current_user.id
    )
    return submission

@router.get("/submissions/{submission_id}", response_model=schemas.Submission)
def read_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Get submission by ID.
    """
    submission = crud.submission.get(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return submission

@router.put("/submissions/{submission_id}", response_model=schemas.Submission)
async def update_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    submission_in: schemas.SubmissionUpdate,
    file: UploadFile = File(None),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Update submission.
    """
    submission = crud.submission.get(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Handle file upload if provided
    file_path = submission.file_path
    if file:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [f".{ext}" for ext in settings.ALLOWED_FILE_TYPES]:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_TYPES)}"
            )
        
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Delete old file if exists
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        # Save new file
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    
    # Update submission with file path
    submission_data = submission_in.model_dump(exclude_unset=True)
    if file_path:
        submission_data["file_path"] = file_path
    
    submission = crud.submission.update(
        db=db, db_obj=submission, obj_in=submission_data
    )
    return submission

@router.delete("/submissions/{submission_id}", response_model=schemas.Submission)
def delete_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Delete submission.
    """
    submission = crud.submission.get(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete file if exists
    if submission.file_path and os.path.exists(submission.file_path):
        os.remove(submission.file_path)
    
    submission = crud.submission.remove(db=db, id=submission_id)
    return submission

@router.put("/submissions/{submission_id}/status", response_model=schemas.Submission)
def update_submission_status(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    status: str,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Update submission status.
    """
    submission = crud.submission.get(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    submission = crud.submission.update_status(
        db=db, submission_id=submission_id, status=status
    )
    return submission

@router.post("/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: int,
    files: List[UploadFile] = File(None),
    comments: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Submit an assignment with optional files and comments.
    """
    # Check if assignment exists and is not past due
    assignment = assignment_crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.due_date < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Assignment is past due")
    
    # Handle file uploads
    file_urls = []
    if files:
        try:
            file_paths = await file_service.save_files(files, f"assignments/{assignment_id}/submissions/{current_user.id}")
            file_urls = [file_service.get_file_url(path) for path in file_paths]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")
    
    submission = SubmissionCreate(
        attachments=file_urls,
        comments=comments
    )
    
    return submission_crud.create_submission(
        db, submission, assignment_id, current_user.id
    )

@router.get("/{assignment_id}/submissions", response_model=SubmissionList)
def list_submissions(
    assignment_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sort_by: str = Query("submitted_at"),
    sort_order: str = Query("desc"),
    status: Optional[SubmissionStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List all submissions for an assignment.
    """
    # Check if assignment exists and user has permission
    assignment = assignment_crud.get_assignment(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    total = submission_crud.get_submissions_count(
        db, assignment_id, status=status
    )
    items = submission_crud.get_submissions(
        db, assignment_id, skip=skip, limit=limit,
        sort_by=sort_by, sort_order=sort_order,
        status=status
    )
    return {"total": total, "items": items}

@router.get("/student/submissions", response_model=SubmissionList)
def list_student_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    sort_by: str = Query("submitted_at"),
    sort_order: str = Query("desc"),
    status: Optional[SubmissionStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    List all submissions for the current student.
    """
    total = submission_crud.get_student_submissions_count(
        db, current_user.id, status=status
    )
    items = submission_crud.get_student_submissions(
        db, current_user.id, skip=skip, limit=limit,
        sort_by=sort_by, sort_order=sort_order,
        status=status
    )
    return {"total": total, "items": items}

@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a specific submission by ID.
    """
    submission = submission_crud.get_submission(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return submission

@router.put("/submissions/{submission_id}", response_model=SubmissionResponse)
def update_submission(
    submission_id: int,
    submission: SubmissionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update a submission (e.g., grade and feedback).
    """
    db_submission = submission_crud.get_submission(db, submission_id)
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check if user has permission to grade this submission
    assignment = assignment_crud.get_assignment(db, db_submission.assignment_id)
    if not assignment or assignment.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return submission_crud.update_submission(db, submission_id, submission)

@router.delete("/submissions/{submission_id}")
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete a submission.
    """
    db_submission = submission_crud.get_submission(db, submission_id)
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if db_submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete associated files
    if db_submission.attachments:
        file_paths = [url.split("/files/")[1] for url in db_submission.attachments]
        if not file_service.delete_files(file_paths):
            raise HTTPException(status_code=500, detail="Failed to delete submission files")
    
    if not submission_crud.delete_submission(db, submission_id):
        raise HTTPException(status_code=500, detail="Failed to delete submission")
    return {"message": "Submission deleted successfully"} 
