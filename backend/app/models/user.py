from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import Boolean, Column, Integer, String, Index, DateTime, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[Optional[str]] = mapped_column(String)
    bio: Mapped[Optional[str]] = mapped_column(String)
    location: Mapped[Optional[str]] = mapped_column(String)
    website: Mapped[Optional[str]] = mapped_column(String)
    preferences: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    two_factor_secret: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    backup_codes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)  # Store hashed backup codes
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    account_locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    password_history: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)  # Store last N password hashes
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)



    # OAuth Integration
    oauth_provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    oauth_access_token: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    oauth_refresh_token: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    oauth_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Add composite index for common queries
    __table_args__ = (
        Index('idx_user_active', 'is_active'),
    )

    # Relationships - minimal for basic authentication
    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="user")


    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.password_history = []


    def add_password_to_history(self, password_hash: str) -> None:
        """Add a password hash to the history"""
        if not self.password_history:
            self.password_history = []
        self.password_history.append({
            "hash": password_hash,
            "changed_at": datetime.utcnow()
        })
        # Keep only last 5 passwords
        if len(self.password_history) > 5:
            self.password_history.pop(0)

    def is_password_in_history(self, password_hash: str) -> bool:
        """Check if a password hash exists in history"""
        if not self.password_history:
            return False
        return any(p["hash"] == password_hash for p in self.password_history)

    def generate_verification_token(self) -> str:
        """Generate a verification token for email verification"""
        from app.core.security import create_access_token
        from datetime import timedelta
        return create_access_token(
            subject=self.id,
            expires_delta=timedelta(hours=24)
        )