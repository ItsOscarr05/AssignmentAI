from sqlalchemy import Column, Integer, String, DateTime, JSON, Boolean
from datetime import datetime

from app.db.base_class import Base

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    alert_type = Column(String, index=True)
    description = Column(String)
    severity = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    alert_metadata = Column(JSON, nullable=True)
    resolved = Column(Boolean, default=False)
    resolution_notes = Column(String, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String, index=True)
    resource_type = Column(String)
    resource_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

class TwoFactorSetup(Base):
    __tablename__ = "two_factor_setups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True)
    secret_key = Column(String)
    is_enabled = Column(Boolean, default=False)
    backup_codes = Column(JSON, nullable=True)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 