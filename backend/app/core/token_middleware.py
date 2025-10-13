"""
Token Tracking Middleware
Automatically tracks token usage for AI operations
"""
from fastapi import Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import json
import logging
import time
from typing import Dict, Any, Optional

from app.core.token_enforcement import estimate_tokens_from_text

logger = logging.getLogger(__name__)


class TokenTrackingMiddleware(BaseHTTPMiddleware):
    """Middleware to automatically track token usage for AI endpoints"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.ai_endpoints = {
            '/api/v1/ai/assignments',
            '/api/v1/ai/feedback',
            '/api/v1/ai/analysis',
            '/api/v1/file-completion/sessions',
            '/api/v1/workshop/chat',
            '/api/v1/workshop/analyze',
            '/api/v1/workshop/summarize',
            '/api/v1/workshop/optimize',
            '/api/v1/workshop/research',
        }
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Only track AI endpoints
        if not any(request.url.path.startswith(endpoint) for endpoint in self.ai_endpoints):
            return await call_next(request)
        
        start_time = time.time()
        
        # Extract user info from request
        user_id = getattr(request.state, 'user_id', None)
        if hasattr(request.state, 'current_user') and request.state.current_user:
            user_id = request.state.current_user.id
        
        # Process the request
        response = await call_next(request)
        
        # Track tokens if response is successful and we have user info
        if response.status_code == 200 and user_id:
            try:
                await self._track_tokens_from_response(request, response, user_id, start_time)
            except Exception as e:
                logger.error(f"Failed to track tokens from response: {str(e)}")
        
        return response
    
    async def _track_tokens_from_response(
        self, 
        request: Request, 
        response: Response, 
        user_id: int, 
        start_time: float
    ):
        """Extract and track token usage from the response"""
        
        # Get feature name from request path
        feature = self._get_feature_from_path(request.url.path)
        
        # Handle streaming responses
        if isinstance(response, StreamingResponse):
            await self._track_streaming_response(response, user_id, feature)
            return
        
        # Handle JSON responses
        if hasattr(response, 'body') and response.body:
            try:
                # Try to parse response body for token info
                response_data = json.loads(response.body.decode('utf-8'))
                
                # Look for token usage in common response formats
                tokens_used = self._extract_tokens_from_response(response_data)
                
                if tokens_used > 0:
                    await self._record_token_usage(
                        user_id=user_id,
                        feature=feature,
                        action=request.method.lower(),
                        tokens_used=tokens_used,
                        metadata={
                            'endpoint': request.url.path,
                            'method': request.method,
                            'processing_time': time.time() - start_time
                        }
                    )
                    
            except (json.JSONDecodeError, UnicodeDecodeError):
                # If we can't parse the response, estimate from content length
                if hasattr(response, 'body') and response.body:
                    estimated_tokens = estimate_tokens_from_text(response.body.decode('utf-8', errors='ignore'))
                    if estimated_tokens > 100:  # Only track if significant content
                        await self._record_token_usage(
                            user_id=user_id,
                            feature=feature,
                            action=request.method.lower(),
                            tokens_used=estimated_tokens,
                            metadata={
                                'endpoint': request.url.path,
                                'method': request.method,
                                'processing_time': time.time() - start_time,
                                'estimated': True
                            }
                        )
    
    async def _track_streaming_response(self, response: StreamingResponse, user_id: int, feature: str):
        """Track tokens from streaming responses"""
        # For streaming responses, we'll estimate based on the stream content
        # This is a simplified approach - in production you might want to intercept the stream
        estimated_tokens = 1000  # Conservative estimate for streaming responses
        
        await self._record_token_usage(
            user_id=user_id,
            feature=feature,
            action='stream',
            tokens_used=estimated_tokens,
            metadata={
                'streaming': True,
                'estimated': True
            }
        )
    
    def _get_feature_from_path(self, path: str) -> str:
        """Extract feature name from request path"""
        if '/file-completion' in path:
            return 'file_completion'
        elif '/workshop/chat' in path:
            return 'chat_response'
        elif '/workshop/analyze' in path:
            return 'image_analysis'
        elif '/workshop/summarize' in path:
            return 'smart_summarization'
        elif '/workshop/optimize' in path:
            return 'content_optimization'
        elif '/workshop/research' in path:
            return 'research_assistant'
        elif '/ai/assignments' in path:
            return 'assignment_generation'
        elif '/ai/feedback' in path:
            return 'feedback_generation'
        elif '/ai/analysis' in path:
            return 'analyze_performance'
        else:
            return 'ai_operation'
    
    def _extract_tokens_from_response(self, response_data: Dict[str, Any]) -> int:
        """Extract token usage from response data"""
        # Common response formats that include token information
        if isinstance(response_data, dict):
            # Check for direct token fields
            for field in ['tokens_used', 'total_tokens', 'token_count', 'usage']:
                if field in response_data:
                    value = response_data[field]
                    if isinstance(value, int):
                        return value
                    elif isinstance(value, dict) and 'total_tokens' in value:
                        return value['total_tokens']
            
            # Check for nested usage information
            if 'usage' in response_data and isinstance(response_data['usage'], dict):
                return response_data['usage'].get('total_tokens', 0)
            
            # Estimate from content if available
            if 'content' in response_data or 'response' in response_data:
                content = response_data.get('content', '') or response_data.get('response', '')
                if isinstance(content, str):
                    return estimate_tokens_from_text(content)
        
        return 0
    
    async def _record_token_usage(
        self, 
        user_id: int, 
        feature: str, 
        action: str, 
        tokens_used: int, 
        metadata: Dict[str, Any]
    ):
        """Record token usage in the database"""
        try:
            # This would typically use a database service
            # For now, we'll just log it
            logger.info(
                f"Token usage tracked - User: {user_id}, Feature: {feature}, "
                f"Action: {action}, Tokens: {tokens_used}, Metadata: {metadata}"
            )
            
            # TODO: Implement actual database recording
            # from app.services.usage_service import UsageService
            # usage_service = UsageService(db)
            # await usage_service.track_usage(...)
            
        except Exception as e:
            logger.error(f"Failed to record token usage: {str(e)}")


def add_token_tracking_middleware(app):
    """Add token tracking middleware to the FastAPI app"""
    app.add_middleware(TokenTrackingMiddleware)
