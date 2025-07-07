from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TokenBase(BaseModel):
    token: str
    user_id: int
    expires_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TokenCreate(TokenBase):
    pass

class TokenUpdate(TokenBase):
    pass

class TokenInDBBase(TokenBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Token(TokenInDBBase):
    pass

class TokenInDB(TokenInDBBase):
    pass

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    exp: Optional[int] = None
    role: Optional[str] = None 