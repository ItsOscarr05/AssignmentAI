from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    is_read: bool = False
    is_archived: bool = False
    model_config = ConfigDict(from_attributes=True)

class NotificationCreate(NotificationBase):
    user_id: str

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None

class Notification(NotificationBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationFilter(BaseModel):
    type: Optional[str] = None
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None 