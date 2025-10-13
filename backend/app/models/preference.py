from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # UI Preferences
    theme = Column(String(20), default="light")
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    font_size = Column(String(20), default="medium")
    compact_mode = Column(Boolean, default=False)
    

    
    # Privacy Preferences
    show_profile = Column(Boolean, default=True)
    show_progress = Column(Boolean, default=True)
    show_activity = Column(Boolean, default=True)
    
    # Accessibility Preferences
    high_contrast = Column(Boolean, default=False)
    reduced_motion = Column(Boolean, default=False)
    screen_reader = Column(Boolean, default=False)
    
    # Custom Preferences
    custom_preferences = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 