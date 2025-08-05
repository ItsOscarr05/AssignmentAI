from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, Text, DateTime, JSON, Index, String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base

class AIAssignment(Base):
    __tablename__ = "ai_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_model_used: Mapped[str] = mapped_column(String(100), nullable=False)
    generation_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    generated_content: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    generation_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # For storing additional generation data
    processing_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Time taken to generate in seconds
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Number of tokens consumed
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Cost of generation
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_ai_assignment_assignment', 'assignment_id'),
        Index('idx_ai_assignment_model', 'ai_model_used'),
        Index('idx_ai_assignment_created', 'created_at'),
    ) 