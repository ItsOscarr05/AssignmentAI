from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import notification as notification_crud
from app.schemas.notification import (
    Notification,
    NotificationCreate,
    NotificationUpdate,
    NotificationFilter
)
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Notification])
def get_notifications(
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user),
    filter_params: NotificationFilter = Depends(),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """
    Get all notifications for the current user.
    """
    return notification_crud.get_user_notifications(
        db=db,
        user_id=current_user.id,
        filter_params=filter_params,
        skip=skip,
        limit=limit
    )

@router.get("/unread/count")
def get_unread_count(
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Get count of unread notifications for the current user.
    """
    return {"count": notification_crud.get_unread_count(db, current_user.id)}

@router.get("/{notification_id}", response_model=Notification)
def get_notification(
    notification_id: str,
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Get a specific notification.
    """
    notification = notification_crud.get_notification(db, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@router.post("/", response_model=Notification)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new notification.
    """
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create notifications for other users")
    return notification_crud.create_notification(db, notification)

@router.patch("/{notification_id}", response_model=Notification)
def update_notification(
    notification_id: str,
    notification_update: NotificationUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Update a notification.
    """
    notification = notification_crud.get_notification(db, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification_crud.update_notification(db, notification_id, notification_update)

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete a notification.
    """
    notification = notification_crud.get_notification(db, notification_id)
    if not notification or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification_crud.delete_notification(db, notification_id):
        return {"message": "Notification deleted successfully"}
    raise HTTPException(status_code=500, detail="Failed to delete notification")

@router.post("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Mark all notifications as read for the current user.
    """
    count = notification_crud.mark_all_as_read(db, current_user.id)
    return {"message": f"Marked {count} notifications as read"}

@router.post("/archive-read")
def archive_read_notifications(
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Archive all read notifications for the current user.
    """
    count = notification_crud.archive_all_read(db, current_user.id)
    return {"message": f"Archived {count} notifications"}

@router.delete("/cleanup")
def cleanup_notifications(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(deps.get_db),
    current_user = Depends(get_current_user)
):
    """
    Clean up expired notifications.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to cleanup notifications")
    count = notification_crud.cleanup_expired_notifications(db, days)
    return {"message": f"Cleaned up {count} notifications"} 