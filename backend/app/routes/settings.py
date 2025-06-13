from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from pydantic import BaseModel
from app.services.settings_service import SettingsService
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter()
settings_service = SettingsService()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class GeneralSettings(BaseModel):
    darkMode: bool
    language: str
    fontSize: int
    animations: bool
    compactMode: bool
    soundEffects: bool
    volume: int
    quietHoursStart: int
    quietHoursEnd: int
    timeZone: str
    dateFormat: str
    autoTranslate: bool
    showOriginalText: bool
    useMetricSystem: bool
    use24HourFormat: bool
    hapticFeedback: bool
    notificationSounds: bool
    typingSounds: bool
    completionSounds: bool

class AISettings(BaseModel):
    aiModel: str
    maxTokens: int
    temperature: float
    contextLength: int
    autoComplete: bool
    codeSnippets: bool
    aiSuggestions: bool
    realTimeAnalysis: bool

class NotificationSettings(BaseModel):
    notifications: dict
    quietHoursStart: int
    quietHoursEnd: int

class PrivacySettings(BaseModel):
    twoFactorAuth: bool
    biometricLogin: bool
    dataCollection: bool
    shareAnalytics: bool
    showOnlineStatus: bool
    allowTracking: bool
    autoLock: bool
    lockTimeout: int
    passwordExpiry: int
    sessionTimeout: int

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str

class TwoFactorAuth(BaseModel):
    enabled: bool

class BiometricLogin(BaseModel):
    enabled: bool

class AccountDeletion(BaseModel):
    password: str

@router.get("/user")
async def get_user_settings(current_user: User = Depends(get_current_user)):
    """Get all settings for the current user."""
    try:
        return await settings_service.get_user_settings(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/general")
async def update_general_settings(
    settings: GeneralSettings,
    current_user: User = Depends(get_current_user)
):
    """Update general settings for the current user."""
    try:
        await settings_service.update_general_settings(current_user.id, settings.dict())
        return {"message": "General settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/ai")
async def update_ai_settings(
    settings: AISettings,
    current_user: User = Depends(get_current_user)
):
    """Update AI settings for the current user."""
    try:
        await settings_service.update_ai_settings(current_user.id, settings.dict())
        return {"message": "AI settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/notifications")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user)
):
    """Update notification settings for the current user."""
    try:
        await settings_service.update_notification_settings(current_user.id, settings.dict())
        return {"message": "Notification settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/privacy")
async def update_privacy_settings(
    settings: PrivacySettings,
    current_user: User = Depends(get_current_user)
):
    """Update privacy settings for the current user."""
    try:
        await settings_service.update_privacy_settings(current_user.id, settings.dict())
        return {"message": "Privacy settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user)
):
    """Change the user's password."""
    try:
        await settings_service.change_password(
            current_user.id,
            password_data.currentPassword,
            password_data.newPassword
        )
        return {"message": "Password changed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/2fa")
async def toggle_2fa(
    data: TwoFactorAuth,
    current_user: User = Depends(get_current_user)
):
    """Enable or disable two-factor authentication."""
    try:
        await settings_service.toggle_2fa(current_user.id, data.enabled)
        return {"message": f"Two-factor authentication {'enabled' if data.enabled else 'disabled'} successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/biometric")
async def setup_biometric_login(
    data: BiometricLogin,
    current_user: User = Depends(get_current_user)
):
    """Setup or disable biometric login."""
    try:
        await settings_service.setup_biometric_login(current_user.id, data.enabled)
        return {"message": f"Biometric login {'enabled' if data.enabled else 'disabled'} successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data")
async def download_user_data(current_user: User = Depends(get_current_user)):
    """Download user data."""
    try:
        return await settings_service.download_user_data(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/account")
async def delete_account(
    data: AccountDeletion,
    current_user: User = Depends(get_current_user)
):
    """Delete the user's account."""
    try:
        await settings_service.delete_account(current_user.id, data.password)
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_active_sessions(current_user: User = Depends(get_current_user)):
    """Get all active sessions for the current user."""
    try:
        return await settings_service.get_active_sessions(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Revoke a specific session."""
    try:
        await settings_service.revoke_session(current_user.id, session_id)
        return {"message": "Session revoked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 