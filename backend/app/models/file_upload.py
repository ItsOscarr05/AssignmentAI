from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class FileUpload(Base):
    __tablename__ = "file_uploads"

    id: int = Column(Integer, primary_key=True, index=True)
    filename: str = Column(String(255), nullable=False)
    original_filename: str = Column(String(255), nullable=False)
    file_path: str = Column(String(500), nullable=False)
    file_size: int = Column(Integer, nullable=False)
    mime_type: str = Column(String(100), nullable=False)
    file_type: str = Column(String(50), nullable=False)  # 'document', 'image', 'code', 'data', 'link'
    
    # Content extraction and processing
    extracted_content: str = Column(Text, nullable=True)
    ai_analysis: str = Column(Text, nullable=True)
    processing_status: str = Column(String(50), default='pending')  # 'pending', 'processing', 'completed', 'failed'
    
    # User and assignment relationships
    user_id: int = Column(Integer, nullable=False)
    assignment_id: int = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    
    # Metadata
    upload_metadata: dict = Column(JSON, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Link-specific fields (for URL uploads)
    is_link: bool = Column(Boolean, default=False)
    link_url: str = Column(String(1000), nullable=True)
    link_title: str = Column(String(255), nullable=True)
    link_description: str = Column(Text, nullable=True)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="file_uploads")
