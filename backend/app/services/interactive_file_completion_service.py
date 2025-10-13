"""
Interactive File Completion Service
Enables chat-based, iterative file completion with real-time feedback
"""
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logger import logger
from app.core.token_enforcement import TokenEnforcementService, estimate_tokens_from_messages
from app.models.file_completion_session import FileCompletionSession, SessionStatus
from app.models.file_upload import FileUpload
from app.services.ai_service import AIService
from app.services.file_processing_service import FileProcessingService


class InteractiveFileCompletionService:
    """
    Service for interactive, chat-based file completion
    Allows users to iteratively refine file completions through conversation
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        # Create async session for AI service
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
        from sqlalchemy.pool import StaticPool
        
        # Create async engine from sync engine
        if hasattr(db_session.bind, 'url'):
            # Convert sync URL to async URL
            sync_url = str(db_session.bind.url)
            if sync_url.startswith('sqlite://'):
                async_url = sync_url.replace('sqlite://', 'sqlite+aiosqlite://')
            else:
                async_url = sync_url.replace('postgresql://', 'postgresql+asyncpg://')
            
            async_engine = create_async_engine(
                async_url,
                poolclass=StaticPool if 'sqlite' in async_url else None,
                echo=False
            )
            
            # Create a mock async session that uses the sync session
            class MockAsyncSession:
                def __init__(self, sync_session):
                    self._sync_session = sync_session
                    self.bind = async_engine
                
                def execute(self, statement):
                    # Return the result directly (not as a coroutine)
                    return self._sync_session.execute(statement)
                
                async def commit(self):
                    self._sync_session.commit()
                
                async def close(self):
                    pass
            
            mock_async_db = MockAsyncSession(db_session)
            self.ai_service = AIService(mock_async_db)
        else:
            # Fallback: create AI service without database enforcement
            self.ai_service = None
        
        self.file_processing_service = FileProcessingService(db_session)
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    def _get_user_model(self, user_id: int) -> str:
        """Get the AI model assigned to a user's subscription"""
        from app.models.subscription import Subscription, SubscriptionStatus
        from sqlalchemy import select
        
        try:
            result = self.db.execute(
                select(Subscription).filter(
                    Subscription.user_id == user_id,
                    Subscription.status == SubscriptionStatus.ACTIVE
                )
            )
            subscription = result.scalar_one_or_none()
            
            if not subscription:
                return "gpt-4o-mini"  # Default model for users without subscription
            
            return str(subscription.ai_model)
        except Exception as e:
            logger.warning(f"Failed to get user model for user {user_id}: {str(e)}")
            return "gpt-4o-mini"  # Default fallback
    
    async def _enforce_token_limit_sync(self, user_id: int, tokens_needed: int) -> None:
        """Enforce token limits using sync database session"""
        from app.models.subscription import Subscription, SubscriptionStatus
        from app.models.usage import Usage
        from sqlalchemy import select, func
        from datetime import datetime
        from fastapi import HTTPException, status
        
        try:
            # Get active subscription
            result = self.db.execute(
                select(Subscription).filter(
                    Subscription.user_id == user_id,
                    Subscription.status == SubscriptionStatus.ACTIVE
                )
            )
            subscription = result.scalar_one_or_none()
            
            # Get token limit from subscription or use free plan default
            if subscription and subscription.token_limit:
                token_limit = int(subscription.token_limit)
            else:
                token_limit = settings.AI_TOKEN_LIMITS.get("free", 100000)
            
            # Calculate start of current month
            now = datetime.utcnow()
            start_of_month = datetime(now.year, now.month, 1)
            
            # Sum tokens used this month
            result = self.db.execute(
                select(func.sum(Usage.tokens_used)).filter(
                    Usage.user_id == user_id,
                    Usage.timestamp >= start_of_month
                )
            )
            tokens_used_result = result.scalar_one()
            tokens_used = int(tokens_used_result) if tokens_used_result is not None else 0
            
            # Check if adding tokens needed would exceed limit
            total_tokens = tokens_used + tokens_needed
            
            if total_tokens > token_limit:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Token limit exceeded: {total_tokens} / {token_limit}. "
                           f"You need {tokens_needed} tokens but only have {token_limit - tokens_used} remaining. "
                           f"Please upgrade your plan or wait until next month."
                )
            
            logger.info(f"Token limit check passed for user {user_id}: {total_tokens} / {token_limit}")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error enforcing token limit for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to verify token limits. Please try again."
            )
    
    async def _track_token_usage_sync(
        self, 
        user_id: int, 
        feature: str, 
        action: str, 
        tokens_used: int, 
        metadata: dict = None
    ) -> None:
        """Track token usage using sync database session"""
        try:
            from app.models.user import User
            from app.models.usage import Usage
            from sqlalchemy import select
            
            # Get user object
            result = self.db.execute(select(User).filter(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if user:
                # Create usage record
                usage = Usage(
                    user_id=user_id,
                    feature=feature,
                    action=action,
                    tokens_used=tokens_used,
                    metadata=metadata or {}
                )
                
                self.db.add(usage)
                self.db.commit()
                
                logger.info(f"Tracked {tokens_used} tokens for user {user_id} - {feature}:{action}")
            
        except Exception as e:
            logger.error(f"Failed to track token usage for user {user_id}: {str(e)}")
            # Don't raise exception here as it shouldn't break the main operation
    
    async def start_session(
        self, 
        user_id: int, 
        file_id: int,
        initial_prompt: Optional[str] = None
    ) -> FileCompletionSession:
        """
        Start a new interactive file completion session
        
        Args:
            user_id: ID of the user
            file_id: ID of the uploaded file
            initial_prompt: Optional initial prompt from user
            
        Returns:
            FileCompletionSession object
        """
        try:
            logger.info(f"Starting session for user {user_id}, file_id: {file_id}")
            # Get file upload
            file_upload = self.db.query(FileUpload).filter(FileUpload.id == file_id).first()
            if not file_upload:
                # Log available files for debugging
                available_files = self.db.query(FileUpload).limit(10).all()
                available_ids = [str(f.id) for f in available_files]
                logger.error(f"File with ID {file_id} not found in database. Available file IDs: {', '.join(available_ids)}")
                raise ValueError(f"File with ID {file_id} not found. Please ensure the file was uploaded successfully.")
            
            # Extract file content if not already extracted
            if not file_upload.extracted_content:
                logger.info(f"Extracting content from file {file_id}")
                # This will be handled by file processing service
                pass
            
            # Create session
            session_token = str(uuid.uuid4())
            session = FileCompletionSession(
                user_id=user_id,
                file_id=file_id,
                session_token=session_token,
                original_filename=file_upload.original_filename,
                file_type=file_upload.file_type,
                original_content=file_upload.extracted_content,
                current_content=file_upload.extracted_content,
                status=SessionStatus.ACTIVE,
                model_used=self._get_user_model(user_id)
            )
            
            # Save initial version
            session.save_version(
                content=file_upload.extracted_content or "",
                description="Original file"
            )
            
            # Add welcome message
            session.add_message(
                role="assistant",
                content=f"""I'm ready to help you complete this {file_upload.file_type} file! 

I can:
• Complete blank sections and answer questions
• Adjust the tone and style (formal, casual, academic, etc.)
• Add or remove content
• Reorganize sections
• Fix errors or improve clarity

What would you like me to do with this file?""",
                metadata={"type": "welcome"}
            )
            
            # If user provided initial prompt, process it
            if initial_prompt:
                session.add_message(
                    role="user",
                    content=initial_prompt,
                    metadata={"type": "initial_request"}
                )
            
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
            
            logger.info(f"Created interactive file completion session {session.id} for user {user_id}")
            return session
        
        except Exception as e:
            logger.error(f"Error starting file completion session: {str(e)}")
            self.db.rollback()
            raise
    
    async def send_message(
        self,
        session_id: int,
        user_id: int,
        message: str,
        apply_changes: bool = False
    ) -> Dict[str, Any]:
        """
        Send a message in the file completion chat
        
        Args:
            session_id: ID of the session
            user_id: ID of the user
            message: User's message
            apply_changes: Whether to apply suggested changes immediately
            
        Returns:
            Dictionary with AI response and proposed changes
        """
        try:
            # Get session
            session = self.db.query(FileCompletionSession).filter(
                FileCompletionSession.id == session_id,
                FileCompletionSession.user_id == user_id,
                FileCompletionSession.status == SessionStatus.ACTIVE
            ).first()
            
            if not session:
                raise ValueError("Session not found or not active")
            
            # Add user message to history
            session.add_message(
                role="user",
                content=message,
                metadata={"timestamp": datetime.utcnow().isoformat()}
            )
            
            # Build context for GPT
            system_prompt = self._build_system_prompt(session)
            conversation_messages = self._build_conversation_messages(session, message)
            
            # Estimate tokens needed and enforce limit
            all_messages = [
                {"role": "system", "content": system_prompt},
                *conversation_messages
            ]
            estimated_tokens = estimate_tokens_from_messages(all_messages)
            
            # Enforce token limit before making API call
            try:
                await self._enforce_token_limit_sync(user_id, estimated_tokens)
            except Exception as e:
                logger.warning(f"Token enforcement failed for user {user_id}: {str(e)}")
                # Continue without enforcement to avoid breaking the feature
            
            # Call GPT with model-specific parameters
            from app.utils.openai_params import get_openai_params
            
            model = session.model_used or "gpt-4o-mini"
            api_params = get_openai_params(
                model=model,
                messages=all_messages,
                max_completion_tokens=4000,
                temperature=0.7
            )
            
            response = await self.client.chat.completions.create(**api_params)
            
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else 0
            
            # Track token usage
            session.total_tokens_used += tokens_used
            try:
                await self._track_token_usage_sync(
                    user_id=user_id,
                    feature='interactive_file_completion',
                    action='chat_message',
                    tokens_used=tokens_used,
                    metadata={
                        'session_id': session_id,
                        'file_type': session.file_type,
                        'model': session.model_used
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to track token usage for user {user_id}: {str(e)}")
                # Continue without tracking to avoid breaking the feature
            
            # Add AI response to history
            session.add_message(
                role="assistant",
                content=ai_response,
                metadata={
                    "timestamp": datetime.utcnow().isoformat(),
                    "tokens_used": tokens_used
                }
            )
            
            # Parse the response to extract proposed changes
            proposed_changes = self._parse_ai_response(ai_response, session.current_content)
            
            # If apply_changes is True, update the current content
            if apply_changes and proposed_changes.get("new_content"):
                session.save_version(
                    content=proposed_changes["new_content"],
                    description=f"Applied: {message[:50]}..."
                )
                logger.info(f"Applied changes to session {session_id}")
            
            self.db.commit()
            
            return {
                "session_id": session.id,
                "ai_response": ai_response,
                "proposed_changes": proposed_changes,
                "current_content": session.current_content,
                "tokens_used": tokens_used,
                "total_tokens": session.total_tokens_used,
                "version_count": len(session.version_history) if session.version_history else 0
            }
        
        except Exception as e:
            logger.error(f"Error processing message in session {session_id}: {str(e)}")
            self.db.rollback()
            raise
    
    async def apply_changes(
        self,
        session_id: int,
        user_id: int,
        new_content: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Apply changes to the file and save a new version
        
        Args:
            session_id: ID of the session
            user_id: ID of the user
            new_content: New content to apply
            description: Description of the changes
            
        Returns:
            Updated session information
        """
        try:
            session = self.db.query(FileCompletionSession).filter(
                FileCompletionSession.id == session_id,
                FileCompletionSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Session not found")
            
            # Save new version
            session.save_version(
                content=new_content,
                description=description or f"Manual update"
            )
            
            self.db.commit()
            
            return {
                "session_id": session.id,
                "version_count": len(session.version_history),
                "current_content": session.current_content,
                "message": "Changes applied successfully"
            }
        
        except Exception as e:
            logger.error(f"Error applying changes to session {session_id}: {str(e)}")
            self.db.rollback()
            raise
    
    async def get_session(
        self,
        session_id: int,
        user_id: int
    ) -> Optional[FileCompletionSession]:
        """Get a session by ID"""
        return self.db.query(FileCompletionSession).filter(
            FileCompletionSession.id == session_id,
            FileCompletionSession.user_id == user_id
        ).first()
    
    async def get_version_history(
        self,
        session_id: int,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get version history for a session"""
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found")
        
        return session.version_history or []
    
    async def revert_to_version(
        self,
        session_id: int,
        user_id: int,
        version_index: int
    ) -> Dict[str, Any]:
        """Revert to a previous version"""
        try:
            session = self.db.query(FileCompletionSession).filter(
                FileCompletionSession.id == session_id,
                FileCompletionSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Session not found")
            
            if not session.version_history or version_index >= len(session.version_history):
                raise ValueError("Invalid version index")
            
            # Get the version content
            version = session.version_history[version_index]
            reverted_content = version["content"]
            
            # Save as new version
            session.save_version(
                content=reverted_content,
                description=f"Reverted to: {version['description']}"
            )
            
            self.db.commit()
            
            return {
                "session_id": session.id,
                "reverted_to": version_index,
                "current_content": session.current_content,
                "message": f"Reverted to version {version_index + 1}"
            }
        
        except Exception as e:
            logger.error(f"Error reverting session {session_id}: {str(e)}")
            self.db.rollback()
            raise
    
    async def complete_session(
        self,
        session_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Mark session as completed and return final content
        """
        try:
            session = self.db.query(FileCompletionSession).filter(
                FileCompletionSession.id == session_id,
                FileCompletionSession.user_id == user_id
            ).first()
            
            if not session:
                raise ValueError("Session not found")
            
            session.mark_completed()
            self.db.commit()
            
            return {
                "session_id": session.id,
                "status": "completed",
                "final_content": session.current_content,
                "total_versions": len(session.version_history) if session.version_history else 0,
                "total_messages": len(session.conversation_history) if session.conversation_history else 0,
                "total_tokens_used": session.total_tokens_used
            }
        
        except Exception as e:
            logger.error(f"Error completing session {session_id}: {str(e)}")
            self.db.rollback()
            raise
    
    def _build_system_prompt(self, session: FileCompletionSession) -> str:
        """Build system prompt for GPT based on session context"""
        return f"""You are an AI assistant helping a user complete their {session.file_type} file through interactive conversation.

CONTEXT:
- File type: {session.file_type}
- Original filename: {session.original_filename}
- Current version: {len(session.version_history) if session.version_history else 0}

YOUR ROLE:
1. Help the user iteratively improve and complete their file
2. Provide specific, actionable suggestions
3. When making changes, show BOTH the change and explain WHY
4. Be conversational and helpful
5. Ask clarifying questions if needed

RESPONSE FORMAT:
When suggesting changes to the file content, structure your response as:

**Proposed Changes:**
[Explain what you're changing and why]

**Updated Content:**
```
[The new/modified content]
```

**Summary:**
[Brief summary of changes made]

CURRENT FILE CONTENT:
{session.current_content[:3000]}{"..." if len(session.current_content or "") > 3000 else ""}

Remember: The user can ask you to make changes, adjust tone, add content, reorganize, or anything else. Always show the full updated section when making changes."""
    
    def _build_conversation_messages(
        self,
        session: FileCompletionSession,
        current_message: str
    ) -> List[Dict[str, str]]:
        """Build conversation messages for GPT context"""
        messages = []
        
        # Add recent conversation history (last 10 messages)
        if session.conversation_history:
            recent_history = session.conversation_history[-10:]
            for msg in recent_history:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": current_message
        })
        
        return messages
    
    def _parse_ai_response(
        self,
        ai_response: str,
        current_content: str
    ) -> Dict[str, Any]:
        """
        Parse AI response to extract proposed changes
        """
        import re
        
        # Try to extract code blocks or updated content
        code_blocks = re.findall(r'```(?:\w+)?\n(.*?)\n```', ai_response, re.DOTALL)
        
        proposed_content = None
        if code_blocks:
            # Use the first substantial code block as the new content
            proposed_content = code_blocks[0]
        
        # Try to extract explanations
        explanations = []
        if "**Proposed Changes:**" in ai_response:
            parts = ai_response.split("**Proposed Changes:**")
            if len(parts) > 1:
                explanation_text = parts[1].split("**Updated Content:**")[0].strip()
                explanations.append(explanation_text)
        
        return {
            "has_changes": bool(code_blocks),
            "new_content": proposed_content,
            "explanations": explanations,
            "full_response": ai_response,
            "preview_available": bool(proposed_content)
        }

