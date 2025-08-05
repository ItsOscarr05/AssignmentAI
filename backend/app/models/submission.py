from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, Index, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base
import enum

class SubmissionStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    LATE = "late"
    GRADED = "graded"
    RETURNED = "returned"

class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text)
    file_path: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[SubmissionStatus] = mapped_column(Enum(SubmissionStatus), nullable=False, default=SubmissionStatus.SUBMITTED)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submission_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # For storing additional submission data
    attachments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of file URLs
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    graded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Foreign Keys (without constraints)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    assignment_id: Mapped[int] = mapped_column(Integer, nullable=False)

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_submission_assignment', 'assignment_id'),
        Index('idx_submission_student', 'user_id'),
        Index('idx_submission_date', 'submitted_at'),
    ) 