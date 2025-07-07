from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Union

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenWith2FA(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    requires_2fa: bool

class TokenData(BaseModel):
    email: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    code: Optional[str] = None
    remember_me: Optional[bool] = False

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    password: str

class TwoFactorSetup(BaseModel):
    qr_code: str
    secret: str

class TwoFactorVerify(BaseModel):
    backup_codes: List[str]

class TwoFactorBackup(BaseModel):
    code: str

class PasswordCheck(BaseModel):
    is_valid: bool
    strength_score: int
    message: str
    is_safe: bool
    breach_message: str 