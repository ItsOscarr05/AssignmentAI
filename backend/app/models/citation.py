from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Citation(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    authors = Column(String(500), nullable=True)
    publication_year = Column(Integer, nullable=True)
    journal = Column(String(255), nullable=True)
    volume = Column(String(50), nullable=True)
    issue = Column(String(50), nullable=True)
    pages = Column(String(100), nullable=True)
    doi = Column(String(255), nullable=True)
    url = Column(String(500), nullable=True)
    citation_type = Column(String(50), nullable=False)  # e.g., 'journal', 'book', 'website', 'conference'
    citation_style = Column(String(50), nullable=False)  # e.g., 'apa', 'mla', 'chicago'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    citation_metadata = Column(JSON, nullable=True) 