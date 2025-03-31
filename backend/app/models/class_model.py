from sqlalchemy import Column, String, Integer, ForeignKey, Table, Index
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

# Association table for class members
class_members = Table(
    'class_members',
    BaseModel.metadata,
    Column('class_id', Integer, ForeignKey('classes.id')),
    Column('user_id', Integer, ForeignKey('users.id')),
    Index('idx_class_members', 'class_id', 'user_id', unique=True)
)

class Class(BaseModel):
    __tablename__ = "classes"

    name = Column(String, nullable=False)
    description = Column(String)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    teacher = relationship("User", back_populates="classes")
    students = relationship("User", secondary=class_members, back_populates="enrolled_classes")
    assignments = relationship("Assignment", back_populates="class_")

    # Add indexes for common queries
    __table_args__ = (
        Index('idx_class_teacher', 'teacher_id'),
        Index('idx_class_name', 'name'),
    ) 