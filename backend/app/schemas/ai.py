from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class AssignmentGenerationRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=100)
    grade_level: str = Field(..., min_length=1, max_length=20)
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: str = Field(..., min_length=1, max_length=20)
    requirements: Optional[Dict[str, Any]] = None

class AssignmentGenerationResponse(BaseModel):
    success: bool
    assignment: Optional[Dict[str, Any]] = None
    error: Optional[str] = None 