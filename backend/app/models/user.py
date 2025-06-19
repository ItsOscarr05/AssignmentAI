from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, Enum, Index, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
from app.models.token import Token
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String)
    hashed_password = Column(String(255), nullable=False)
    avatar = Column(String)
    bio = Column(String)
    location = Column(String)
    website = Column(String)
    preferences = Column(JSON)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    two_factor_secret = Column(String, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    backup_codes = Column(JSON, nullable=True)  # Store hashed backup codes
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime(timezone=True), nullable=True)
    password_history = Column(JSON, nullable=True)  # Store last N password hashes
    sessions = Column(JSON, nullable=True)  # Store active sessions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Canvas Integration
    canvas_access_token = Column(String, nullable=True)
    canvas_refresh_token = Column(String, nullable=True)
    canvas_user_id = Column(String, nullable=True)
    canvas_institution = Column(String, nullable=True)

    # Add composite index for common queries
    __table_args__ = (
        Index('idx_user_role_active', 'role', 'is_active'),
    )

    # Relationships
    created_assignments = relationship("Assignment", 
                                    foreign_keys="[Assignment.created_by_id]",
                                    back_populates="created_by")
    teaching_assignments = relationship("Assignment", 
                                     foreign_keys="[Assignment.teacher_id]",
                                     back_populates="teacher")
    assigned_assignments = relationship("Assignment", 
                                      foreign_keys="[Assignment.user_id]",
                                      back_populates="user")
    submissions = relationship("Submission", back_populates="user")
    classes_teaching = relationship("Class", back_populates="teacher")
    enrolled_classes = relationship("Class", secondary="class_members", back_populates="students")
    tokens = relationship("Token", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    assignments = relationship("Assignment", back_populates="user")
    files = relationship("File", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    citations = relationship("Citation", back_populates="user")
    templates = relationship("Template", back_populates="creator")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.sessions = []
        self.password_history = []

    def add_session(self, session_data: dict) -> None:
        """Add a new session to the user's active sessions"""
        if not self.sessions:
            self.sessions = []
        self.sessions.append(session_data)

    def remove_session(self, session_id: str) -> None:
        """Remove a session from the user's active sessions"""
        if self.sessions:
            self.sessions = [s for s in self.sessions if s["id"] != session_id]

    def clear_sessions(self) -> None:
        """Clear all active sessions"""
        self.sessions = []

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