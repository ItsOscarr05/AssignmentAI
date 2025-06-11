from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON, Index, String, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class AIAssignment(Base):
    __tablename__ = "ai_assignments"

    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)  # The prompt used to generate the assignment
    generated_content = Column(Text, nullable=False)  # The AI-generated assignment content
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    model_version = Column(String(50), nullable=False)  # Version of the AI model used
    confidence_score = Column(Float, nullable=True)  # AI model's confidence in the generation
    generation_metadata = Column(JSON, nullable=True)  # Additional generation data
    
    # Foreign Keys
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="ai_generation")

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_ai_assignment_assignment', 'assignment_id'),
        Index('idx_ai_assignment_date', 'generated_at'),
        Index('idx_ai_assignment_model', 'model_version'),
    ) 