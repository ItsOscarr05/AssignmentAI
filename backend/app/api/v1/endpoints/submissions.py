from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.config import settings
import os

router = APIRouter()

@router.get("/submissions", response_model=List[schemas.Submission])
def read_submissions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
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
    db: Session = Depends(deps.get_db),
    submission_in: schemas.SubmissionCreate,
    file: UploadFile = File(None),
    current_user: models.User = Depends(deps.get_current_active_user),
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
    db: Session = Depends(deps.get_db),
    submission_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
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
    db: Session = Depends(deps.get_db),
    submission_id: int,
    submission_in: schemas.SubmissionUpdate,
    file: UploadFile = File(None),
    current_user: models.User = Depends(deps.get_current_active_user),
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
    db: Session = Depends(deps.get_db),
    submission_id: int,
    current_user: models.User = Depends(deps.get_current_active_user),
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
    db: Session = Depends(deps.get_db),
    submission_id: int,
    status: str,
    current_user: models.User = Depends(deps.get_current_active_user),
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