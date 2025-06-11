from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from database import Base

class NotificationType(str, enum.Enum):
    ASSIGNMENT_CREATED = "assignment_created"
    ASSIGNMENT_DUE = "assignment_due"
    ASSIGNMENT_SUBMITTED = "assignment_submitted"
    ASSIGNMENT_GRADED = "assignment_graded"
    FEEDBACK_RECEIVED = "feedback_received"
    SYSTEM = "system"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    data = Column(JSON, nullable=True)  # Additional data for the notification
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    async def create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a new notification
        
        Args:
            user_id: ID of the user to notify
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            data: Optional additional data
            
        Returns:
            Created notification object
        """
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            data=data
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    async def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:
        """
        Get notifications for a user
        
        Args:
            user_id: ID of the user
            unread_only: Whether to return only unread notifications
            limit: Maximum number of notifications to return
            
        Returns:
            List of notification objects
        """
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id
        )
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        return query.order_by(
            Notification.created_at.desc()
        ).limit(limit).all()

    async def mark_as_read(
        self,
        notification_id: int,
        user_id: int
    ) -> Notification:
        """
        Mark a notification as read
        
        Args:
            notification_id: ID of the notification
            user_id: ID of the user
            
        Returns:
            Updated notification object
        """
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            raise ValueError("Notification not found")
        
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    async def mark_all_as_read(
        self,
        user_id: int
    ) -> None:
        """
        Mark all notifications as read for a user
        
        Args:
            user_id: ID of the user
        """
        self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        self.db.commit()

    async def delete_notification(
        self,
        notification_id: int,
        user_id: int
    ) -> None:
        """
        Delete a notification
        
        Args:
            notification_id: ID of the notification
            user_id: ID of the user
        """
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if not notification:
            raise ValueError("Notification not found")
        
        self.db.delete(notification)
        self.db.commit() 