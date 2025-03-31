from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
import re

class FeedbackBase(BaseModel):
    content: str = Field(..., min_length=10, max_length=5000)
    feedback_type: str = Field(..., pattern=r'^(general|grammar|content|structure|technical)$')
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @validator('content')
    def sanitize_content(cls, v):
        """Sanitize content by removing HTML and limiting length."""
        return re.sub(r'<[^>]+>', '', v)[:5000]

    @validator('metadata')
    def sanitize_metadata(cls, v):
        """Sanitize metadata values."""
        return {
            k: re.sub(r'<[^>]+>', '', str(v))[:500]  # Remove HTML and limit length
            for k, v in v.items()
        }

class FeedbackCreate(FeedbackBase):
    submission_id: int

class FeedbackUpdate(FeedbackBase):
    pass

class FeedbackInDB(FeedbackBase):
    id: int
    submission_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Feedback(FeedbackInDB):
    pass 