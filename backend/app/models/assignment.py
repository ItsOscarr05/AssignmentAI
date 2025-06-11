from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, Index, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class AssignmentStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False)
    grade_level = Column(String(50), nullable=False)
    assignment_type = Column(String(50), nullable=False)
    topic = Column(String(255), nullable=False)
    difficulty = Column(Enum(DifficultyLevel), nullable=False)
    estimated_time = Column(Integer, nullable=False)  # in minutes
    additional_requirements = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    max_score = Column(Float, default=100.0)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DRAFT)
    description = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    due_date = Column(DateTime, nullable=False)
    attachments = Column(Text, nullable=True)  # JSON string of file URLs
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="assigned_assignments")
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="teaching_assignments")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_assignments")
    class_ = relationship("Class", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment")
    ai_generation = relationship("AIAssignment", back_populates="assignment", uselist=False)

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_assignment_teacher', 'teacher_id'),
        Index('idx_assignment_class', 'class_id'),
        Index('idx_assignment_due_date', 'due_date'),
        Index('idx_assignment_status', 'status'),
    ) 