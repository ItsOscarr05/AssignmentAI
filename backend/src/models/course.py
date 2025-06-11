from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.src.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    teacher = relationship("User", back_populates="courses")
    students = relationship("User", secondary="course_enrollments", back_populates="enrolled_courses")
    assignments = relationship("Assignment", back_populates="course") 