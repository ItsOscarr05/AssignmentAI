from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from app.models.submission import SubmissionStatus
import json

class SubmissionBase(BaseModel):
    title: str = "Submission"  # Default title
    content: Optional[str] = None
    file_path: Optional[str] = None
    status: str = "submitted"  # submitted, late, graded, returned
    submission_metadata: Optional[Dict[str, Any]] = None
    attachments: Optional[str] = None  # JSON string of file URLs
    comments: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    assignment_id: int

class SubmissionUpdate(SubmissionBase):
    title: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None
    status: Optional[str] = None
    submission_metadata: Optional[Dict[str, Any]] = None
    attachments: Optional[str] = None  # JSON string of file URLs
    score: Optional[float] = Field(None, ge=0)
    feedback: Optional[str] = None

class SubmissionResponse(SubmissionBase):
    id: int
    assignment_id: int
    student_id: int  # This maps to user_id in the model
    status: SubmissionStatus
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None
    attachments: Optional[List[str]] = None  # List of file URLs for response

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm(cls, obj):
        # Map user_id to student_id for the response
        data = obj.__dict__.copy()
        data['student_id'] = data.pop('user_id', None)
        # Convert attachments from JSON string to list if needed
        if isinstance(data.get('attachments'), str):
            try:
                data['attachments'] = json.loads(data['attachments'])
            except (json.JSONDecodeError, TypeError):
                data['attachments'] = []
        return cls(**data)

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