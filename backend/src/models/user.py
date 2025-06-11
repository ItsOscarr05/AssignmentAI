from sqlalchemy import Column, Integer, String, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.src.database import Base
from datetime import datetime

# Association table for course enrollments
course_enrollments = Table(
    "course_enrollments",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(20), nullable=False)  # student, teacher, admin
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    courses = relationship("Course", secondary=course_enrollments, back_populates="students")
    assignments = relationship("Assignment", back_populates="teacher")
    submissions = relationship("Submission", back_populates="student")
    given_feedback = relationship("Feedback", foreign_keys="[Feedback.teacher_id]", back_populates="teacher")
    received_feedback = relationship("Feedback", foreign_keys="[Feedback.student_id]", back_populates="student")
    attachments = relationship("Attachment", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan") 