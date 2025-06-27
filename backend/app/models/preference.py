from sqlalchemy import Column, String, JSON, ForeignKey, Boolean, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Preference(Base):
    __tablename__ = "preferences"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # UI Preferences
    theme = Column(String, default="light")  # light, dark, system
    language = Column(String, default="en")
    font_size = Column(String, default="medium")  # small, medium, large
    compact_mode = Column(Boolean, default=False)
    
    # Notification Preferences
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    notification_types = Column(JSON, default={
        "assignment_due": True,
        "grade": True,
        "comment": True,
        "announcement": True
    })
    
    # Privacy Preferences
    show_profile = Column(Boolean, default=True)
    show_progress = Column(Boolean, default=True)
    show_activity = Column(Boolean, default=True)
    
    # Accessibility Preferences
    high_contrast = Column(Boolean, default=False)
    reduced_motion = Column(Boolean, default=False)
    screen_reader = Column(Boolean, default=False)
    
    # Custom Preferences (for future extensibility)
    custom_preferences = Column(JSON, default={})
    
    # Relationships
    user = relationship("User") 