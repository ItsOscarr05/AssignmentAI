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
    is_superuser: Optional[bool] = None

class SystemHealth(BaseModel):
    database: bool
    email: bool
    ai_service: bool
    storage: bool

class SystemLog(BaseModel):
    id: int
    level: str
    message: str
    timestamp: datetime
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None 