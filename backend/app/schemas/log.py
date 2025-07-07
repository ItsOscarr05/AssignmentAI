from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class SystemLogBase(BaseModel):
    level: str
    message: str
    details: Optional[Dict[str, Any]] = None

class SystemLogCreate(SystemLogBase):
    pass

class SystemLog(SystemLogBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True) 