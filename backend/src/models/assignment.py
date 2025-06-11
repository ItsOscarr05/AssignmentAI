from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from backend.src.database import Base

class AssignmentStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SUBMITTED = "submitted"
    GRADED = "graded"
    LATE = "late"
    OVERDUE = "overdue"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Foreign keys
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Status and metadata
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DRAFT)
    max_score = Column(Integer, default=100)
    current_score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    
    # Relationships
    teacher = relationship("User", back_populates="assignments")
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment")
    attachments = relationship("Attachment", back_populates="assignment")
    feedback = relationship("Feedback", back_populates="assignment")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    content = Column(Text)
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
    attachments = relationship("SubmissionAttachment", back_populates="submission", cascade="all, delete-orphan")
    feedback_items = relationship("Feedback", back_populates="submission", cascade="all, delete-orphan")

class AssignmentAttachment(Base):
    __tablename__ = "assignment_attachments"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assignment = relationship("Assignment", back_populates="attachments")

class SubmissionAttachment(Base):
    __tablename__ = "submission_attachments"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("assignment_submissions.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    submission = relationship("AssignmentSubmission", back_populates="attachments") 