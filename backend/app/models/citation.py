from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Citation(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Citation metadata
    title = Column(String(500), nullable=False)
    authors = Column(String(500), nullable=False)
    year = Column(String(4))
    journal = Column(String(200))
    volume = Column(String(50))
    issue = Column(String(50))
    pages = Column(String(100))
    url = Column(String(500))
    doi = Column(String(200))
    publisher = Column(String(200))
    location = Column(String(200))
    
    # Citation type (journal, book, website, etc.)
    citation_type = Column(String(50), default='journal')
    
    # Pre-generated formatted citations
    formatted_citations = Column(JSON)  # Stores APA, MLA, Chicago, Harvard formats
    
    # Additional metadata
    notes = Column(Text)
    tags = Column(JSON)  # Array of tags for organization
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User") 