"""
File Completion Session Model
Tracks interactive chat sessions for file completion
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base


class SessionStatus(str, enum.Enum):
    """Status of a file completion session"""
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class FileCompletionSession(Base):
    """
    Tracks an interactive file completion session
    Enables iterative, chat-based file completion
    """
    __tablename__ = "file_completion_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_id = Column(Integer, ForeignKey("file_uploads.id"), nullable=True, index=True)
    
    # Session metadata
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False)
    
    # File information
    original_filename = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    
    # Content tracking
    original_content = Column(Text, nullable=True)  # Initial file content
    current_content = Column(Text, nullable=True)   # Latest version
    
    # Conversation history (array of message objects)
    conversation_history = Column(JSON, default=list, nullable=False)
    
    # Version history (array of content snapshots)
    version_history = Column(JSON, default=list, nullable=False)
    
    # AI model used
    model_used = Column(String(100), nullable=True)
    
    # Token usage tracking
    total_tokens_used = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="file_completion_sessions")
    file_upload = relationship("FileUpload", back_populates="completion_sessions")
    
    def add_message(self, role: str, content: str, metadata: dict = None):
        """Add a message to conversation history"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        if self.conversation_history is None:
            self.conversation_history = []
        self.conversation_history.append(message)
    
    def save_version(self, content: str, description: str = None):
        """Save a version snapshot"""
        version = {
            "content": content,
            "description": description or f"Version {len(self.version_history) + 1}",
            "timestamp": datetime.utcnow().isoformat(),
            "message_count": len(self.conversation_history) if self.conversation_history else 0
        }
        if self.version_history is None:
            self.version_history = []
        self.version_history.append(version)
        self.current_content = content
    
    def get_latest_version(self):
        """Get the latest version snapshot"""
        if self.version_history and len(self.version_history) > 0:
            return self.version_history[-1]
        return None
    
    def mark_completed(self):
        """Mark session as completed"""
        self.status = SessionStatus.COMPLETED
        self.completed_at = datetime.utcnow()
    
    def mark_abandoned(self):
        """Mark session as abandoned"""
        self.status = SessionStatus.ABANDONED

