from typing import Optional
import openai
from app.core.config import settings
from app.schemas.assignment import AssignmentCreate

openai.api_key = settings.OPENAI_API_KEY

class AIService:
    @staticmethod
    async def generate_assignment_content(assignment: AssignmentCreate) -> str:
        """
        Generate assignment content using OpenAI API.
        """
        prompt = f"""
        Create a detailed educational assignment with the following specifications:
        
        Title: {assignment.title}
        Subject: {assignment.subject}
        Grade Level: {assignment.grade_level}
        Type: {assignment.assignment_type}
        Topic: {assignment.topic}
        Difficulty: {assignment.difficulty}
        Estimated Time: {assignment.estimated_time} minutes
        
        Additional Requirements:
        {assignment.additional_requirements or 'None'}
        
        Please provide a comprehensive assignment that includes:
        1. Clear instructions
        2. Learning objectives
        3. Required materials/resources
        4. Step-by-step tasks
        5. Assessment criteria
        6. Additional notes or tips
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert educational content creator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"Error generating assignment content: {str(e)}")

ai_service = AIService() 