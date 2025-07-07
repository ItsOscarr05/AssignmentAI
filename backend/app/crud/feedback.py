from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate

def get_feedback(db: Session, feedback_id: int) -> Optional[Feedback]:
    return db.query(Feedback).filter(Feedback.id == feedback_id).first()

def get_feedbacks(db: Session, skip: int = 0, limit: int = 100) -> List[Feedback]:
    return db.query(Feedback).offset(skip).limit(limit).all()

def get_feedbacks_count(db: Session) -> int:
    return db.query(Feedback).count()

def get_feedback_by_submission(db: Session, submission_id: int) -> List[Feedback]:
    return db.query(Feedback).filter(Feedback.submission_id == submission_id).all()

def get_feedback_by_user(db: Session, user_id: int) -> List[Feedback]:
    return db.query(Feedback).join(Feedback.submission).filter(Feedback.submission.has(user_id=user_id)).all()

def create_feedback(db: Session, feedback: FeedbackCreate) -> Feedback:
    db_feedback = Feedback(**feedback.model_dump())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def update_feedback(db: Session, feedback_id: int, feedback: FeedbackUpdate) -> Optional[Feedback]:
    db_feedback = get_feedback(db, feedback_id)
    if not db_feedback:
        return None
    
    for field, value in feedback.model_dump(exclude_unset=True).items():
        setattr(db_feedback, field, value)
    
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def delete_feedback(db: Session, feedback_id: int) -> bool:
    db_feedback = get_feedback(db, feedback_id)
    if not db_feedback:
        return False
    
    db.delete(db_feedback)
    db.commit()
    return True 