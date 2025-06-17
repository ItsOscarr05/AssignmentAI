from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Usage(Base):
    __tablename__ = "usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    feature = Column(String, nullable=False)  # e.g., 'template', 'ai_generation', 'file_upload'
    action = Column(String, nullable=False)  # e.g., 'create', 'use', 'delete'
    timestamp = Column(DateTime, default=datetime.utcnow)
    tokens_used = Column(Integer, default=0)  # NEW FIELD
    metadata = Column(JSON)  # Additional usage data like size, duration, etc.
    
    # Relationships
    user = relationship("User", back_populates="usage_records")

class UsageLimit(Base):
    __tablename__ = "usage_limits"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String, nullable=False)  # References the subscription plan
    feature = Column(String, nullable=False)
    limit_type = Column(String, nullable=False)  # e.g., 'daily', 'monthly', 'total'
    limit_value = Column(Integer, nullable=False)
    metadata = Column(JSON)  # Additional limit configuration 