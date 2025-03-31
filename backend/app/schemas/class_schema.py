from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse

class ClassBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ClassCreate(ClassBase):
    pass

class ClassUpdate(ClassBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)

class ClassResponse(ClassBase):
    id: int
    teacher_id: int
    teacher: UserResponse
    students: List[UserResponse] = []

    class Config:
        from_attributes = True 