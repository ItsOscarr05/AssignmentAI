from typing import Dict, List, Optional
from datetime import datetime
import json
from app.models.user import User
from app.models.settings import UserSettings
from app.core.security import verify_password, get_password_hash
from app.core.database import get_db
from sqlalchemy.orm import Session
from fastapi import HTTPException

class SettingsService:
    def __init__(self):
        self.db = next(get_db())

    async def get_user_settings(self, user_id: int) -> Dict:
        """Get all settings for a user."""
        settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not settings:
            # Create default settings if none exist
            settings = UserSettings(user_id=user_id)
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)
        return settings.to_dict()

    async def update_general_settings(self, user_id: int, settings: Dict) -> None:
        """Update general settings for a user."""
        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user_settings:
            raise HTTPException(status_code=404, detail="User settings not found")

        for key, value in settings.items():
            setattr(user_settings, key, value)

        self.db.commit()

    async def update_ai_settings(self, user_id: int, settings: Dict) -> None:
        """Update AI settings for a user."""
        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user_settings:
            raise HTTPException(status_code=404, detail="User settings not found")

        for key, value in settings.items():
            setattr(user_settings, key, value)

        self.db.commit()

    async def update_notification_settings(self, user_id: int, settings: Dict) -> None:
        """Update notification settings for a user."""
        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user_settings:
            raise HTTPException(status_code=404, detail="User settings not found")

        for key, value in settings.items():
            setattr(user_settings, key, value)

        self.db.commit()

    async def update_privacy_settings(self, user_id: int, settings: Dict) -> None:
        """Update privacy settings for a user."""
        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user_settings:
            raise HTTPException(status_code=404, detail="User settings not found")

        for key, value in settings.items():
            setattr(user_settings, key, value)

        self.db.commit()

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> None:
        """Change a user's password."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        user.hashed_password = get_password_hash(new_password)
        self.db.commit()

    async def toggle_2fa(self, user_id: int, enabled: bool) -> None:
        """Enable or disable two-factor authentication."""
        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user_settings:
            raise HTTPException(status_code=404, detail="User settings not found")

        user_settings.two_factor_auth = enabled
        self.db.commit()

    async def setup_biometric_login(self, user_id: int, enabled: bool) -> None:
        """Setup or disable biometric login."""
        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user_settings:
            raise HTTPException(status_code=404, detail="User settings not found")

        user_settings.biometric_login = enabled
        self.db.commit()

    async def download_user_data(self, user_id: int) -> Dict:
        """Download all user data."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not user_settings:
            raise HTTPException(status_code=404, detail="User settings not found")

        # Collect all user data
        user_data = {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
            },
            "settings": user_settings.to_dict(),
            # Add more user data as needed
        }

        return user_data

    async def delete_account(self, user_id: int, password: str) -> None:
        """Delete a user's account."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Password is incorrect")

        # Delete user settings
        user_settings = self.db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if user_settings:
            self.db.delete(user_settings)

        # Delete user
        self.db.delete(user)
        self.db.commit()

    async def get_active_sessions(self, user_id: int) -> List[Dict]:
        """Get all active sessions for a user."""
        # Implement session tracking logic here
        # This is a placeholder implementation
        return [
            {
                "id": "session1",
                "device": "Chrome on Windows",
                "lastActive": datetime.now().isoformat(),
            }
        ]

    async def revoke_session(self, user_id: int, session_id: str) -> None:
        """Revoke a specific session."""
        # Implement session revocation logic here
        # This is a placeholder implementation
        pass 