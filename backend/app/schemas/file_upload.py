from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class FileUploadBase(BaseModel):
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    file_type: str
    assignment_id: Optional[int] = None
    is_link: bool = False
    link_url: Optional[str] = None
    link_title: Optional[str] = None
    link_description: Optional[str] = None
    upload_metadata: Optional[Dict[str, Any]] = None
    extracted_content: Optional[str] = None
    ai_analysis: Optional[str] = None
    processing_status: str = "pending"

class FileUploadCreate(FileUploadBase):
    pass

class FileUploadUpdate(BaseModel):
    filename: Optional[str] = None
    original_filename: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    file_type: Optional[str] = None
    assignment_id: Optional[int] = None
    is_link: Optional[bool] = None
    link_url: Optional[str] = None
    link_title: Optional[str] = None
    link_description: Optional[str] = None
    upload_metadata: Optional[Dict[str, Any]] = None
    extracted_content: Optional[str] = None
    ai_analysis: Optional[str] = None
    processing_status: Optional[str] = None

class FileUploadResponse(FileUploadBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FileUploadList(BaseModel):
    items: list[FileUploadResponse]
    total: int
    skip: int
    limit: int
