from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Float, Index, Boolean
from sqlalchemy.orm import Mapped, mapped_column
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

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    grade_level: Mapped[str] = mapped_column(String(50), nullable=False)
    assignment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty: Mapped[DifficultyLevel] = mapped_column(Enum(DifficultyLevel), nullable=False)
    estimated_time: Mapped[int] = mapped_column(Integer, nullable=False)  # in minutes
    additional_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=100.0)
    status: Mapped[AssignmentStatus] = mapped_column(Enum(AssignmentStatus), default=AssignmentStatus.DRAFT)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    attachments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of file URLs
    created_by_id: Mapped[int] = mapped_column(Integer, nullable=False)
    teacher_id: Mapped[int] = mapped_column(Integer, nullable=False)
    class_id: Mapped[int] = mapped_column(Integer, nullable=False)

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_assignment_teacher', 'teacher_id'),
        Index('idx_assignment_class', 'class_id'),
        Index('idx_assignment_due_date', 'due_date'),
        Index('idx_assignment_status', 'status'),
    ) 