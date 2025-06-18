from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "login", "logout", "create_assignment", etc.
    resource_type = Column(String)  # e.g., "assignment", "submission", "comment", etc.
    resource_id = Column(String)  # ID of the affected resource
    activity_metadata = Column(JSON)  # Additional context about the activity
    ip_address = Column(String)
    user_agent = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="activities") 