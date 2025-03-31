from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.log import SystemLog
from app.schemas.log import SystemLogCreate

def create_log(db: Session, log: SystemLogCreate) -> SystemLog:
    db_log = SystemLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = None
) -> List[SystemLog]:
    query = db.query(SystemLog)
    if level:
        query = query.filter(SystemLog.level == level)
    return query.offset(skip).limit(limit).all()

def get_log(db: Session, log_id: int) -> Optional[SystemLog]:
    return db.query(SystemLog).filter(SystemLog.id == log_id).first()

def delete_log(db: Session, log_id: int) -> bool:
    log = get_log(db, log_id)
    if log:
        db.delete(log)
        db.commit()
        return True
    return False 