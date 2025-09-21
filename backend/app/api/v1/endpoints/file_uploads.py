from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.crud import file_upload as file_upload_crud
from app.schemas.file_upload import FileUploadResponse, FileUploadCreate, FileUploadUpdate, FileUploadList
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=FileUploadResponse, status_code=201)
def create_file_upload(
    file_upload: FileUploadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new file upload record"""
    return file_upload_crud.create_file_upload(db, file_upload, current_user.id)

@router.get("/", response_model=FileUploadList)
def list_file_uploads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    assignment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List file uploads for the current user"""
    if assignment_id:
        file_uploads = file_upload_crud.get_file_uploads_by_assignment(db, assignment_id)
        total = len(file_uploads)
    else:
        file_uploads = file_upload_crud.get_file_uploads_by_user(db, current_user.id, skip, limit)
        total = len(file_upload_crud.get_file_uploads_by_user(db, current_user.id, 0, 10000))
    
    return FileUploadList(
        items=file_uploads,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/recent", response_model=List[FileUploadResponse])
def get_recent_file_uploads(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent file uploads for the current user"""
    return file_upload_crud.get_recent_file_uploads(db, current_user.id, limit)

@router.get("/{file_upload_id}", response_model=FileUploadResponse)
def get_file_upload(
    file_upload_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific file upload"""
    file_upload = file_upload_crud.get_file_upload(db, file_upload_id)
    if not file_upload:
        raise HTTPException(status_code=404, detail="File upload not found")
    if file_upload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return file_upload

@router.put("/{file_upload_id}", response_model=FileUploadResponse)
def update_file_upload(
    file_upload_id: int,
    file_upload: FileUploadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a file upload"""
    db_file_upload = file_upload_crud.get_file_upload(db, file_upload_id)
    if not db_file_upload:
        raise HTTPException(status_code=404, detail="File upload not found")
    if db_file_upload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return file_upload_crud.update_file_upload(db, file_upload_id, file_upload)

@router.delete("/{file_upload_id}", status_code=204)
def delete_file_upload(
    file_upload_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a file upload"""
    db_file_upload = file_upload_crud.get_file_upload(db, file_upload_id)
    if not db_file_upload:
        raise HTTPException(status_code=404, detail="File upload not found")
    if db_file_upload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if not file_upload_crud.delete_file_upload(db, file_upload_id):
        raise HTTPException(status_code=500, detail="Failed to delete file upload")

@router.post("/{file_upload_id}/link-assignment", response_model=FileUploadResponse)
def link_file_upload_to_assignment(
    file_upload_id: int,
    assignment_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Link a file upload to an assignment"""
    db_file_upload = file_upload_crud.get_file_upload(db, file_upload_id)
    if not db_file_upload:
        raise HTTPException(status_code=404, detail="File upload not found")
    if db_file_upload.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_file_upload = file_upload_crud.link_file_upload_to_assignment(db, file_upload_id, assignment_id)
    if not updated_file_upload:
        raise HTTPException(status_code=500, detail="Failed to link file upload to assignment")
    
    return updated_file_upload
