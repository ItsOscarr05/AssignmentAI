"""
File Completion Chat API Endpoints
Interactive, chat-based file completion
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.services.interactive_file_completion_service import InteractiveFileCompletionService
from app.schemas.file_completion_session import (
    FileCompletionSessionCreate,
    FileCompletionMessage,
    ApplyChangesRequest,
    RevertVersionRequest,
    SessionResponse,
    ChatMessageResponse,
    ApplyChangesResponse,
    CompleteSessionResponse,
    VersionInfo
)
from app.core.logger import logger

router = APIRouter()


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_file_completion_session(
    session_data: FileCompletionSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new interactive file completion session
    
    This creates a chat-based session where users can iteratively refine file completions.
    """
    try:
        logger.info(f"Creating file completion session for user {current_user.id}, file_id: {session_data.file_id}")
        service = InteractiveFileCompletionService(db)
        session = await service.start_session(
            user_id=current_user.id,
            file_id=session_data.file_id,
            initial_prompt=session_data.initial_prompt
        )
        
        return SessionResponse(
            id=session.id,
            session_token=session.session_token,
            status=session.status.value,
            original_filename=session.original_filename,
            file_type=session.file_type,
            current_content=session.current_content,
            model_used=session.model_used,
            conversation_history=session.conversation_history or [],
            version_history=session.version_history or [],
            total_tokens_used=session.total_tokens_used,
            created_at=session.created_at,
            updated_at=session.updated_at
        )
    
    except ValueError as e:
        logger.error(f"ValueError creating file completion session: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating file completion session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create file completion session"
        )


@router.get("/sessions", response_model=List[SessionResponse])
async def get_file_completion_sessions(
    file_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get file completion sessions for the current user
    Optionally filter by file_id
    """
    try:
        from app.models.file_completion_session import FileCompletionSession
        
        query = db.query(FileCompletionSession).filter(
            FileCompletionSession.user_id == current_user.id
        )
        
        if file_id:
            query = query.filter(FileCompletionSession.file_id == file_id)
        
        sessions = query.order_by(FileCompletionSession.created_at.desc()).all()
        
        return [
            SessionResponse(
                id=session.id,
                session_token=session.session_token,
                status=session.status.value,
                original_filename=session.original_filename,
                file_type=session.file_type,
                current_content=session.current_content,
                model_used=session.model_used,
                conversation_history=session.conversation_history or [],
                version_history=session.version_history or [],
                total_tokens_used=session.total_tokens_used,
                created_at=session.created_at,
                updated_at=session.updated_at
            )
            for session in sessions
        ]
    
    except Exception as e:
        logger.error(f"Error retrieving sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_file_completion_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a file completion session by ID
    """
    try:
        service = InteractiveFileCompletionService(db)
        session = await service.get_session(session_id, current_user.id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        return SessionResponse(
            id=session.id,
            session_token=session.session_token,
            status=session.status.value,
            original_filename=session.original_filename,
            file_type=session.file_type,
            current_content=session.current_content,
            model_used=session.model_used,
            conversation_history=session.conversation_history or [],
            version_history=session.version_history or [],
            total_tokens_used=session.total_tokens_used,
            created_at=session.created_at,
            updated_at=session.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session"
        )


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: int,
    message_data: FileCompletionMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message in the file completion chat
    
    The AI will respond with suggestions and proposed changes.
    Set apply_changes=true to automatically apply the suggested changes.
    """
    try:
        service = InteractiveFileCompletionService(db)
        result = await service.send_message(
            session_id=session_id,
            user_id=current_user.id,
            message=message_data.message,
            apply_changes=message_data.apply_changes
        )
        
        return ChatMessageResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending message in session {session_id}: {str(e)}")
        
        # Provide more detailed error messages based on the error type
        error_message = "Failed to process message"
        error_detail = str(e)
        
        # Check for specific OpenAI API errors
        if "temperature" in error_detail and "unsupported" in error_detail.lower():
            error_message = "The AI model configuration is incompatible. Please try again or contact support if the issue persists."
        elif "max_completion_tokens" in error_detail or "max_tokens" in error_detail:
            error_message = "Token limit exceeded. Please try a shorter message or contact support."
        elif "rate limit" in error_detail.lower():
            error_message = "AI service is temporarily busy. Please wait a moment and try again."
        elif "authentication" in error_detail.lower() or "unauthorized" in error_detail.lower():
            error_message = "AI service authentication failed. Please contact support."
        elif "network" in error_detail.lower() or "connection" in error_detail.lower():
            error_message = "Network connection issue. Please check your internet connection and try again."
        elif "timeout" in error_detail.lower():
            error_message = "Request timed out. The AI service is taking longer than expected. Please try again."
        else:
            # For other errors, provide a more helpful generic message
            error_message = "An unexpected error occurred while processing your message. Please try again or contact support if the issue persists."
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_message
        )


@router.post("/sessions/{session_id}/apply", response_model=ApplyChangesResponse)
async def apply_changes(
    session_id: int,
    changes: ApplyChangesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually apply changes to the file
    
    Use this to apply custom changes or AI-suggested changes.
    """
    try:
        service = InteractiveFileCompletionService(db)
        result = await service.apply_changes(
            session_id=session_id,
            user_id=current_user.id,
            new_content=changes.new_content,
            description=changes.description
        )
        
        return ApplyChangesResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error applying changes in session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply changes"
        )


@router.get("/sessions/{session_id}/versions", response_model=List[VersionInfo])
async def get_version_history(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get version history for a session
    """
    try:
        service = InteractiveFileCompletionService(db)
        versions = await service.get_version_history(session_id, current_user.id)
        
        return [VersionInfo(**version) for version in versions]
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving version history for session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve version history"
        )


@router.post("/sessions/{session_id}/revert", response_model=ApplyChangesResponse)
async def revert_to_version(
    session_id: int,
    revert_data: RevertVersionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revert to a previous version
    """
    try:
        service = InteractiveFileCompletionService(db)
        result = await service.revert_to_version(
            session_id=session_id,
            user_id=current_user.id,
            version_index=revert_data.version_index
        )
        
        return ApplyChangesResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error reverting session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revert to version"
        )


@router.post("/sessions/{session_id}/complete", response_model=CompleteSessionResponse)
async def complete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark session as completed and get final content
    """
    try:
        service = InteractiveFileCompletionService(db)
        result = await service.complete_session(session_id, current_user.id)
        
        return CompleteSessionResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing session {session_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete session"
        )

