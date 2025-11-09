from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean
from app.db.base_class import Base


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(JSON, nullable=False)
    type = Column(String(50), nullable=False)  # e.g., 'assignment', 'feedback', 'email'
    category = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True)
    style = Column(JSON, nullable=True)
    is_public = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, nullable=False, index=True)
    usage_count = Column(Integer, nullable=False, default=0)
    _metadata = Column("metadata", JSON, nullable=True)
    variables = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)