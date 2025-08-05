from typing import List
from sqlalchemy import Column, Integer, String, Table
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base

# Association table for many-to-many relationship between classes and students
class_members = Table(
    'class_members',
    Base.metadata,
    Column('class_id', Integer, primary_key=True),
    Column('student_id', Integer, primary_key=True)
)

class Class(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String)
    teacher_id: Mapped[int] = mapped_column(Integer, nullable=False) 