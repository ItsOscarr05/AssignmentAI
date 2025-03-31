from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class AdminStats(BaseModel):
    total_users: int
    total_teachers: int
    total_students: int
    total_assignments: int
    total_submissions: int
    recent_activity: List[dict]

class UserStatusUpdate(BaseModel):
    is_active: bool
    is_verified: bool
    role: Optional[str] = None

class SystemHealth(BaseModel):
    database: bool
    email: bool
    ai_service: bool
    storage: bool

class SystemLog(BaseModel):
    id: int
    timestamp: datetime
    level: str
    message: str
    details: Optional[dict] = None 