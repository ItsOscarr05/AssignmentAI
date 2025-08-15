from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict
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
    is_active: bool = True
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    password: Optional[str] = None

class UserProfile(BaseModel):
    name: str
    email: EmailStr
    avatar: str
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None

class UserPreferences(BaseModel):
    darkMode: bool = False
    language: str = "en"
    # AI Settings
    ai_settings: Optional[Dict[str, Any]] = None

class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

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