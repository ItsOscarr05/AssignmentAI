from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, Enum, Index, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Add composite index for common queries
    __table_args__ = (
        Index('idx_user_role_active', 'role', 'is_active'),
    )

    # Relationships
    assignments = relationship("Assignment", back_populates="user")
    submissions = relationship("Submission", back_populates="user")
    classes_teaching = relationship("Class", back_populates="teacher")
    enrolled_classes = relationship("Class", secondary="class_members", back_populates="students") 