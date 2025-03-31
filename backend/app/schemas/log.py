from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class SystemLogBase(BaseModel):
    level: str
    message: str
    details: Optional[Dict[str, Any]] = None

class SystemLogCreate(SystemLogBase):
    pass

class SystemLog(SystemLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True 