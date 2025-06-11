from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationFilter

def create_notification(db: Session, notification: NotificationCreate) -> Notification:
    db_notification = Notification(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_notification(db: Session, notification_id: str) -> Optional[Notification]:
    return db.query(Notification).filter(Notification.id == notification_id).first()

def get_user_notifications(
    db: Session,
    user_id: str,
    filter_params: Optional[NotificationFilter] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Notification]:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if filter_params:
        if filter_params.type:
            query = query.filter(Notification.type == filter_params.type)
        if filter_params.is_read is not None:
            query = query.filter(Notification.is_read == filter_params.is_read)
        if filter_params.is_archived is not None:
            query = query.filter(Notification.is_archived == filter_params.is_archived)
        if filter_params.start_date:
            query = query.filter(Notification.created_at >= filter_params.start_date)
        if filter_params.end_date:
            query = query.filter(Notification.created_at <= filter_params.end_date)
    
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def update_notification(
    db: Session,
    notification_id: str,
    notification_update: NotificationUpdate
) -> Optional[Notification]:
    db_notification = get_notification(db, notification_id)
    if not db_notification:
        return None
    
    update_data = notification_update.model_dump(exclude_unset=True)
    
    # Update read_at timestamp if marking as read
    if update_data.get("is_read") and not db_notification.is_read:
        update_data["read_at"] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_notification, field, value)
    
    db.commit()
    db.refresh(db_notification)
    return db_notification

def delete_notification(db: Session, notification_id: str) -> bool:
    db_notification = get_notification(db, notification_id)
    if not db_notification:
        return False
    
    db.delete(db_notification)
    db.commit()
    return True

def mark_all_as_read(db: Session, user_id: str) -> int:
    result = db.query(Notification).filter(
        and_(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    db.commit()
    return result

def archive_all_read(db: Session, user_id: str) -> int:
    result = db.query(Notification).filter(
        and_(
            Notification.user_id == user_id,
            Notification.is_read == True,
            Notification.is_archived == False
        )
    ).update({"is_archived": True})
    db.commit()
    return result

def get_unread_count(db: Session, user_id: str) -> int:
    return db.query(Notification).filter(
        and_(
            Notification.user_id == user_id,
            Notification.is_read == False,
            Notification.is_archived == False
        )
    ).count()

def cleanup_expired_notifications(db: Session, days: int = 30) -> int:
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    result = db.query(Notification).filter(
        or_(
            Notification.expires_at < datetime.utcnow(),
            Notification.created_at < cutoff_date
        )
    ).delete()
    db.commit()
    return result 