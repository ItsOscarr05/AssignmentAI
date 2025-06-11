from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Float, String
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.src.database import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    grade = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="feedback")
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="given_feedback")
    student = relationship("User", foreign_keys=[student_id], back_populates="received_feedback")
    rubric_feedback = relationship("RubricFeedback", back_populates="feedback", cascade="all, delete-orphan")

class RubricFeedback(Base):
    __tablename__ = "rubric_feedback"

    id = Column(Integer, primary_key=True, index=True)
    criterion = Column(String(255), nullable=False)
    score = Column(Float, nullable=False)
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    feedback_id = Column(Integer, ForeignKey("feedback.id"), nullable=False)
    
    # Relationships
    feedback = relationship("Feedback", back_populates="rubric_feedback") 