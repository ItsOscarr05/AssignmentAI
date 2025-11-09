from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Request
from sqlalchemy.orm import Session
import logging
from pydantic import ValidationError
import json

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

@router.get("", response_model=schemas.SubmissionList)
def read_submissions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve submissions.
    """
    submissions = submission_crud.get_by_user_sync(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    total = len(submissions)
    result = []
    for sub in submissions:
        sub_dict = sub.__dict__.copy()
        sub_dict["student_id"] = sub_dict.pop("user_id", None)
        result.append(sub_dict)
    return {"items": result, "total": total}

@router.get("/", response_model=schemas.SubmissionList)
def read_submissions_slash(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    return read_submissions(db, skip, limit, current_user)

@router.post("", response_model=schemas.SubmissionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    *,
    db: Session = Depends(get_db),
    request: Request,
    file: UploadFile = File(None),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Create new submission.
    """
    # Parse request body manually
    body = await request.json()
    
    # Convert attachments list to JSON string if present
    if body.get('attachments') and isinstance(body['attachments'], list):
        body['attachments'] = json.dumps(body['attachments'])
    
    try:
        submission = schemas.SubmissionCreate(**body)
    except ValidationError as exc:
        logging.error(f"Submission payload validation error: {exc.errors()}")
        raise HTTPException(status_code=422, detail=exc.errors())
    
    # Check if assignment exists and get its due date
    assignment = db.query(models.Assignment).filter(models.Assignment.id == submission.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if deadline has passed
    if assignment.due_date and datetime.utcnow() > assignment.due_date:
        raise HTTPException(
            status_code=400,
            detail="Assignment deadline has passed"
        )
    
    # Handle file upload if provided
    file_path = None
    if file:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Save file
        file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    
    # Create submission with file path
    submission_data = submission.model_dump()
    if not submission_data.get("title"):
        submission_data["title"] = "Submission"
    if file_path:
        submission_data["file_path"] = file_path
    
    try:
        submission_obj = submission_crud.create_with_user_sync(
            db=db, obj_in=schemas.SubmissionCreate(**submission_data), user_id=current_user.id
        )
        resp = submission_obj.__dict__.copy()
        resp["student_id"] = resp.pop("user_id", None)
        # Parse attachments JSON string back to list for response
        if resp.get("attachments") and isinstance(resp["attachments"], str):
            try:
                resp["attachments"] = json.loads(resp["attachments"])
            except (json.JSONDecodeError, TypeError):
                resp["attachments"] = []
        return schemas.SubmissionResponse(**resp)
    except ValidationError as e:
        logging.error(f"Validation error in create_submission: {e.errors()}")
        raise

@router.get("/{submission_id}", response_model=schemas.Submission)
def read_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Get submission by ID.
    """
    submission = submission_crud.get_sync(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return submission

@router.put("{submission_id}", response_model=schemas.SubmissionResponse)
@router.put("/{submission_id}", response_model=schemas.SubmissionResponse)
async def update_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    request: Request,
    file: UploadFile = File(None),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Update submission.
    """
    # Parse request body manually
    body = await request.json()
    
    # Convert attachments list to JSON string if present
    if body.get('attachments') and isinstance(body['attachments'], list):
        body['attachments'] = json.dumps(body['attachments'])
    
    submission = schemas.SubmissionUpdate(**body)
    
    submission_obj = submission_crud.get_sync(db=db, id=submission_id)
    if not submission_obj:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Handle file upload if provided
    file_path = submission_obj.file_path
    if file:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
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
    submission_data = submission.model_dump(exclude_unset=True)
    if not submission_data.get("title"):
        submission_data["title"] = "Submission"
    if file_path:
        submission_data["file_path"] = file_path
    
    try:
        updated_submission = submission_crud.update_sync(
            db=db, db_obj=submission_obj, obj_in=submission_data
        )
        resp = updated_submission.__dict__.copy()
        resp["student_id"] = resp.pop("user_id", None)
        # Parse attachments JSON string back to list for response
        if resp.get("attachments") and isinstance(resp["attachments"], str):
            try:
                resp["attachments"] = json.loads(resp["attachments"])
            except (json.JSONDecodeError, TypeError):
                resp["attachments"] = []
        return schemas.SubmissionResponse(**resp)
    except ValidationError as e:
        logging.error(f"Validation error in update_submission: {e.errors()}")
        raise

@router.delete("/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_submission(
    *,
    db: Session = Depends(get_db),
    submission_id: int,
    current_user: models.User = Depends(get_current_user),
) -> None:
    """
    Delete submission.
    """
    submission = submission_crud.get_sync(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete file if exists
    if submission.file_path and os.path.exists(submission.file_path):
        os.remove(submission.file_path)
    
    submission_crud.remove_sync(db=db, id=submission_id)
    # Do not return anything for 204

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
    submission = submission_crud.get_sync(db=db, id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    submission = submission_crud.update_status(
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

@router.get("/assignments/{assignment_id}/submissions", response_model=List[schemas.Submission])
def get_submissions_by_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Get all submissions for an assignment.
    """
    submissions = submission_crud.get_by_assignment_sync(
        db=db, assignment_id=assignment_id
    )
    return submissions

@router.get("/users/{user_id}/submissions", response_model=List[schemas.Submission])
def get_submissions_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Get all submissions for a user.
    """
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    submissions = submission_crud.get_by_user_sync(
        db=db, user_id=user_id
    )
    return submissions 

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file with security validation"""
    # Check file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content for security scanning
    content = await file.read()
    
    # Check file size
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds limit"
        )
    
    # Enhanced security scanning for malicious content
    malicious_patterns = [
        b"import os",
        b"os.system",
        b"subprocess",
        b"eval(",
        b"exec(",
        b"__import__",
        b"rm -rf",
        b"del /",
        b"format(",
        b"globals(",
        b"locals(",
        b"<?php",
        b"<script",
        b"javascript:",
        b"vbscript:",
        b"onload=",
        b"onerror=",
        b"onclick=",
        b"<iframe",
        b"<object",
        b"<embed"
    ]
    
    for pattern in malicious_patterns:
        if pattern in content:
            # Create security alert
            from app.models.security import SecurityAlert
            alert = SecurityAlert(
                user_id=current_user.id,
                alert_type="malicious_upload",
                description=f"Malicious file upload detected: {file.filename}",
                severity="high",
                alert_metadata={"filename": file.filename, "pattern": pattern.decode()}
            )
            db.add(alert)
            db.commit()
            
            raise HTTPException(
                status_code=400,
                detail="Malicious content detected"
            )
    
    # Create upload directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Save file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    return {
        "filename": file.filename,
        "file_path": file_path,
        "size": len(content),
        "message": "File uploaded successfully"
    } 
