from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.assignment import assignment
from app.schemas.assignment import AssignmentCreate
from app.core.config import settings
from app.models.assignment import Assignment
import openai

class AssignmentService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY

    async def generate_content(self, assignment_data: AssignmentCreate) -> str:
        """Generate assignment content using OpenAI API."""
        prompt = self._create_prompt(assignment_data)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert teacher creating educational assignments."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Failed to generate assignment content: {str(e)}")

    def _create_prompt(self, data: AssignmentCreate) -> str:
        """Create a prompt for the AI based on assignment parameters."""
        prompt = f"""Create a detailed {data.assignment_type} assignment for {data.grade_level} students in {data.subject}.

Title: {data.title}
Topic: {data.topic}
Difficulty Level: {data.difficulty}
Estimated Time: {data.estimated_time} minutes

Please provide:
1. Clear instructions
2. Detailed requirements
3. Any necessary resources or materials
4. Expected learning outcomes
5. Assessment criteria

Format the response in a clear, structured manner."""

        return prompt

    async def create_assignment(
        self, db: AsyncSession, *, obj_in: AssignmentCreate, user_id: int
    ) -> Optional[Assignment]:
        """Create a new assignment with AI-generated content."""
        # Generate content using AI
        content = await self.generate_content(obj_in)
        
        # Update the assignment data with generated content
        obj_in_data = obj_in.model_dump()
        obj_in_data['content'] = content
        
        # Create assignment in database
        db_obj = await assignment.create_with_user(
            db=db, obj_in=AssignmentCreate(**obj_in_data), user_id=user_id
        )
        
        return db_obj

assignment_service = AssignmentService() 