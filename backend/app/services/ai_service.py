from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from openai import AsyncOpenAI
from app.crud import ai_assignment as ai_assignment_crud
from app.crud import feedback as feedback_crud
from app.crud import user as user_crud
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.ai_assignment import (
    AssignmentGenerationRequest,
    AssignmentContent,
    GeneratedAssignment,
    AssignmentGenerationResponse,
    AIAssignmentCreate
)
from app.schemas.feedback import FeedbackCreate
from app.core.config import settings
from app.core.logger import logger
from app.core.validation import get_default_ai_settings
import re
import asyncio
from fastapi import HTTPException
from app.models.usage import Usage
from app.services.usage_service import UsageService


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model_version = settings.AI_MODEL_VERSION
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        # Create usage service for tracking tokens
        from sqlalchemy.orm import Session
        sync_db = Session(bind=db.bind)
        self.usage_service = UsageService(sync_db)

    async def track_token_usage(self, user_id: int, feature: str, action: str, tokens_used: int, metadata: dict = None):
        """Track token usage for a user"""
        try:
            from app.models.user import User
            # Get user object
            result = self.db.execute(select(User).filter(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                await self.usage_service.track_usage(
                    user=user,
                    feature=feature,
                    action=action,
                    tokens_used=tokens_used,
                    metadata=metadata
                )
        except Exception as e:
            logger.error(f"Failed to track token usage: {str(e)}")

    def get_user_model(self, user_id: int) -> str:
        """Get the AI model assigned to a user's subscription"""
        result = self.db.execute(
            select(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            return "gpt-5-nano"  # Default model for users without subscription (Free plan model)
        
        return str(subscription.ai_model)

    def get_user_plan(self, user_id: int) -> str:
        """Get the user's subscription plan for token limits"""
        result = self.db.execute(
            select(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            return "free"  # Default to free plan
        
        # Map subscription plan to our tier names
        plan_mapping = {
            "free": "free",
            "plus": "plus", 
            "pro": "pro",
            "max": "max"
        }
        
        return plan_mapping.get(subscription.plan_name.lower(), "free")

    async def generate_assignment(self, request: AssignmentGenerationRequest) -> AssignmentGenerationResponse:
        """
        Generate an assignment using AI based on the provided request parameters.
        """
        try:
            # Validate input parameters
            if not self._validate_request(request):
                return AssignmentGenerationResponse(
                    success=False,
                    assignment=None,
                    error="Invalid request parameters"
                )

            # Construct the prompt for the AI model
            prompt = self._construct_assignment_prompt(request)
            
            # Call OpenAI API with retry logic
            response = await self._call_openai_with_retry(prompt, request.user_id)
            
            # Parse and structure the AI response
            assignment_content = self._parse_assignment_content(response)
            
            # Validate the generated content
            if not self._validate_generated_content(assignment_content):
                return AssignmentGenerationResponse(
                    success=False,
                    assignment=None,
                    error="Generated content failed validation"
                )

            # Create the response object with enhanced metadata
            response = AssignmentGenerationResponse(
                success=True,
                assignment=GeneratedAssignment(
                    title=assignment_content.get("title", "Generated Assignment"),
                    description=assignment_content.get("description", ""),
                    content=AssignmentContent(
                        objectives=assignment_content.get("objectives", []),
                        instructions=assignment_content.get("instructions", ""),
                        requirements=assignment_content.get("requirements", []),
                        evaluation_criteria=assignment_content.get("evaluation_criteria", []),
                        estimated_duration=assignment_content.get("estimated_duration", "1 hour"),
                        resources=assignment_content.get("resources", [])
                    )
                ),
                error=None
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating assignment: {str(e)}")
            return AssignmentGenerationResponse(
                success=False,
                assignment=None,
                error=f"Failed to generate assignment: {str(e)}"
            )

    async def generate_feedback(self, user_id: int, submission_content: str, feedback_type: str, submission_id: int) -> Optional[FeedbackCreate]:
        """
        Generate feedback for a submission using AI.
        """
        try:
            # Get the user's assigned model
            model = self.get_user_model(user_id)
            
            # Construct the prompt for the AI model
            prompt = self._construct_feedback_prompt(submission_content, feedback_type)
            
            # Get user's AI settings
            try:
                from sqlalchemy.orm import Session
                sync_db = Session(bind=self.db.bind)
                user_settings = user_crud.get_ai_settings(sync_db, str(user_id))
                sync_db.close()
                
                max_tokens = user_settings.get('tokenContextLimit', settings.AI_MAX_TOKENS)
                temperature = user_settings.get('temperature', settings.AI_TEMPERATURE)
            except Exception as e:
                logger.warning(f"Failed to get user AI settings for user {user_id}, using defaults: {str(e)}")
                max_tokens = settings.AI_MAX_TOKENS
                temperature = settings.AI_TEMPERATURE
            
            # Prepare parameters based on model
            params = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a helpful teacher's assistant that provides constructive feedback on student submissions."},
                    {"role": "user", "content": prompt}
                ],
                "max_completion_tokens": max_tokens
            }
            
            # GPT-5 models have limited parameter support
            if "gpt-5" not in model.lower():
                params.update({
                    "top_p": settings.AI_TOP_P,
                    "frequency_penalty": settings.AI_FREQUENCY_PENALTY,
                    "presence_penalty": settings.AI_PRESENCE_PENALTY
                })
            else:
                logger.info(f"Using minimal parameters for feedback generation with {model}")
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(**params)
            
            feedback_content = response.choices[0].message.content
            if feedback_content is None:
                logger.error("OpenAI returned None content for feedback")
                return None
            
            # Track token usage
            if hasattr(response, 'usage'):
                tokens_used = response.usage.total_tokens if response.usage else 0
                await self.track_token_usage(
                    user_id=user_id,
                    feature='ai_feedback',
                    action='generate',
                    tokens_used=tokens_used,
                    metadata={
                        'model': model,
                        'feedback_type': feedback_type,
                        'submission_id': submission_id,
                        'prompt_length': len(prompt),
                        'response_length': len(feedback_content) if feedback_content else 0
                    }
                )
            
            # Create feedback object
            feedback = FeedbackCreate(
                submission_id=submission_id,
                content=feedback_content,
                feedback_type=feedback_type,
                confidence_score=0.8,  # TODO: Get actual confidence score from AI model
                feedback_metadata={
                    "model_version": self.model_version,
                    "model_used": model,
                    "generated_at": datetime.utcnow().isoformat()
                }
            )
            
            return feedback
            
        except Exception as e:
            logger.error(f"Error generating feedback: {str(e)}")
            return None

    def _validate_request(self, request: AssignmentGenerationRequest) -> bool:
        """Validate the request parameters."""
        try:
            if not request.subject or len(request.subject) < 2:
                return False
            if not request.grade_level or not re.match(r'^(K|[1-9]|1[0-2]|College|University)$', request.grade_level):
                return False
            if not request.topic or len(request.topic) < 3:
                return False
            if not request.difficulty or request.difficulty not in ['easy', 'medium', 'hard']:
                return False
            return True
        except Exception:
            return False

    async def _call_openai_with_retry(self, prompt: str, user_id: int = None, max_retries: int = 3) -> str:
        """Call OpenAI API with retry logic."""
        # Get user's AI settings if user_id is provided
        max_tokens = settings.AI_MAX_TOKENS
        temperature = settings.AI_TEMPERATURE
        
        if user_id:
            try:
                # Convert AsyncSession to regular Session for user_crud
                from sqlalchemy.orm import Session
                sync_db = Session(bind=self.db.bind)
                user_settings = user_crud.get_ai_settings(sync_db, str(user_id))
                sync_db.close()
                
                max_tokens = user_settings.get('tokenContextLimit', settings.AI_MAX_TOKENS)
                temperature = user_settings.get('temperature', settings.AI_TEMPERATURE)
            except Exception as e:
                logger.warning(f"Failed to get user AI settings for user {user_id}, using defaults: {str(e)}")
        
        for attempt in range(max_retries):
            try:
                # Prepare parameters based on model
                params = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "You are a helpful teacher's assistant that creates educational assignments."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_completion_tokens": max_tokens
                }
                
                # GPT-5 models have limited parameter support
                if "gpt-5" not in self.model.lower():
                    params.update({
                        "top_p": settings.AI_TOP_P,
                        "frequency_penalty": settings.AI_FREQUENCY_PENALTY,
                        "presence_penalty": settings.AI_PRESENCE_PENALTY
                    })
                else:
                    logger.info(f"Using minimal parameters for retry with {self.model}")
                
                response = await self.client.chat.completions.create(**params)
                content = response.choices[0].message.content
                if content is None:
                    raise ValueError("OpenAI returned None content")
                
                # Track token usage
                if user_id and hasattr(response, 'usage'):
                    tokens_used = response.usage.total_tokens if response.usage else 0
                    await self.track_token_usage(
                        user_id=user_id,
                        feature='ai_generation',
                        action='generate',
                        tokens_used=tokens_used,
                        metadata={
                            'model': self.model,
                            'prompt_length': len(prompt),
                            'response_length': len(content) if content else 0
                        }
                    )
                
                return content
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
        raise RuntimeError("Failed to get response from OpenAI after all retries")

    def _validate_generated_content(self, content: Dict[str, Any]) -> bool:
        """Validate the generated content structure and completeness."""
        required_fields = ['title', 'description', 'objectives', 'instructions', 'requirements']
        return all(field in content and content[field] for field in required_fields)

    def _count_words(self, content: Dict[str, Any]) -> int:
        """Count the total words in the generated content."""
        text = ' '.join(str(value) for value in content.values() if isinstance(value, (str, list)))
        return len(text.split())

    def _calculate_confidence_score(self, content: Dict[str, Any]) -> float:
        """Calculate a confidence score for the generated content."""
        # Simple scoring based on content completeness and length
        score = 0.0
        if content.get('title'): score += 0.2
        if content.get('description'): score += 0.2
        if content.get('objectives'): score += 0.2
        if content.get('instructions'): score += 0.2
        if content.get('requirements'): score += 0.2
        return min(score, 1.0)

    def _construct_assignment_prompt(self, request: AssignmentGenerationRequest) -> str:
        """
        Construct the prompt for assignment generation.
        """
        return f"""
        Generate a detailed assignment for:
        Subject: {request.subject}
        Grade Level: {request.grade_level}
        Topic: {request.topic}
        Difficulty: {request.difficulty}
        
        Additional Requirements:
        {request.requirements if request.requirements else 'None specified'}
        
        Please provide a structured response with the following sections:
        
        Title: [Assignment Title]
        Description: [Brief overview of the assignment]
        Objectives: [List of learning objectives]
        Instructions: [Step-by-step instructions]
        Requirements: [List of specific requirements]
        Evaluation Criteria: [List of criteria for grading]
        Estimated Duration: [Time estimate]
        Resources: [List of recommended resources]
        
        Format the response in a clear, structured manner that can be easily parsed.
        """

    def _construct_feedback_prompt(self, submission_content: str, feedback_type: str) -> str:
        """
        Construct the prompt for feedback generation.
        """
        return f"""
        Provide {feedback_type} feedback for the following submission:
        
        {submission_content}
        
        Please structure your response with the following sections:
        
        Strengths:
        - [List specific strengths]
        
        Areas for Improvement:
        - [List areas that need work]
        
        Suggestions:
        - [Provide concrete suggestions]
        
        Examples:
        - [Include relevant examples where applicable]
        
        Format the response in a clear, constructive manner that will help the student improve.
        """

    def _parse_assignment_content(self, ai_response: str) -> Dict[str, Any]:
        """
        Parse the AI response into structured assignment content.
        """
        try:
            # Split the response into sections
            sections = {}
            current_section = None
            current_content = []
            
            for line in ai_response.split('\n'):
                line = line.strip()
                if not line:
                    continue
                    
                if line.endswith(':'):
                    if current_section and current_content:
                        sections[current_section] = '\n'.join(current_content)
                    current_section = line[:-1].lower()
                    current_content = []
                else:
                    if current_section:
                        current_content.append(line)
            
            # Add the last section
            if current_section and current_content:
                sections[current_section] = '\n'.join(current_content)
            
            # Process lists
            for key in ['objectives', 'requirements', 'evaluation criteria', 'resources']:
                if key in sections:
                    sections[key] = [
                        item.strip('- ').strip()
                        for item in sections[key].split('\n')
                        if item.strip()
                    ]
            
            return {
                "title": sections.get('title', 'Generated Assignment'),
                "description": sections.get('description', ''),
                "objectives": sections.get('objectives', []),
                "instructions": sections.get('instructions', ''),
                "requirements": sections.get('requirements', []),
                "evaluation_criteria": sections.get('evaluation criteria', []),
                "estimated_duration": sections.get('estimated duration', '1 hour'),
                "resources": sections.get('resources', [])
            }
            
        except Exception as e:
            logger.error(f"Error parsing assignment content: {str(e)}")
            # Return default content if parsing fails
            return {
                "title": "Generated Assignment",
                "description": "This is a sample assignment description.",
                "objectives": ["Objective 1", "Objective 2"],
                "instructions": "Step 1: Do this\nStep 2: Do that",
                "requirements": ["Requirement 1", "Requirement 2"],
                "evaluation_criteria": ["Criterion 1", "Criterion 2"],
                "estimated_duration": "2 hours",
                "resources": ["Resource 1", "Resource 2"]
            }

    async def analyze_submission(
        self,
        submission_content: str,
        assignment_requirements: Dict[str, Any],
        user_id: int
    ) -> Dict[str, Any]:
        """
        Analyze a student's submission using OpenAI API.
        """
        prompt = f"""
        Analyze this student submission based on the assignment requirements.
        
        Assignment Requirements:
        {assignment_requirements}
        
        Student Submission:
        {submission_content}
        
        Please provide:
        1. A score out of 100
        2. Detailed feedback
        3. Key strengths
        4. Areas for improvement
        5. Specific suggestions for improvement
        """

        # Get the user's assigned model for evaluation
        model = self.get_user_model(user_id)
        
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful teacher's assistant that evaluates student submissions."},
                {"role": "user", "content": prompt}
            ],
                                            max_completion_tokens=1000
        )

        analysis = response.choices[0].message.content

        # Parse the response to extract structured information
        # This is a simple implementation - you might want to make this more robust
        try:
            if analysis is None:
                return {
                    "score": 0.0,
                    "feedback": "No analysis available",
                    "suggestions": [],
                    "strengths": [],
                    "areas_for_improvement": []
                }
            
            lines = analysis.split("\n")
            score = float(next(line for line in lines if "score" in line.lower()).split(":")[-1].strip())
            feedback = "\n".join(line for line in lines if "feedback" in line.lower())
            strengths = [line.strip("- ") for line in lines if "strength" in line.lower()]
            improvements = [line.strip("- ") for line in lines if "improve" in line.lower()]
            suggestions = [line.strip("- ") for line in lines if "suggest" in line.lower()]
        except Exception:
            # Fallback if parsing fails
            return {
                "score": 0.0,
                "feedback": analysis or "No analysis available",
                "suggestions": [],
                "strengths": [],
                "areas_for_improvement": []
            }

        return {
            "score": score,
            "feedback": feedback,
            "suggestions": suggestions,
            "strengths": strengths,
            "areas_for_improvement": improvements
        }

    def _estimate_time(self, difficulty: str) -> int:
        """
        Estimate completion time in minutes based on difficulty.
        """
        time_estimates = {
            "easy": 30,
            "medium": 60,
            "hard": 120
        }
        return time_estimates.get(difficulty.lower(), 60)

    async def enforce_token_limit(self, user_id: int, tokens_needed: int) -> None:
        """
        Enforce the user's monthly token limit. Raise HTTPException if exceeded.
        Also notify user if they cross a token threshold (75%, 50%, 25%, 10% remaining).
        """
        # Get active subscription
        result = await self.db.execute(
            select(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
        )
        subscription = result.scalar_one_or_none()
        token_limit = int(subscription.token_limit) if subscription is not None and subscription.token_limit is not None else 100000  # type: ignore # Default to free plan

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

        # Ensure all values are integers for comparison
        tokens_used_int = int(tokens_used)
        tokens_needed_int = int(tokens_needed)
        token_limit_int = int(token_limit)



        if tokens_used_int + tokens_needed_int > token_limit_int:
            raise HTTPException(
                status_code=403,
                detail=f"Token limit exceeded: {tokens_used_int + tokens_needed_int} / {token_limit_int}"
            )

    async def generate_chat_response(self, prompt: str, conversation_history: list = None, user_id: int = None) -> str:
        """
        Generate a general chat response using the user's subscription model for conversational AI interactions.
        This method uses the user's assigned model to handle typos, unclear messages, and general conversation
        like ChatGPT does.
        
        Args:
            prompt: User's message (can include typos or unclear language)
            conversation_history: Previous conversation messages for context
            user_id: User ID to determine subscription model
            
        Returns:
            AI response as string
        """
        try:
            # Get user's subscription model
            user_model = self.get_user_model(user_id) if user_id else "gpt-5-nano"
            logger.info(f"Using user model for chat: {user_model}")
            
            # Prepare conversation messages
            messages = []
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                    if isinstance(msg, dict) and msg.get('isUser'):
                        messages.append({"role": "user", "content": msg.get('content', '')})
                    else:
                        messages.append({"role": "assistant", "content": msg.get('content', '')})
            
            # Add current user message
            messages.append({"role": "user", "content": prompt})
            
            logger.info(f"Using {user_model} for chat response with {len(messages)} context messages")
            
            # Get user's plan for token limits
            user_plan = self.get_user_plan(user_id) if user_id else "free"
            max_tokens = settings.AI_RESPONSE_LIMITS.get(user_plan, settings.AI_MAX_TOKENS)
            
            logger.info(f"Using plan '{user_plan}' with max_tokens: {max_tokens}")
            
            # Configure parameters based on model capabilities
            params = {
                "model": user_model,
                "messages": messages,
                "max_completion_tokens": max_tokens
            }
            
            # GPT-5 models have limited parameter support
            if "gpt-5" not in user_model.lower():
                params.update({
                    "top_p": 0.9,
                    "frequency_penalty": 0.1,
                    "presence_penalty": 0.1,
                    "temperature": 0.7
                })
            else:
                # GPT-5 models only support default temperature (1.0)
                logger.info(f"Using minimal parameters for {user_model}")
            
            # Use user's subscription model for chat responses
            response = await self.client.chat.completions.create(**params)
            
            content = response.choices[0].message.content
            if content is None:
                # Log prompt preview without full content to avoid Unicode issues
                prompt_preview = prompt[:100].replace('\n', ' ').replace('\r', ' ') if prompt else ""
                logger.error(f"GPT returned None content for chat prompt: {prompt_preview}...")
                raise ValueError("GPT returned None content")
            
            # Track token usage
            if user_id and hasattr(response, 'usage'):
                tokens_used = response.usage.total_tokens if response.usage else 0
                await self.track_token_usage(
                    user_id=user_id,
                    feature='ai_chat',
                    action='generate',
                    tokens_used=tokens_used,
                    metadata={
                        'model': user_model,
                        'prompt_length': len(prompt),
                        'response_length': len(content) if content else 0,
                        'conversation_length': len(messages)
                    }
                )
            
            logger.info(f"Successfully generated GPT chat response of length: {len(content)} characters")
            return content
            
        except Exception as e:
            logger.error(f"Error generating GPT chat response: {str(e)}")
            # Fallback to custom prompt if GPT fails
            logger.info("Falling back to custom chat prompt...")
            return await self._generate_fallback_chat_response(prompt, user_id)

    async def generate_chat_response_stream(self, prompt: str, conversation_history: list = None, user_id: int = None):
        """
        Generate a streaming chat response using the user's subscription model.
        This method streams the response in real-time for better user experience.
        
        Args:
            prompt: User's message
            conversation_history: Previous conversation messages for context
            user_id: User ID to determine subscription model
            
        Yields:
            Chunks of the AI response as they are generated
        """
        try:
            # Get user's subscription model
            user_model = self.get_user_model(user_id) if user_id else "gpt-5-nano"
            logger.info(f"Using streaming with user model: {user_model}")
            
            # Prepare conversation messages
            messages = []
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                    if isinstance(msg, dict) and msg.get('isUser'):
                        messages.append({"role": "user", "content": msg.get('content', '')})
                    else:
                        messages.append({"role": "assistant", "content": msg.get('content', '')})
            
            # Add current user message
            messages.append({"role": "user", "content": prompt})
            
            # Get user's plan for token limits
            user_plan = self.get_user_plan(user_id) if user_id else "free"
            max_tokens = settings.AI_RESPONSE_LIMITS.get(user_plan, settings.AI_MAX_TOKENS)
            
            logger.info(f"Using plan '{user_plan}' with max_tokens: {max_tokens}")
            
            # Configure parameters based on model capabilities
            params = {
                "model": user_model,
                "messages": messages,
                "max_completion_tokens": max_tokens,
                "stream": True  # Enable streaming
            }
            
            # GPT-5 models have limited parameter support
            if "gpt-5" not in user_model.lower():
                params.update({
                    "top_p": 0.9,
                    "frequency_penalty": 0.1,
                    "presence_penalty": 0.1,
                    "temperature": 0.7
                })
            else:
                logger.info(f"Using minimal parameters for streaming with {user_model}")
            
            # Stream the response
            logger.info("Creating streaming request to OpenAI...")
            stream = await self.client.chat.completions.create(**params)
            logger.info("Stream created, starting to process chunks...")
            
            chunk_count = 0
            async for chunk in stream:
                chunk_count += 1
                logger.info(f"Processing chunk {chunk_count}")
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if hasattr(delta, 'content') and delta.content:
                        # Log chunk info without full content to avoid Unicode issues
                        chunk_preview = delta.content[:50].replace('\n', ' ').replace('\r', ' ') if delta.content else ""
                        logger.info(f"Yielding content chunk ({len(delta.content)} chars): {chunk_preview}...")
                        yield delta.content
                    else:
                        logger.info("Chunk has no content")
                else:
                    logger.info("Chunk has no choices")
            
            logger.info(f"Streaming completed. Total chunks processed: {chunk_count}")
                        
        except Exception as e:
            logger.error(f"Error in streaming chat response: {str(e)}")
            # Fallback to non-streaming if streaming fails
            logger.info("Falling back to non-streaming response...")
            fallback_content = await self.generate_chat_response(prompt, conversation_history, user_id)
            yield fallback_content
    
    async def _generate_fallback_chat_response(self, prompt: str, user_id: int = None) -> str:
        """
        Fallback method using custom prompt if GPT integration fails.
        """
        try:
            # Get user's subscription model for fallback too
            user_model = self.get_user_model(user_id) if user_id else "gpt-5-nano"
            logger.info(f"Using fallback method with user model: {user_model}")
            
            # Construct a system prompt for general chat/conversation
            system_prompt = """You are a helpful AI assistant. You should:
            
            1. Respond naturally to user messages, even if they contain typos or unclear language
            2. If a message is unclear, ask clarifying questions
            3. If there are obvious typos, understand what the user likely meant and respond appropriately
            4. Be conversational, helpful, and engaging
            5. Provide accurate, useful information
            6. If you're not sure about something, say so
            7. Keep responses concise but informative
            
            Always try to understand the user's intent, even if their message isn't perfectly clear."""
            
            # Configure parameters based on model capabilities
            params = {
                "model": user_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "max_completion_tokens": settings.AI_MAX_TOKENS
            }
            
            # GPT-5 models have limited parameter support
            if "gpt-5" not in user_model.lower():
                params.update({
                    "top_p": settings.AI_TOP_P,
                    "frequency_penalty": settings.AI_FREQUENCY_PENALTY,
                    "presence_penalty": settings.AI_PRESENCE_PENALTY
                })
            else:
                # GPT-5 models only support basic parameters
                logger.info(f"Using minimal parameters for fallback with {user_model}")
            
            # Call OpenAI API with custom prompt using user's model
            response = await self.client.chat.completions.create(**params)
            
            content = response.choices[0].message.content
            if content is None:
                # Log prompt preview without full content to avoid Unicode issues
                prompt_preview = prompt[:100].replace('\n', ' ').replace('\r', ' ') if prompt else ""
                logger.error(f"Fallback returned None content for chat prompt: {prompt_preview}...")
                raise ValueError("Fallback returned None content")
            
            logger.info(f"Successfully generated fallback chat response of length: {len(content)} characters")
            return content
            
        except Exception as e:
            logger.error(f"Error generating fallback chat response: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate chat response: {str(e)}"
            )

    async def generate_assignment_content_from_prompt(self, prompt: str) -> str:
        """
        Generate assignment content from a natural language prompt.
        This method is used for chat-based assignment input.
        
        Args:
            prompt: Natural language description of the assignment
            
        Returns:
            Generated assignment content as string
        """
        try:
            # Construct a system prompt for chat-based generation
            system_prompt = """You are an expert educational content creator. 
            When given a description of an assignment, create a comprehensive, 
            well-structured assignment that includes:
            
            1. Clear title and description
            2. Learning objectives
            3. Detailed instructions
            4. Requirements and deliverables
            5. Evaluation criteria
            6. Estimated time and resources needed
            
            Format the response in a clear, structured manner that students can easily follow.
            Make sure the assignment is appropriate for the described level and subject."""
            
            # Prepare parameters based on model
            params = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "max_completion_tokens": settings.AI_MAX_TOKENS
            }
            
            # GPT-5 models have limited parameter support
            if "gpt-5" not in self.model.lower():
                params.update({
                    "top_p": settings.AI_TOP_P,
                    "frequency_penalty": settings.AI_FREQUENCY_PENALTY,
                    "presence_penalty": settings.AI_PRESENCE_PENALTY
                })
            else:
                logger.info(f"Using minimal parameters for assignment generation with {self.model}")
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(**params)
            
            content = response.choices[0].message.content
            if content is None:
                # Log prompt preview without full content to avoid Unicode issues
                prompt_preview = prompt[:100].replace('\n', ' ').replace('\r', ' ') if prompt else ""
                logger.error(f"OpenAI returned None content for prompt: {prompt_preview}...")
                raise ValueError("OpenAI returned None content")
            
            logger.info(f"Successfully generated content of length: {len(content)} characters")
            return content
            
        except Exception as e:
            logger.error(f"Error generating content from prompt: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}") 