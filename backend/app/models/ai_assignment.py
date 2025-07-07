from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, JSON, Index, String, Float
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.base_class import Base

class AIAssignment(Base):
    __tablename__ = "ai_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assignments.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)  # The prompt used to generate the assignment
    model: Mapped[str] = mapped_column(String(50), nullable=False)  # AI model used (e.g., gpt-4)
    max_tokens: Mapped[int] = mapped_column(Integer, nullable=False)  # Maximum tokens for generation
    temperature: Mapped[float] = mapped_column(Float, nullable=False)  # Temperature for generation
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # Status of generation
    generated_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # The AI-generated assignment content
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # When generation completed
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)  # Version of the AI model used
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # AI model's confidence in the generation
    generation_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # Additional generation data
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="ai_generation")

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_ai_assignment_assignment', 'assignment_id'),
        Index('idx_ai_assignment_user', 'user_id'),
        Index('idx_ai_assignment_date', 'generated_at'),
        Index('idx_ai_assignment_model', 'model_version'),
        Index('idx_ai_assignment_status', 'status'),
    ) 