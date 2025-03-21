from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    assignments = relationship("Assignment", back_populates="owner")
    external_documents = relationship("ExternalDocument", back_populates="owner")
    tasks = relationship("Task", back_populates="user")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    grade_level = Column(String)
    assignment_text = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="assignments")
    external_documents = relationship("ExternalDocument", back_populates="assignment")
    tasks = relationship("Task", back_populates="assignment")

class ExternalDocument(Base):
    __tablename__ = "external_documents"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    title = Column(String)
    content = Column(Text)
    content_type = Column(String)  # e.g., 'pdf', 'doc', 'text', 'webpage'
    processed = Column(Boolean, default=False)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=True)
    
    owner = relationship("User", back_populates="external_documents")
    assignment = relationship("Assignment", back_populates="external_documents")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    
    # Foreign keys
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    assignment = relationship("Assignment", back_populates="tasks")
    user = relationship("User", back_populates="tasks")