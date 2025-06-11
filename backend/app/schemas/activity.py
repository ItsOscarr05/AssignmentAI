from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class ActivityBase(BaseModel):
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class ActivityCreate(ActivityBase):
    user_id: str

class Activity(ActivityBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityFilter(BaseModel):
    user_id: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None 