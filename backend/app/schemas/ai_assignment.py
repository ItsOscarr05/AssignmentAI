from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime
import re

class AssignmentGenerationRequest(BaseModel):
    subject: str = Field(..., min_length=2, max_length=100, description="Subject area (e.g., Mathematics, Science)")
    grade_level: str = Field(..., pattern=r'^(K|[1-9]|1[0-2]|College|University)$', description="Grade level (e.g., 9th, 10th)")
    topic: str = Field(..., min_length=3, max_length=200, description="Specific topic for the assignment")
    difficulty: str = Field(..., pattern=r'^(easy|medium|hard)$', description="Difficulty level (easy, medium, hard)")
    requirements: Optional[Dict[str, Any]] = Field(
        default=None,
        max_length=1000,
        description="Additional requirements or specifications for the assignment"
    )

    @validator('subject', 'topic')
    def sanitize_text(cls, v):
        """Sanitize text by removing HTML and limiting length."""
        return re.sub(r'<[^>]+>', '', v)

    @validator('requirements')
    def sanitize_requirements(cls, v):
        """Sanitize requirements dictionary."""
        if v is None:
            return v
        return {
            k: re.sub(r'<[^>]+>', '', str(v))[:500]  # Remove HTML and limit length
            for k, v in v.items()
        }

class AssignmentContent(BaseModel):
    objectives: List[str] = Field(..., min_items=1, max_items=10, description="Learning objectives")
    instructions: str = Field(..., min_length=10, description="Step-by-step instructions")
    requirements: List[str] = Field(..., min_items=1, max_items=20, description="List of requirements")
    evaluation_criteria: List[str] = Field(..., min_items=1, max_items=10, description="Evaluation criteria")
    estimated_duration: str = Field(..., pattern=r'^\d+\s*(hour|hours|minute|minutes)$', description="Estimated time to complete")
    resources: List[str] = Field(default_factory=list, max_items=10, description="Recommended resources")

    @validator('objectives', 'requirements', 'evaluation_criteria', 'resources')
    def sanitize_list_items(cls, v):
        """Sanitize list items by removing HTML and limiting length."""
        return [
            re.sub(r'<[^>]+>', '', item)[:500]  # Remove HTML and limit length
            for item in v
        ]

    @validator('instructions')
    def sanitize_instructions(cls, v):
        """Sanitize instructions by removing HTML and limiting length."""
        return re.sub(r'<[^>]+>', '', v)[:2000]  # Remove HTML and limit length

class GeneratedAssignment(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Assignment title")
    description: str = Field(..., min_length=10, max_length=1000, description="Detailed description")
    content: AssignmentContent

    @validator('title', 'description')
    def sanitize_text(cls, v):
        """Sanitize text by removing HTML and limiting length."""
        return re.sub(r'<[^>]+>', '', v)

class AssignmentGenerationResponse(BaseModel):
    success: bool = Field(..., description="Whether the generation was successful")
    assignment: Optional[GeneratedAssignment] = Field(None, description="Generated assignment")
    error: Optional[str] = Field(None, description="Error message if generation failed")

class AIAssignmentBase(BaseModel):
    prompt: str = Field(..., description="The prompt used to generate the assignment")
    generated_content: str = Field(..., description="The AI-generated assignment content")
    model_version: str = Field(..., description="Version of the AI model used")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="AI model's confidence in the generation")
    generation_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional generation data")

    @validator('prompt', 'generated_content')
    def sanitize_text(cls, v):
        """Sanitize text by removing HTML and limiting length."""
        return re.sub(r'<[^>]+>', '', v)[:5000]  # Remove HTML and limit length

class AIAssignmentCreate(AIAssignmentBase):
    assignment_id: Optional[int] = None

class AIAssignmentUpdate(AIAssignmentBase):
    pass

class AIAssignmentInDB(AIAssignmentBase):
    id: int
    assignment_id: Optional[int]
    generated_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AIAssignment(AIAssignmentInDB):
    pass 