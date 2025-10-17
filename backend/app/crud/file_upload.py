from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.file_upload import FileUpload
from app.schemas.file_upload import FileUploadCreate, FileUploadUpdate
from datetime import datetime

def create_file_upload(db: Session, file_upload: FileUploadCreate, user_id: int) -> FileUpload:
    """Create a new file upload record"""
    db_file_upload = FileUpload(
        filename=file_upload.filename,
        original_filename=file_upload.original_filename,
        file_path=file_upload.file_path,
        file_size=file_upload.file_size,
        mime_type=file_upload.mime_type,
        file_type=file_upload.file_type,
        user_id=user_id,
        assignment_id=file_upload.assignment_id,
        is_link=file_upload.is_link,
        link_url=file_upload.link_url,
        link_title=file_upload.link_title,
        link_description=file_upload.link_description,
        upload_metadata=file_upload.upload_metadata,
        extracted_content=file_upload.extracted_content,
        ai_analysis=file_upload.ai_analysis,
        processing_status=file_upload.processing_status
    )
    db.add(db_file_upload)
    db.commit()
    db.refresh(db_file_upload)
    return db_file_upload

async def create_file_upload_async(db: AsyncSession, file_upload: FileUploadCreate, user_id: int) -> FileUpload:
    """Create a new file upload record asynchronously"""
    db_file_upload = FileUpload(
        filename=file_upload.filename,
        original_filename=file_upload.original_filename,
        file_path=file_upload.file_path,
        file_size=file_upload.file_size,
        mime_type=file_upload.mime_type,
        file_type=file_upload.file_type,
        user_id=user_id,
        assignment_id=file_upload.assignment_id,
        is_link=file_upload.is_link,
        link_url=file_upload.link_url,
        link_title=file_upload.link_title,
        link_description=file_upload.link_description,
        upload_metadata=file_upload.upload_metadata,
        extracted_content=file_upload.extracted_content,
        ai_analysis=file_upload.ai_analysis,
        processing_status=file_upload.processing_status
    )
    db.add(db_file_upload)
    await db.commit()
    await db.refresh(db_file_upload)
    return db_file_upload

def get_file_upload(db: Session, file_upload_id: int) -> Optional[FileUpload]:
    """Get a file upload by ID"""
    return db.query(FileUpload).filter(FileUpload.id == file_upload_id).first()

def get_file_uploads_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[FileUpload]:
    """Get all file uploads for a user"""
    return db.query(FileUpload).filter(FileUpload.user_id == user_id).offset(skip).limit(limit).all()

def get_file_uploads_by_assignment(db: Session, assignment_id: int) -> List[FileUpload]:
    """Get all file uploads for an assignment"""
    return db.query(FileUpload).filter(FileUpload.assignment_id == assignment_id).all()

def get_recent_file_uploads(db: Session, user_id: int, limit: int = 10) -> List[FileUpload]:
    """Get recent file uploads for a user"""
    return db.query(FileUpload).filter(FileUpload.user_id == user_id).order_by(FileUpload.created_at.desc()).limit(limit).all()

def update_file_upload(db: Session, file_upload_id: int, file_upload: FileUploadUpdate) -> Optional[FileUpload]:
    """Update a file upload"""
    db_file_upload = db.query(FileUpload).filter(FileUpload.id == file_upload_id).first()
    if db_file_upload:
        update_data = file_upload.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_file_upload, field, value)
        db_file_upload.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_file_upload)
    return db_file_upload

def delete_file_upload(db: Session, file_upload_id: int) -> bool:
    """Delete a file upload"""
    db_file_upload = db.query(FileUpload).filter(FileUpload.id == file_upload_id).first()
    if db_file_upload:
        db.delete(db_file_upload)
        db.commit()
        return True
    return False

def link_file_upload_to_assignment(db: Session, file_upload_id: int, assignment_id: int) -> Optional[FileUpload]:
    """Link a file upload to an assignment"""
    db_file_upload = db.query(FileUpload).filter(FileUpload.id == file_upload_id).first()
    if db_file_upload:
        db_file_upload.assignment_id = assignment_id
        db_file_upload.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_file_upload)
    return db_file_upload
