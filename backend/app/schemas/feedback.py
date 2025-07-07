from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator
import re
import bleach

class FeedbackBase(BaseModel):
    content: str = Field(..., min_length=10, max_length=5000)
    feedback_type: str = Field(..., pattern=r'^(general|grammar|content|structure|technical|grading)$')
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    score: Optional[float] = Field(None, ge=0.0, le=100.0)
    feedback_metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v):
        """Sanitize content by removing HTML, scripts, and limiting length."""
        # Remove <script>...</script> blocks and their content
        v = re.sub(r'<script.*?>.*?</script>', '', v, flags=re.DOTALL | re.IGNORECASE)
        return bleach.clean(v, tags=[], strip=True)[:5000]

    @field_validator('feedback_metadata')
    @classmethod
    def sanitize_metadata(cls, v):
        """Sanitize metadata values."""
        return {
            k: bleach.clean(re.sub(r'<script.*?>.*?</script>', '', str(v), flags=re.DOTALL | re.IGNORECASE), tags=[], strip=True)[:500]
            for k, v in v.items()
        }

class FeedbackCreate(FeedbackBase):
    submission_id: int

class FeedbackUpdate(FeedbackBase):
    content: Optional[str] = Field(None, min_length=10, max_length=5000)
    feedback_type: Optional[str] = Field(None, pattern=r'^(general|grammar|content|structure|technical|grading)$')
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    score: Optional[float] = Field(None, ge=0.0, le=100.0)
    feedback_metadata: Optional[Dict[str, Any]] = Field(None)

class FeedbackInDB(FeedbackBase):
    id: int
    submission_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class Feedback(FeedbackInDB):
    pass

class FeedbackResponse(FeedbackInDB):
    pass

class FeedbackList(BaseModel):
    total: int
    items: List[FeedbackResponse] 