from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.log import SystemLog
from app.schemas.log import SystemLogCreate

async def create_log(db: AsyncSession, log: SystemLogCreate) -> SystemLog:
    db_log = SystemLog(**log.dict())
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

async def get_logs(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = None
) -> List[SystemLog]:
    query = select(SystemLog)
    if level:
        query = query.filter(SystemLog.level == level)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_log(db: AsyncSession, log_id: int) -> Optional[SystemLog]:
    result = await db.execute(select(SystemLog).filter(SystemLog.id == log_id))
    return result.scalar_one_or_none()

async def delete_log(db: AsyncSession, log_id: int) -> bool:
    log = await get_log(db, log_id)
    if log:
        await db.delete(log)
        await db.commit()
        return True
    return False

# Synchronous versions for testing
def get_logs_sync(
    db,
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = None
) -> List[SystemLog]:
    query = db.query(SystemLog)
    if level:
        query = query.filter(SystemLog.level == level)
    return query.offset(skip).limit(limit).all()

def delete_log_sync(db, log_id: int) -> bool:
    log = db.query(SystemLog).filter(SystemLog.id == log_id).first()
    if log:
        db.delete(log)
        db.commit()
        return True
    return False 