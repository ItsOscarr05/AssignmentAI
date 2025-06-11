from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.models.submission import SubmissionStatus

class SubmissionBase(BaseModel):
    title: str
    content: Optional[str] = None
    file_path: Optional[str] = None
    status: str = "pending"  # pending, completed
    submission_metadata: Optional[Dict[str, Any]] = None
    attachments: Optional[List[str]] = None
    comments: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    assignment_id: int

class SubmissionUpdate(SubmissionBase):
    title: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None
    status: Optional[str] = None
    submission_metadata: Optional[Dict[str, Any]] = None
    score: Optional[float] = Field(None, ge=0)
    feedback: Optional[str] = None

class SubmissionResponse(SubmissionBase):
    id: int
    assignment_id: int
    student_id: int
    status: SubmissionStatus
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubmissionList(BaseModel):
    total: int
    items: List[SubmissionResponse]

class SubmissionInDBBase(SubmissionBase):
    id: int
    user_id: int
    assignment_id: int
    submitted_at: datetime
    score: Optional[float] = None
    feedback: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class Submission(SubmissionInDBBase):
    pass

class SubmissionInDB(SubmissionInDBBase):
    pass 