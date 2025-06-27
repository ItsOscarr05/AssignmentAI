from sqlalchemy import Column, Integer, String, JSON, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    content = Column(JSON, nullable=False)  # Stores template structure and content
    type = Column(String, nullable=False)  # e.g., 'assignment', 'report', 'feedback'
    category = Column(String)  # e.g., 'essay', 'lab_report', 'presentation'
    is_public = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Template metadata
    template_metadata = Column(JSON)  # Stores additional template metadata like tags, difficulty, etc.
    
    # Relationships
    creator = relationship("User")
    usage_count = Column(Integer, default=0)  # Track template usage 