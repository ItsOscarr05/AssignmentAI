from typing import Optional, List
from pydantic import BaseModel
from app.schemas.base import BaseSchema
from app.schemas.user import User

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassUpdate(ClassBase):
    name: Optional[str] = None

class ClassInDBBase(ClassBase, BaseSchema):
    teacher_id: int
    teacher: User
    students: List[User] = []

    class Config:
        from_attributes = True

class Class(ClassInDBBase):
    pass

class ClassInDB(ClassInDBBase):
    pass 