from typing import Optional
from openai import OpenAI
from app.core.config import settings
from app.schemas.assignment import AssignmentCreate

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)

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
            response = await client.chat.completions.create(
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
            # Check if it's a quota/rate limit error
            if "quota" in str(e).lower() or "429" in str(e) or "rate limit" in str(e).lower():
                print(f"OpenAI quota exceeded, returning mock response for assignment: {assignment.title}")
                # Return a mock response for testing when OpenAI is unavailable
                return f"""I'd be happy to create an educational assignment for you! However, I'm currently experiencing some technical difficulties with my AI service.

Assignment Request:
- Title: {assignment.title}
- Subject: {assignment.subject}
- Grade Level: {assignment.grade_level}
- Type: {assignment.assignment_type}
- Topic: {assignment.topic}
- Difficulty: {assignment.difficulty}
- Estimated Time: {assignment.estimated_time} minutes

This is a mock response while we resolve the AI service connection. In a normal scenario, I would generate a comprehensive assignment including:
1. Clear instructions
2. Learning objectives
3. Required materials/resources
4. Step-by-step tasks
5. Assessment criteria
6. Additional notes or tips

The chat interface is working perfectly! Once the AI service is restored, you'll get full AI-powered assignment generation.

For now, please try:
1. Checking your OpenAI API quota
2. Verifying your API key is valid
3. Ensuring your billing is up to date

Would you like me to help you with anything specific once the service is back online?"""
            else:
                raise Exception(f"Error generating assignment content: {str(e)}")

    @staticmethod
    async def generate_assignment_content_from_prompt(prompt: str) -> str:
        """
        Generate assignment content from a simple prompt.
        """
        try:
            response = await client.chat.completions.create(
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
            # Check if it's a quota/rate limit error
            if "quota" in str(e).lower() or "429" in str(e) or "rate limit" in str(e).lower():
                print(f"OpenAI quota exceeded, returning mock response for prompt: {prompt}")
                # Return a mock response for testing when OpenAI is unavailable
                return f"""I'd be happy to help you! However, I'm currently experiencing some technical difficulties with my AI service.

Your message was: "{prompt}"

This is a mock response while we resolve the AI service connection. In a normal scenario, I would:
- Analyze your request
- Provide detailed, helpful responses
- Generate educational content
- Create diagrams if requested
- Process files and links

The chat interface is working perfectly! Once the AI service is restored, you'll get full AI-powered responses.

For now, please try:
1. Checking your OpenAI API quota
2. Verifying your API key is valid
3. Ensuring your billing is up to date

Would you like me to help you with anything specific once the service is back online?"""
            else:
                raise Exception(f"Error generating content from prompt: {str(e)}")

ai_service = AIService() 