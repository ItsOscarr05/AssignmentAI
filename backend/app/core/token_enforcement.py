"""
Token Limit Enforcement System
Comprehensive token tracking and enforcement for all AI API calls
"""
import functools
import asyncio
from typing import Callable, Any, Optional, Dict
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime
import logging

from app.models.subscription import Subscription, SubscriptionStatus
from app.models.usage import Usage
from app.core.config import settings

logger = logging.getLogger(__name__)


class TokenLimitExceeded(HTTPException):
    """Custom exception for token limit exceeded"""
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class TokenEnforcementService:
    """Service for enforcing token limits across all AI operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def enforce_token_limit(self, user_id: int, tokens_needed: int) -> None:
        """
        Enforce the user's monthly token limit. Raise HTTPException if exceeded.
        """
        try:
            # Get active subscription
            result = await self.db.execute(
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
            result = await self.db.execute(
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
                raise TokenLimitExceeded(
                    f"Token limit exceeded: {total_tokens} / {token_limit}. "
                    f"You need {tokens_needed} tokens but only have {token_limit - tokens_used} remaining. "
                    f"Please upgrade your plan or wait until next month."
                )
            
            logger.info(f"Token limit check passed for user {user_id}: {total_tokens} / {token_limit}")
            
        except TokenLimitExceeded:
            raise
        except Exception as e:
            logger.error(f"Error enforcing token limit for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to verify token limits. Please try again."
            )
    
    async def track_token_usage(
        self, 
        user_id: int, 
        feature: str, 
        action: str, 
        tokens_used: int, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Track token usage for a user"""
        try:
            from app.models.user import User
            from app.services.usage_service import UsageService
            
            # Get user object
            result = await self.db.execute(select(User).filter(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if user:
                # Create sync session for usage service
                sync_db = Session(bind=self.db.bind)
                usage_service = UsageService(sync_db)
                
                await usage_service.track_usage(
                    user=user,
                    feature=feature,
                    action=action,
                    tokens_used=tokens_used,
                    metadata=metadata or {}
                )
                
                logger.info(f"Tracked {tokens_used} tokens for user {user_id} - {feature}:{action}")
            
        except Exception as e:
            logger.error(f"Failed to track token usage for user {user_id}: {str(e)}")
            # Don't raise exception here as it shouldn't break the main operation


def enforce_token_limit(tokens_needed: int, feature: str = "ai_operation"):
    """
    Decorator to enforce token limits before executing AI operations
    
    Args:
        tokens_needed: Estimated tokens needed for the operation
        feature: Feature name for tracking (e.g., 'file_completion', 'chat_response')
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id and db from function arguments
            user_id = None
            db = None
            
            # Try to find user_id in various common parameter names
            for arg_name in ['user_id', 'current_user_id', 'user']:
                if arg_name in kwargs:
                    user_id = kwargs[arg_name]
                    break
            
            # Try to find db in various common parameter names
            for arg_name in ['db', 'session', 'database']:
                if arg_name in kwargs:
                    db = kwargs[arg_name]
                    break
            
            # If user_id is an object (like current_user), extract the id
            if user_id and hasattr(user_id, 'id'):
                user_id = user_id.id
            
            if not user_id:
                logger.warning(f"No user_id found for token enforcement in {func.__name__}")
                # Continue without enforcement for now
            elif not db:
                logger.warning(f"No database session found for token enforcement in {func.__name__}")
                # Continue without enforcement for now
            else:
                # Enforce token limit
                enforcement_service = TokenEnforcementService(db)
                await enforcement_service.enforce_token_limit(user_id, tokens_needed)
            
            # Execute the original function
            result = await func(*args, **kwargs)
            
            # Track token usage if we have the necessary info and result
            if user_id and db and hasattr(result, 'tokens_used'):
                enforcement_service = TokenEnforcementService(db)
                await enforcement_service.track_token_usage(
                    user_id=user_id,
                    feature=feature,
                    action=func.__name__,
                    tokens_used=result.tokens_used,
                    metadata={
                        'function': func.__name__,
                        'estimated_tokens': tokens_needed
                    }
                )
            
            return result
        
        return wrapper
    return decorator


def estimate_tokens_from_text(text: str) -> int:
    """
    Rough estimation of tokens from text
    Uses a simple approximation: ~4 characters per token
    """
    if not text:
        return 0
    return max(1, len(text) // 4)


def estimate_tokens_from_messages(messages: list) -> int:
    """
    Estimate tokens from a list of messages
    """
    total_chars = 0
    for message in messages:
        if isinstance(message, dict):
            content = message.get('content', '')
            if isinstance(content, str):
                total_chars += len(content)
            elif isinstance(content, list):
                # Handle multimodal content
                for item in content:
                    if isinstance(item, dict) and item.get('type') == 'text':
                        total_chars += len(item.get('text', ''))
        elif isinstance(message, str):
            total_chars += len(message)
    
    return estimate_tokens_from_text("") + (total_chars // 4)


# Token estimates for common operations
TOKEN_ESTIMATES = {
    'file_completion': 2000,
    'chat_response': 1500,
    'assignment_generation': 1000,
    'feedback_generation': 500,
    'image_analysis': 800,
    'content_optimization': 600,
    'research_assistant': 700,
    'smart_summarization': 400,
    'plagiarism_check': 750,
    'grade_submission': 500,
    'suggest_content': 300,
    'analyze_performance': 1500,
}
