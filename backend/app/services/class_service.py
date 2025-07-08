from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.class_model import Class
from app.models.user import User
from app.schemas.class_schema import ClassCreate, ClassUpdate

class ClassService:
    @staticmethod
    def create_class(db: Session, class_data: ClassCreate, teacher_id: int) -> Class:
        """Create a new class"""
        data = class_data.model_dump()
        data.pop('teacher_id', None)  # Remove teacher_id if present
        db_class = Class(**data, teacher_id=teacher_id)
        db.add(db_class)
        db.commit()
        db.refresh(db_class)
        return db_class

    @staticmethod
    def get_user_classes(db: Session, user_id: int) -> List[Class]:
        """Get all classes for a user (either as teacher or student)"""
        return db.query(Class).filter(
            (Class.teacher_id == user_id) | 
            (Class.students.any(User.id == user_id))
        ).all()

    @staticmethod
    def get_class(db: Session, class_id: int) -> Optional[Class]:
        """Get a class by ID"""
        return db.query(Class).filter(Class.id == class_id).first()

    @staticmethod
    def is_user_in_class(db: Session, class_id: int, user_id: int) -> bool:
        """Check if a user is in a class (either as teacher or student)"""
        class_ = ClassService.get_class(db, class_id)
        if not class_:
            return False
        return class_.teacher_id == user_id or any(student.id == user_id for student in class_.students)

    @staticmethod
    def update_class(db: Session, class_id: int, class_data: ClassUpdate) -> Optional[Class]:
        """Update a class"""
        db_class = ClassService.get_class(db, class_id)
        if not db_class:
            return None
        
        update_data = class_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_class, field, value)
        
        db.add(db_class)
        db.commit()
        db.refresh(db_class)
        return db_class

    @staticmethod
    def delete_class(db: Session, class_id: int) -> bool:
        """Delete a class"""
        db_class = ClassService.get_class(db, class_id)
        if not db_class:
            return False
        
        db.delete(db_class)
        db.commit()
        return True

    @staticmethod
    def add_student_to_class(db: Session, class_id: int, student_id: int) -> Optional[Class]:
        """Add a student to a class"""
        class_ = ClassService.get_class(db, class_id)
        if not class_:
            return None
        
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            return None
        
        if student in class_.students:
            return class_  # Student already in class
        
        class_.students.append(student)
        db.add(class_)
        db.commit()
        db.refresh(class_)
        return class_

    @staticmethod
    def remove_student_from_class(db: Session, class_id: int, student_id: int) -> Optional[Class]:
        """Remove a student from a class"""
        class_ = ClassService.get_class(db, class_id)
        if not class_:
            return None
        
        student = db.query(User).filter(User.id == student_id).first()
        if not student or student not in class_.students:
            return class_  # Student not in class
        
        class_.students.remove(student)
        db.add(class_)
        db.commit()
        db.refresh(class_)
        return class_ 