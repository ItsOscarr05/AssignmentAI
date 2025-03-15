"""
Pydantic schemas for AssignmentAI.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

# Document schemas
class DocumentBase(BaseModel):
    filename: str
    file_type: str
    content: Optional[str] = None
    file_metadata: Optional[Dict[str, Any]] = None

class DocumentCreate(DocumentBase):
    assignment_id: int

class DocumentUpdate(DocumentBase):
    filename: Optional[str] = None
    file_type: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    assignment_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Assignment schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    due_date: Optional[datetime] = None

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(AssignmentBase):
    title: Optional[str] = None
    status: Optional[str] = None

class AssignmentResponse(AssignmentBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    documents: List[DocumentResponse] = []

    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = "student"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Feedback schemas
class FeedbackBase(BaseModel):
    content: str
    score: Optional[int] = None
    rubric_data: Optional[Dict[str, Any]] = None

class FeedbackCreate(FeedbackBase):
    assignment_id: int

class FeedbackUpdate(FeedbackBase):
    content: Optional[str] = None

class FeedbackResponse(FeedbackBase):
    id: int
    assignment_id: int
    reviewer_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 