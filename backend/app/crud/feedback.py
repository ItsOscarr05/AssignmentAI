from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate

async def get_feedback(db: AsyncSession, feedback_id: int) -> Optional[Feedback]:
    result = await db.execute(select(Feedback).filter(Feedback.id == feedback_id))
    return result.scalar_one_or_none()

async def get_feedback_by_submission(db: AsyncSession, submission_id: int) -> List[Feedback]:
    result = await db.execute(select(Feedback).filter(Feedback.submission_id == submission_id))
    return result.scalars().all()

async def create_feedback(db: AsyncSession, feedback: FeedbackCreate) -> Feedback:
    db_feedback = Feedback(**feedback.model_dump())
    db.add(db_feedback)
    await db.commit()
    await db.refresh(db_feedback)
    return db_feedback

async def update_feedback(db: AsyncSession, feedback_id: int, feedback: FeedbackUpdate) -> Optional[Feedback]:
    db_feedback = await get_feedback(db, feedback_id)
    if not db_feedback:
        return None
    
    for field, value in feedback.model_dump(exclude_unset=True).items():
        setattr(db_feedback, field, value)
    
    await db.commit()
    await db.refresh(db_feedback)
    return db_feedback

async def delete_feedback(db: AsyncSession, feedback_id: int) -> bool:
    db_feedback = await get_feedback(db, feedback_id)
    if not db_feedback:
        return False
    
    await db.delete(db_feedback)
    await db.commit()
    return True 