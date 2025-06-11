from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.db.base_class import Base

# Association table for many-to-many relationship between classes and students
class_members = Table(
    'class_members',
    Base.metadata,
    Column('class_id', Integer, ForeignKey('classes.id'), primary_key=True),
    Column('student_id', Integer, ForeignKey('users.id'), primary_key=True)
)

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    teacher = relationship("User", back_populates="classes_teaching", foreign_keys=[teacher_id])
    students = relationship("User", secondary=class_members, back_populates="enrolled_classes")
    assignments = relationship("Assignment", back_populates="class_", cascade="all, delete-orphan") 