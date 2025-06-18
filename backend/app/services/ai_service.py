from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI
from app.crud import ai_assignment as ai_assignment_crud
from app.crud import feedback as feedback_crud
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
import re
import asyncio
from fastapi import HTTPException
from sqlalchemy import func
from app.models.usage import Usage

class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.model_version = settings.AI_MODEL_VERSION
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def get_user_model(self, user_id: int) -> str:
        """Get the AI model assigned to a user's subscription"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        
        if not subscription:
            return "gpt-4.1-nano"  # Default model for users without subscription (Free plan model)
        
        return subscription.ai_model

    async def generate_assignment(self, request: AssignmentGenerationRequest) -> AssignmentGenerationResponse:
        """
        Generate an assignment using AI based on the provided request parameters.
        """
        try:
            # Validate input parameters
            if not self._validate_request(request):
                return AssignmentGenerationResponse(
                    success=False,
                    error="Invalid request parameters"
                )

            # Construct the prompt for the AI model
            prompt = self._construct_assignment_prompt(request)
            
            # Call OpenAI API with retry logic
            response = await self._call_openai_with_retry(prompt)
            
            # Parse and structure the AI response
            assignment_content = self._parse_assignment_content(response)
            
            # Validate the generated content
            if not self._validate_generated_content(assignment_content):
                return AssignmentGenerationResponse(
                    success=False,
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
                    ),
                    metadata={
                        "word_count": self._count_words(assignment_content),
                        "difficulty_level": request.difficulty,
                        "generation_timestamp": datetime.utcnow().isoformat(),
                        "model_version": self.model,
                        "confidence_score": self._calculate_confidence_score(assignment_content)
                    }
                )
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating assignment: {str(e)}")
            return AssignmentGenerationResponse(
                success=False,
                error=f"Failed to generate assignment: {str(e)}"
            )

    async def generate_feedback(self, user_id: int, submission_content: str, feedback_type: str) -> Optional[FeedbackCreate]:
        """
        Generate feedback for a submission using AI.
        """
        try:
            # Get the user's assigned model
            model = await self.get_user_model(user_id)
            
            # Construct the prompt for the AI model
            prompt = self._construct_feedback_prompt(submission_content, feedback_type)
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful teacher's assistant that provides constructive feedback on student submissions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.AI_MAX_TOKENS,
                temperature=settings.AI_TEMPERATURE,
                top_p=settings.AI_TOP_P,
                frequency_penalty=settings.AI_FREQUENCY_PENALTY,
                presence_penalty=settings.AI_PRESENCE_PENALTY
            )
            
            feedback_content = response.choices[0].message.content
            
            # Create feedback object
            feedback = FeedbackCreate(
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

    async def _call_openai_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """Call OpenAI API with retry logic."""
        for attempt in range(max_retries):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a helpful teacher's assistant that creates educational assignments."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=settings.AI_MAX_TOKENS,
                    temperature=settings.AI_TEMPERATURE,
                    top_p=settings.AI_TOP_P,
                    frequency_penalty=settings.AI_FREQUENCY_PENALTY,
                    presence_penalty=settings.AI_PRESENCE_PENALTY
                )
                return response.choices[0].message.content
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff

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
        assignment_requirements: Dict[str, Any]
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

        response = await self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful teacher's assistant that evaluates student submissions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )

        analysis = response.choices[0].message.content

        # Parse the response to extract structured information
        # This is a simple implementation - you might want to make this more robust
        try:
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
                "feedback": analysis,
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
        """
        # Get active subscription
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        token_limit = subscription.token_limit if subscription else 30000  # Default to free plan

        # Calculate start of current month
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)

        # Sum tokens used this month
        tokens_used = self.db.query(func.coalesce(func.sum(Usage.tokens_used), 0)).filter(
            Usage.user_id == user_id,
            Usage.timestamp >= start_of_month
        ).scalar()

        if tokens_used + tokens_needed > token_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Token limit exceeded: {tokens_used + tokens_needed} / {token_limit}"
            ) 