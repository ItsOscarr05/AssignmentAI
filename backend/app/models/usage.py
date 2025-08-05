from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Usage(Base):
    __tablename__ = "usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    tokens_used = Column(Integer, default=0)
    requests_made = Column(Integer, default=0)
    usage_metadata = Column(JSON, nullable=True)

class UsageLimit(Base):
    __tablename__ = "usage_limits"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(String, nullable=False)  # References the subscription plan
    feature = Column(String, nullable=False)
    limit_type = Column(String, nullable=False)  # e.g., 'daily', 'monthly', 'total'
    limit_value = Column(Integer, nullable=False)
    limit_metadata = Column(JSON)  # Additional limit configuration 