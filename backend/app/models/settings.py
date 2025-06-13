from sqlalchemy import Column, Integer, Boolean, String, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    user = relationship("User", back_populates="settings")

    # General Settings
    dark_mode = Column(Boolean, default=False)
    language = Column(String, default="en")
    font_size = Column(Integer, default=14)
    animations = Column(Boolean, default=True)
    compact_mode = Column(Boolean, default=False)
    sound_effects = Column(Boolean, default=True)
    volume = Column(Integer, default=70)
    quiet_hours_start = Column(Integer, default=22)
    quiet_hours_end = Column(Integer, default=7)
    time_zone = Column(String, default="UTC")
    date_format = Column(String, default="MM/DD/YYYY")
    auto_translate = Column(Boolean, default=False)
    show_original_text = Column(Boolean, default=True)
    use_metric_system = Column(Boolean, default=False)
    use_24_hour_format = Column(Boolean, default=False)

    # Sound & Feedback Settings
    haptic_feedback = Column(Boolean, default=True)
    notification_sounds = Column(Boolean, default=True)
    typing_sounds = Column(Boolean, default=False)
    completion_sounds = Column(Boolean, default=True)

    # AI Settings
    ai_model = Column(String, default="gpt-4-0125-preview")
    max_tokens = Column(Integer, default=1000)
    temperature = Column(Float, default=0.7)
    context_length = Column(Integer, default=10)
    auto_complete = Column(Boolean, default=True)
    code_snippets = Column(Boolean, default=True)
    ai_suggestions = Column(Boolean, default=True)
    real_time_analysis = Column(Boolean, default=True)

    # Notification Settings
    notifications = Column(JSON, default={
        "email": True,
        "desktop": True,
        "sound": True,
        "assignments": True,
        "deadlines": True,
        "feedback": True,
        "updates": True
    })

    # Privacy & Security Settings
    two_factor_auth = Column(Boolean, default=False)
    biometric_login = Column(Boolean, default=False)
    data_collection = Column(Boolean, default=True)
    share_analytics = Column(Boolean, default=True)
    show_online_status = Column(Boolean, default=True)
    allow_tracking = Column(Boolean, default=False)
    auto_lock = Column(Boolean, default=True)
    lock_timeout = Column(Integer, default=5)  # minutes
    password_expiry = Column(Integer, default=90)  # days
    session_timeout = Column(Integer, default=30)  # minutes

    def to_dict(self):
        """Convert settings to dictionary."""
        return {
            # General Settings
            "darkMode": self.dark_mode,
            "language": self.language,
            "fontSize": self.font_size,
            "animations": self.animations,
            "compactMode": self.compact_mode,
            "soundEffects": self.sound_effects,
            "volume": self.volume,
            "quietHoursStart": self.quiet_hours_start,
            "quietHoursEnd": self.quiet_hours_end,
            "timeZone": self.time_zone,
            "dateFormat": self.date_format,
            "autoTranslate": self.auto_translate,
            "showOriginalText": self.show_original_text,
            "useMetricSystem": self.use_metric_system,
            "use24HourFormat": self.use_24_hour_format,

            # Sound & Feedback Settings
            "hapticFeedback": self.haptic_feedback,
            "notificationSounds": self.notification_sounds,
            "typingSounds": self.typing_sounds,
            "completionSounds": self.completion_sounds,

            # AI Settings
            "aiModel": self.ai_model,
            "maxTokens": self.max_tokens,
            "temperature": self.temperature,
            "contextLength": self.context_length,
            "autoComplete": self.auto_complete,
            "codeSnippets": self.code_snippets,
            "aiSuggestions": self.ai_suggestions,
            "realTimeAnalysis": self.real_time_analysis,

            # Notification Settings
            "notifications": self.notifications,

            # Privacy & Security Settings
            "privacySettings": {
                "twoFactorAuth": self.two_factor_auth,
                "biometricLogin": self.biometric_login,
                "dataCollection": self.data_collection,
                "shareAnalytics": self.share_analytics,
                "showOnlineStatus": self.show_online_status,
                "allowTracking": self.allow_tracking,
                "autoLock": self.auto_lock,
                "lockTimeout": self.lock_timeout,
                "passwordExpiry": self.password_expiry,
                "sessionTimeout": self.session_timeout,
            }
        } 