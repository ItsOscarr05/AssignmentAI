from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.assignment import Assignment
from app.models.class_model import Class
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate

class AssignmentService:
    @staticmethod
    def create_assignment(db: Session, assignment_data: AssignmentCreate, teacher_id: int) -> Assignment:
        """Create a new assignment"""
        # Verify class exists and teacher owns it
        class_obj = db.query(Class).filter(Class.id == assignment_data.class_id).first()
        if not class_obj:
            raise ValueError("Class not found")
        if class_obj.teacher_id != teacher_id:
            raise ValueError("Not enough permissions")

        assignment = Assignment()
        for key, value in assignment_data.model_dump().items():
            setattr(assignment, key, value)
        assignment.teacher_id = teacher_id
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def get_user_assignments(db: Session, user_id: int) -> List[Assignment]:
        """Get all assignments for a user (either as teacher or student)"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user is a teacher (has classes they teach)
        teacher_assignments = db.query(Assignment).filter(Assignment.teacher_id == user_id).all()
        if teacher_assignments:
            return teacher_assignments
        
        # If not a teacher, get assignments from classes where user is a student
        return db.query(Assignment).join(Class).join(Class.students).filter(User.id == user_id).all()

    @staticmethod
    def get_assignment(db: Session, assignment_id: int) -> Optional[Assignment]:
        """Get a specific assignment by ID"""
        return db.query(Assignment).filter(Assignment.id == assignment_id).first()

    @staticmethod
    def is_user_in_assignment_class(db: Session, assignment_id: int, user_id: int) -> bool:
        """Check if a user is in the class associated with an assignment"""
        assignment = AssignmentService.get_assignment(db, assignment_id)
        if not assignment:
            return False

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False

        # Check if user is the teacher of this assignment
        if assignment.teacher_id == user_id:
            return True
        
        # Check if user is a student in the class
        return user in assignment.class_.students

    @staticmethod
    def update_assignment(db: Session, assignment_id: int, assignment_data: AssignmentUpdate) -> Optional[Assignment]:
        """Update an assignment"""
        assignment = AssignmentService.get_assignment(db, assignment_id)
        if not assignment:
            return None

        for field, value in assignment_data.model_dump(exclude_unset=True).items():
            setattr(assignment, field, value)

        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def delete_assignment(db: Session, assignment_id: int) -> None:
        """Delete an assignment"""
        assignment = AssignmentService.get_assignment(db, assignment_id)
        if not assignment:
            raise ValueError("Assignment not found")

        db.delete(assignment)
        db.commit() 