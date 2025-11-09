from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from app.db.base_class import Base


class Citation(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(500), nullable=False)
    authors = Column(String(500), nullable=False)
    year = Column(String(4), nullable=True)
    journal = Column(String(255), nullable=True)
    volume = Column(String(50), nullable=True)
    issue = Column(String(50), nullable=True)
    pages = Column(String(100), nullable=True)
    doi = Column(String(255), nullable=True, index=True)
    url = Column(String(500), nullable=True)
    publisher = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    citation_type = Column(String(50), nullable=False, default="journal")
    formatted_citations = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    citation_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )