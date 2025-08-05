from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class File(Base):
    __tablename__ = "files"

    id: int = Column(Integer, primary_key=True, index=True)
    filename: str = Column(String(255), nullable=False)
    file_path: str = Column(String(500), nullable=False)
    file_size: int = Column(Integer, nullable=False)
    mime_type: str = Column(String(100), nullable=False)
    uploaded_at: DateTime = Column(DateTime(timezone=True), server_default=func.now())
    file_metadata: dict = Column(JSON, nullable=True) 