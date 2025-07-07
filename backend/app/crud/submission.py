from typing import Any, Dict, Optional, Union, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, select, func
from app.crud.base import CRUDBase
from app.models.submission import Submission, SubmissionStatus
from app.schemas.submission import SubmissionCreate, SubmissionUpdate

class CRUDSubmission(CRUDBase[Submission, SubmissionCreate, SubmissionUpdate]):
    async def get_by_user(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> list[Submission]:
        result = await db.execute(
            select(self.model)
            .filter(Submission.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_assignment(
        self, db: AsyncSession, *, assignment_id: int, skip: int = 0, limit: int = 100
    ) -> list[Submission]:
        result = await db.execute(
            select(self.model)
            .filter(Submission.assignment_id == assignment_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_with_user(
        self, db: AsyncSession, *, obj_in: SubmissionCreate, user_id: int
    ) -> Submission:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update_status(
        self, db: AsyncSession, *, submission_id: int, status: str
    ) -> Optional[Submission]:
        submission = await self.get(db, id=submission_id)
        if not submission:
            return None
        submission.status = status
        db.add(submission)
        await db.commit()
        await db.refresh(submission)
        return submission

# Synchronous versions for use with regular sessions
def get_by_user_sync(db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> list[Submission]:
    return db.query(Submission).filter(Submission.user_id == user_id).offset(skip).limit(limit).all()

def get_by_assignment_sync(db: Session, *, assignment_id: int, skip: int = 0, limit: int = 100) -> list[Submission]:
    return db.query(Submission).filter(Submission.assignment_id == assignment_id).offset(skip).limit(limit).all()

def get_sync(db: Session, id: int) -> Optional[Submission]:
    return db.query(Submission).filter(Submission.id == id).first()

def create_with_user_sync(db: Session, *, obj_in: SubmissionCreate, user_id: int) -> Submission:
    obj_in_data = obj_in.model_dump()
    db_obj = Submission(**obj_in_data, user_id=user_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_sync(db: Session, *, db_obj: Submission, obj_in: Union[SubmissionUpdate, Dict[str, Any]]) -> Submission:
    obj_data = db_obj.__dict__
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    for field in obj_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_sync(db: Session, *, id: int) -> Submission:
    obj = get_sync(db, id)
    db.delete(obj)
    db.commit()
    return obj

async def create_submission(
    db: AsyncSession,
    submission: SubmissionCreate,
    assignment_id: int,
    student_id: int
) -> Submission:
    db_submission = Submission(
        **submission.model_dump(),
        assignment_id=assignment_id,
        student_id=student_id
    )
    db.add(db_submission)
    await db.commit()
    await db.refresh(db_submission)
    return db_submission

async def get_submissions(
    db: AsyncSession,
    assignment_id: int,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "submitted_at",
    sort_order: str = "desc",
    status: Optional[SubmissionStatus] = None
) -> List[Submission]:
    query = select(Submission).filter(Submission.assignment_id == assignment_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    if sort_order == "desc":
        query = query.order_by(desc(getattr(Submission, sort_by)))
    else:
        query = query.order_by(asc(getattr(Submission, sort_by)))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_submissions_count(
    db: AsyncSession,
    assignment_id: int,
    status: Optional[SubmissionStatus] = None
) -> int:
    query = select(Submission).filter(Submission.assignment_id == assignment_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    result = await db.execute(select(func.count()).select_from(query.subquery()))
    return result.scalar_one()

async def get_student_submissions(
    db: AsyncSession,
    student_id: int,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "submitted_at",
    sort_order: str = "desc",
    status: Optional[SubmissionStatus] = None
) -> List[Submission]:
    query = select(Submission).filter(Submission.student_id == student_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    if sort_order == "desc":
        query = query.order_by(desc(getattr(Submission, sort_by)))
    else:
        query = query.order_by(asc(getattr(Submission, sort_by)))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_student_submissions_count(
    db: AsyncSession,
    student_id: int,
    status: Optional[SubmissionStatus] = None
) -> int:
    query = select(Submission).filter(Submission.student_id == student_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    result = await db.execute(select(func.count()).select_from(query.subquery()))
    return result.scalar_one()

# Synchronous versions
def get_submissions_sync(
    db: Session,
    assignment_id: int,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "submitted_at",
    sort_order: str = "desc",
    status: Optional[SubmissionStatus] = None
) -> List[Submission]:
    query = db.query(Submission).filter(Submission.assignment_id == assignment_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    if sort_order == "desc":
        query = query.order_by(desc(getattr(Submission, sort_by)))
    else:
        query = query.order_by(asc(getattr(Submission, sort_by)))
    
    return query.offset(skip).limit(limit).all()

def get_submissions_count_sync(
    db: Session,
    assignment_id: int,
    status: Optional[SubmissionStatus] = None
) -> int:
    query = db.query(Submission).filter(Submission.assignment_id == assignment_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    return query.count()

def get_student_submissions_sync(
    db: Session,
    student_id: int,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "submitted_at",
    sort_order: str = "desc",
    status: Optional[SubmissionStatus] = None
) -> List[Submission]:
    query = db.query(Submission).filter(Submission.student_id == student_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    if sort_order == "desc":
        query = query.order_by(desc(getattr(Submission, sort_by)))
    else:
        query = query.order_by(asc(getattr(Submission, sort_by)))
    
    return query.offset(skip).limit(limit).all()

def get_student_submissions_count_sync(
    db: Session,
    student_id: int,
    status: Optional[SubmissionStatus] = None
) -> int:
    query = db.query(Submission).filter(Submission.student_id == student_id)
    
    if status:
        query = query.filter(Submission.status == status)
    
    return query.count()

submission = CRUDSubmission(Submission) 