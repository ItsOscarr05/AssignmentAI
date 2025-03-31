from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.submission import Submission
from app.schemas.submission import SubmissionCreate, SubmissionUpdate

class CRUDSubmission(CRUDBase[Submission, SubmissionCreate, SubmissionUpdate]):
    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> list[Submission]:
        return (
            db.query(self.model)
            .filter(Submission.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_assignment(
        self, db: Session, *, assignment_id: int, skip: int = 0, limit: int = 100
    ) -> list[Submission]:
        return (
            db.query(self.model)
            .filter(Submission.assignment_id == assignment_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_user(
        self, db: Session, *, obj_in: SubmissionCreate, user_id: int
    ) -> Submission:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_status(
        self, db: Session, *, submission_id: int, status: str
    ) -> Optional[Submission]:
        submission = self.get(db, id=submission_id)
        if not submission:
            return None
        submission.status = status
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission

submission = CRUDSubmission(Submission) 