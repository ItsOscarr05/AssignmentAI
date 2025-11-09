from sqlalchemy import Column, Integer, String, DateTime, JSON, Index
from sqlalchemy.sql import func
from app.db.base_class import Base


class Activity(Base):
    __tablename__ = "activities"

    id: int = Column(Integer, primary_key=True, index=True)
    user_id: int = Column(Integer, nullable=False, index=True)
    action: str = Column(String(255), nullable=False, index=True)
    resource_type: str = Column(String(100), nullable=True, index=True)
    resource_id: str = Column(String(100), nullable=True, index=True)
    activity_metadata: dict = Column(JSON, nullable=True)
    ip_address: str = Column(String(64), nullable=True)
    user_agent: str = Column(String(512), nullable=True)
    created_at: DateTime = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_activity_resource", "resource_type", "resource_id"),
    )