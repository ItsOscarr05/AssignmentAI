from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class SecurityAlertBase(BaseModel):
    alert_type: str
    description: str
    severity: str
    alert_metadata: Optional[Dict[str, Any]] = None

class SecurityAlertCreate(SecurityAlertBase):
    pass

class SecurityAlertUpdate(BaseModel):
    resolved: Optional[bool] = None
    resolution_notes: Optional[str] = None

class SecurityAlertResponse(SecurityAlertBase):
    id: int
    user_id: int
    timestamp: datetime
    resolved: bool
    resolution_notes: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[int] = None

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: Optional[int] = None
    timestamp: datetime

    class Config:
        from_attributes = True 