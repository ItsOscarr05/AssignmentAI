from typing import List, Optional, Any, Dict, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.assignment import Assignment
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate

class CRUDAssignment(CRUDBase[Assignment, AssignmentCreate, AssignmentUpdate]):
    def get_by_teacher(
        self, db: Session, *, teacher_id: int, skip: int = 0, limit: int = 100
    ) -> List[Assignment]:
        return (
            db.query(self.model)
            .filter(Assignment.teacher_id == teacher_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_assignments(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Assignment]:
        return (
            db.query(self.model)
            .filter(Assignment.status == "published")
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> list[Assignment]:
        return (
            db.query(self.model)
            .filter(Assignment.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_user(
        self, db: Session, *, obj_in: AssignmentCreate, user_id: int
    ) -> Assignment:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def duplicate(
        self, db: Session, *, assignment_id: int, user_id: int, title: str
    ) -> Assignment:
        assignment = self.get(db, id=assignment_id)
        if not assignment or assignment.user_id != user_id:
            return None
        
        # Create a copy of the assignment
        new_assignment = Assignment(
            title=title,
            subject=assignment.subject,
            grade_level=assignment.grade_level,
            assignment_type=assignment.assignment_type,
            topic=assignment.topic,
            difficulty=assignment.difficulty,
            estimated_time=assignment.estimated_time,
            additional_requirements=assignment.additional_requirements,
            description=assignment.description,
            max_score=assignment.max_score,
            status=assignment.status,
            is_active=assignment.is_active,
            user_id=user_id
        )
        db.add(new_assignment)
        db.commit()
        db.refresh(new_assignment)
        return new_assignment

assignment = CRUDAssignment(Assignment) 