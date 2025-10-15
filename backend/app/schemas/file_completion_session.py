"""
Pydantic schemas for File Completion Sessions
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class FileCompletionSessionCreate(BaseModel):
    """Schema for creating a new file completion session"""
    file_id: int = Field(..., description="ID of the file to complete")
    initial_prompt: Optional[str] = Field(None, description="Initial prompt from user")


class FileCompletionMessage(BaseModel):
    """Schema for a message in the file completion chat"""
    message: str = Field(..., description="User's message")
    apply_changes: bool = Field(False, description="Whether to apply changes immediately")


class ApplyChangesRequest(BaseModel):
    """Schema for applying changes"""
    new_content: str = Field(..., description="New content to apply")
    description: Optional[str] = Field(None, description="Description of changes")


class RevertVersionRequest(BaseModel):
    """Schema for reverting to a version"""
    version_index: int = Field(..., description="Index of version to revert to")


class MessageResponse(BaseModel):
    """Response after sending a message"""
    role: str
    content: str
    timestamp: str
    metadata: Dict[str, Any] = {}


class VersionInfo(BaseModel):
    """Information about a version"""
    content: str
    description: str
    timestamp: str
    message_count: int


class SessionResponse(BaseModel):
    """Response with session information"""
    id: int
    session_token: str
    status: str
    original_filename: str
    file_type: str
    current_content: Optional[str] = None
    model_used: Optional[str] = None
    conversation_history: List[Dict[str, Any]] = []
    version_history: List[Dict[str, Any]] = []
    total_tokens_used: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class ChatMessageResponse(BaseModel):
    """Response after sending a chat message"""
    session_id: int
    ai_response: str
    proposed_changes: Dict[str, Any]
    current_content: Optional[str] = None
    tokens_used: int
    total_tokens: int
    version_count: int


class ApplyChangesResponse(BaseModel):
    """Response after applying changes"""
    session_id: int
    version_count: int
    current_content: Optional[str] = None
    message: str


class CompleteSessionResponse(BaseModel):
    """Response after completing a session"""
    session_id: int
    status: str
    final_content: Optional[str] = None
    total_versions: int
    total_messages: int
    total_tokens_used: int

