from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.class_schema import ClassResponse
from app.schemas.user import UserResponse
from app.models.assignment import AssignmentStatus, DifficultyLevel

class AssignmentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1, max_length=100)
    grade_level: str = Field(..., min_length=1, max_length=50)
    due_date: datetime
    max_score: int = Field(..., ge=0, le=100)
    attachments: Optional[List[str]] = None

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    grade_level: Optional[str] = Field(None, min_length=1, max_length=50)
    due_date: Optional[datetime] = None
    max_score: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[AssignmentStatus] = None
    attachments: Optional[List[str]] = None

class AssignmentResponse(AssignmentBase):
    id: int
    status: AssignmentStatus
    created_by_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssignmentList(BaseModel):
    total: int
    items: List[AssignmentResponse]

class AssignmentInDBBase(AssignmentBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Assignment(AssignmentInDBBase):
    pass

class AssignmentInDB(AssignmentInDBBase):
    pass

# Import Submission here to avoid circular imports
from app.schemas.submission import Submission

class AssignmentWithSubmissions(Assignment):
    submissions: List[Submission] = [] 