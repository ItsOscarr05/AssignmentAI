from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.ai_assignment import AIAssignment
from app.schemas.ai_assignment import AIAssignmentCreate, AIAssignmentUpdate

def get_ai_assignment(db: Session, ai_assignment_id: int) -> Optional[AIAssignment]:
    return db.query(AIAssignment).filter(AIAssignment.id == ai_assignment_id).first()

def get_ai_assignment_by_assignment(db: Session, assignment_id: int) -> List[AIAssignment]:
    return db.query(AIAssignment).filter(AIAssignment.assignment_id == assignment_id).all()

def create_ai_assignment(db: Session, ai_assignment: AIAssignmentCreate) -> AIAssignment:
    db_ai_assignment = AIAssignment(**ai_assignment.model_dump())
    db.add(db_ai_assignment)
    db.commit()
    db.refresh(db_ai_assignment)
    return db_ai_assignment

def update_ai_assignment(db: Session, ai_assignment_id: int, ai_assignment: AIAssignmentUpdate) -> Optional[AIAssignment]:
    db_ai_assignment = get_ai_assignment(db, ai_assignment_id)
    if not db_ai_assignment:
        return None
    
    for field, value in ai_assignment.model_dump(exclude_unset=True).items():
        setattr(db_ai_assignment, field, value)
    
    db.commit()
    db.refresh(db_ai_assignment)
    return db_ai_assignment

def delete_ai_assignment(db: Session, ai_assignment_id: int) -> bool:
    db_ai_assignment = get_ai_assignment(db, ai_assignment_id)
    if not db_ai_assignment:
        return False
    
    db.delete(db_ai_assignment)
    db.commit()
    return True 