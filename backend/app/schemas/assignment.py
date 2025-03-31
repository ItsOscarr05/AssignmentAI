from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.class_schema import ClassResponse
from app.schemas.user import UserResponse
from app.models.assignment import AssignmentStatus, DifficultyLevel

class AssignmentBase(BaseModel):
    title: str
    subject: str
    grade_level: str
    assignment_type: str
    topic: str
    difficulty: DifficultyLevel
    estimated_time: int
    additional_requirements: Optional[str] = None
    description: Optional[str] = None
    max_score: float = 100.0
    status: AssignmentStatus = AssignmentStatus.DRAFT
    is_active: bool = True

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(AssignmentBase):
    title: Optional[str] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    assignment_type: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    estimated_time: Optional[int] = None
    max_score: Optional[float] = None
    status: Optional[AssignmentStatus] = None
    is_active: Optional[bool] = None

class AssignmentResponse(AssignmentBase):
    id: int
    teacher_id: int
    teacher: UserResponse
    class_: ClassResponse

    class Config:
        from_attributes = True

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