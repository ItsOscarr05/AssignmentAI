from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole
from app.schemas.base import BaseSchema
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    role: str = "user"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserProfile(BaseModel):
    name: str
    email: EmailStr
    avatar: str
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None

class UserPreferences(BaseModel):
    emailNotifications: bool = True
    pushNotifications: bool = True
    darkMode: bool = False
    language: str = "en"
    timezone: str = "UTC"

class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

class UserResponse(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None 