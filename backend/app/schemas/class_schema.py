from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse

class ClassBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str
    description: Optional[str] = Field(None, max_length=500)
    teacher_id: int
    model_config = ConfigDict(from_attributes=True)

class ClassCreate(ClassBase):
    pass

class ClassUpdate(ClassBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = None
    teacher_id: Optional[int] = None

class ClassInDBBase(ClassBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Class(ClassInDBBase):
    student_ids: Optional[List[int]] = None

class ClassInDB(ClassInDBBase):
    pass

class ClassResponse(ClassBase):
    id: int
    teacher: UserResponse
    students: List[UserResponse] = []
    model_config = ConfigDict(from_attributes=True) 