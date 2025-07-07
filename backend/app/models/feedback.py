from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON, Index
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base_class import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    feedback_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Type of feedback (general, grammar, content, structure, technical)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # AI model's confidence in the feedback
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # For storing additional feedback data
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    submission_id: Mapped[int] = mapped_column(Integer, ForeignKey("submissions.id"), nullable=False)
    
    # Relationships
    submission: Mapped["Submission"] = relationship("Submission", back_populates="ai_feedback")

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_feedback_submission', 'submission_id'),
        Index('idx_feedback_date', 'created_at'),
        Index('idx_feedback_type', 'feedback_type'),
    ) 