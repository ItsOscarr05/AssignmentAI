from typing import List, TYPE_CHECKING
from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

# Association table for many-to-many relationship between classes and students
class_members = Table(
    'class_members',
    Base.metadata,
    Column('class_id', Integer, ForeignKey('classes.id', ondelete='CASCADE'), primary_key=True),
    Column('student_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.assignment import Assignment

class Class(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String)
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False) 

    students: Mapped[List["User"]] = relationship(
        "User",
        secondary=class_members,
        back_populates="classes",
        cascade="all",
    )
    assignments: Mapped[List["Assignment"]] = relationship(
        "Assignment",
        back_populates="class_",
        cascade="all, delete-orphan"
    )
    teacher: Mapped["User"] = relationship(
        "User",
        foreign_keys=[teacher_id],
        back_populates="taught_classes",
    )