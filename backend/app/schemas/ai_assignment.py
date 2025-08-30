from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import Pattern
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

    model_config = ConfigDict(protected_namespaces=())

    @field_validator('subject', 'topic')
    @classmethod
    def sanitize_text(cls, v):
        """Sanitize text by removing HTML and limiting length."""
        return re.sub(r'<[^>]+>', '', v)

    @field_validator('requirements')
    @classmethod
    def sanitize_requirements(cls, v):
        """Sanitize requirements dictionary."""
        if v is None:
            return v
        return {
            k: re.sub(r'<[^>]+>', '', str(v))[:500]  # Remove HTML and limit length
            for k, v in v.items()
        }

class AssignmentContent(BaseModel):
    objectives: List[str] = Field(..., min_length=1, max_length=10, description="Learning objectives")
    instructions: str = Field(..., min_length=10, description="Step-by-step instructions")
    requirements: List[str] = Field(..., min_length=1, max_length=20, description="List of requirements")
    evaluation_criteria: List[str] = Field(..., min_length=1, max_length=10, description="Evaluation criteria")
    estimated_duration: str = Field(..., description="Estimated time to complete")
    resources: List[str] = Field(default_factory=list, max_length=10, description="Recommended resources")

    model_config = ConfigDict(protected_namespaces=())

    @field_validator('objectives', 'requirements', 'evaluation_criteria', 'resources')
    @classmethod
    def sanitize_list_items(cls, v, info):
        if info.field_name == 'objectives' and len(v) > 10:
            raise ValueError('objectives must have at most 10 items')
        cleaned = []
        for item in v:
            item = re.sub(r'<script.*?>.*?</script>', '', item, flags=re.DOTALL | re.IGNORECASE)
            item = re.sub(r'<[^>]+>', '', item)[:500]
            cleaned.append(item)
        return cleaned

    @field_validator('instructions')
    @classmethod
    def sanitize_instructions(cls, v):
        """Sanitize instructions by removing HTML, scripts, and limiting length."""
        v = re.sub(r'<script.*?>.*?</script>', '', v, flags=re.DOTALL | re.IGNORECASE)
        return re.sub(r'<[^>]+>', '', v)[:2000]  # Remove HTML and limit length

    @model_validator(mode="after")
    @classmethod
    def check_estimated_duration(cls, values):
        pattern = r'^\d+\s*(hour|hours|minute|minutes)$'
        v = values.estimated_duration
        if not re.match(pattern, v):
            raise ValueError('estimated_duration must match pattern: <number> hour(s)/minute(s)')
        return values

class GeneratedAssignment(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Assignment title")
    description: str = Field(..., min_length=10, max_length=1000, description="Detailed description")
    content: AssignmentContent

    model_config = ConfigDict(protected_namespaces=())

    @field_validator('title', 'description')
    @classmethod
    def sanitize_text(cls, v):
        """Sanitize text by removing HTML and limiting length."""
        return re.sub(r'<[^>]+>', '', v)

class AssignmentGenerationResponse(BaseModel):
    success: bool = Field(..., description="Whether the generation was successful")
    assignment: Optional[GeneratedAssignment] = Field(None, description="Generated assignment")
    error: Optional[str] = Field(None, description="Error message if generation failed")

    model_config = ConfigDict(protected_namespaces=())

class AIAssignmentBase(BaseModel):
    assignment_id: int = Field(..., description="ID of the assignment")
    prompt: str = Field(..., description="The prompt used to generate the assignment")
    model: str = Field(..., description="AI model used (e.g., gpt-4)")
    max_tokens: int = Field(..., ge=1, le=4000, description="Maximum tokens for generation")
    temperature: float = Field(..., ge=0.0, le=2.0, description="Temperature for generation")
    status: str = Field(default="pending", description="Status of generation")
    generated_content: Optional[str] = Field(None, description="The AI-generated assignment content")
    model_version: str = Field(default="1.0", description="Version of the AI model used")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI model's confidence in the generation")
    generation_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional generation data")

    model_config = ConfigDict(protected_namespaces=())

    @field_validator('prompt', 'generated_content')
    @classmethod
    def sanitize_text(cls, v):
        """Sanitize text by removing HTML and limiting length."""
        if v is None:
            return v
        return re.sub(r'<[^>]+>', '', v)[:5000]  # Remove HTML and limit length

    @field_validator('model')
    @classmethod
    def validate_model(cls, v):
        """Validate AI model name."""
        valid_models = ['gpt-4', 'gpt-4-turbo', 'gpt-4.1-mini', 'gpt-5-nano', 'gpt-5', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'claude-3', 'claude-2']
        if v not in valid_models:
            raise ValueError(f"Model must be one of: {', '.join(valid_models)}")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        """Validate status."""
        valid_statuses = ['pending', 'processing', 'completed', 'failed']
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v

class AIAssignmentCreateRequest(BaseModel):
    assignment_id: int = Field(..., description="ID of the assignment")
    prompt: str = Field(..., description="The prompt used to generate the assignment")
    model: str = Field(..., description="AI model used (e.g., gpt-4)")
    max_tokens: int = Field(..., ge=1, le=4000, description="Maximum tokens for generation")
    temperature: float = Field(..., ge=0.0, le=2.0, description="Temperature for generation")
    status: str = Field(default="pending", description="Status of generation")
    generated_content: Optional[str] = Field(None, description="The AI-generated assignment content")
    model_version: str = Field(default="1.0", description="Version of the AI model used")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI model's confidence in the generation")
    generation_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional generation data")

    model_config = ConfigDict(protected_namespaces=())

    @field_validator('prompt', 'generated_content')
    @classmethod
    def sanitize_text(cls, v):
        """Sanitize text by removing HTML and limiting length."""
        if v is None:
            return v
        return re.sub(r'<[^>]+>', '', v)[:5000]  # Remove HTML and limit length

    @field_validator('model')
    @classmethod
    def validate_model(cls, v):
        """Validate AI model name."""
        valid_models = ['gpt-4', 'gpt-4-turbo', 'gpt-4.1-mini', 'gpt-5-nano', 'gpt-5', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'claude-3', 'claude-2']
        if v not in valid_models:
            raise ValueError(f"Model must be one of: {', '.join(valid_models)}")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        """Validate status."""
        valid_statuses = ['pending', 'processing', 'completed', 'failed']
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v

class AIAssignmentCreate(AIAssignmentBase):
    user_id: int = Field(..., description="ID of the user who created the AI assignment")

class AIAssignmentUpdate(BaseModel):
    prompt: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = Field(None, ge=1, le=4000)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    status: Optional[str] = None
    generated_content: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    generation_metadata: Optional[Dict[str, Any]] = None
    model_version: Optional[str] = None

    model_config = ConfigDict(protected_namespaces=())

    @field_validator('model')
    @classmethod
    def validate_model(cls, v):
        """Validate AI model name."""
        if v is None:
            return v
        valid_models = ['gpt-4', 'gpt-4-turbo', 'gpt-4.1-mini', 'gpt-5-nano', 'gpt-5', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'claude-3', 'claude-2']
        if v not in valid_models:
            raise ValueError(f"Model must be one of: {', '.join(valid_models)}")
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        """Validate status."""
        if v is None:
            return v
        valid_statuses = ['pending', 'processing', 'completed', 'failed']
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v

class AIAssignmentInDB(AIAssignmentBase):
    id: int
    user_id: int
    generated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

class AIAssignment(AIAssignmentInDB):
    pass 