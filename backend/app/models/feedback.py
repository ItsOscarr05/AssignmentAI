from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    feedback_metadata = Column(JSON, nullable=True)  # For storing additional feedback data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    
    # Relationships
    submission = relationship("Submission", back_populates="ai_feedback")

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_feedback_submission', 'submission_id'),
        Index('idx_feedback_date', 'created_at'),
    ) 