from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.models.base import Base

class SystemLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False)
    level = Column(String, nullable=False)
    message = Column(String, nullable=False)
    details = Column(JSON, nullable=True) 