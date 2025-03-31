from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SubmissionBase(BaseModel):
    title: str
    content: Optional[str] = None
    file_path: Optional[str] = None
    status: str = "pending"  # pending, completed
    submission_metadata: Optional[Dict[str, Any]] = None

class SubmissionCreate(SubmissionBase):
    assignment_id: int

class SubmissionUpdate(SubmissionBase):
    title: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None
    status: Optional[str] = None
    submission_metadata: Optional[Dict[str, Any]] = None

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