from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON, Index, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class SubmissionStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    LATE = "late"
    GRADED = "graded"
    RETURNED = "returned"

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    file_path = Column(String)
    status = Column(Enum(SubmissionStatus), nullable=False, default=SubmissionStatus.SUBMITTED)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submission_metadata = Column(JSON, nullable=True)  # For storing additional submission data
    attachments = Column(Text, nullable=True)  # JSON string of file URLs
    comments = Column(Text, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    
    # Relationships
    user = relationship("User")
    assignment = relationship("Assignment", back_populates="submissions")
    ai_feedback = relationship("Feedback", back_populates="submission")

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_submission_assignment', 'assignment_id'),
        Index('idx_submission_student', 'user_id'),
        Index('idx_submission_date', 'submitted_at'),
    ) 