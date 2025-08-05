from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class Activity(Base):
    __tablename__ = "activities"

    id: int = Column(Integer, primary_key=True, index=True)
    type: str = Column(String(100), nullable=False)
    title: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    activity_metadata: dict = Column(JSON, nullable=True) 