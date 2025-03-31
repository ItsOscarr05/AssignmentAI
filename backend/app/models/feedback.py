from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON, Index, String, Float
from sqlalchemy.orm import relationship
from app.models.base import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    generated_at = Column(DateTime, nullable=False)
    feedback_type = Column(String(50), nullable=False)  # e.g., "grammar", "content", "structure"
    confidence_score = Column(Float, nullable=True)  # AI model's confidence in the feedback
    metadata = Column(JSON, nullable=True)  # Additional feedback data
    
    # Foreign Keys
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    
    # Relationships
    submission = relationship("Submission", back_populates="ai_feedback")

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_feedback_submission', 'submission_id'),
        Index('idx_feedback_type', 'feedback_type'),
        Index('idx_feedback_date', 'generated_at'),
    ) 