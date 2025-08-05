from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    preference_key = Column(String(100), nullable=False)
    preference_value = Column(Text, nullable=False)
    preference_type = Column(String(50), nullable=False)  # e.g., 'string', 'boolean', 'json', 'number'
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    preference_metadata = Column(JSON, nullable=True) 