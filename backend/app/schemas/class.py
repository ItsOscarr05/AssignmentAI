from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.base import BaseSchema
from app.schemas.user import User

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ClassCreate(ClassBase):
    pass

class ClassUpdate(ClassBase):
    name: Optional[str] = None

class ClassInDBBase(ClassBase, BaseSchema):
    teacher_id: int
    teacher: User
    students: List[User] = []
    model_config = ConfigDict(from_attributes=True)

class Class(ClassInDBBase):
    pass

class ClassInDB(ClassInDBBase):
    pass 