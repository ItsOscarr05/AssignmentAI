from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.deps import get_current_user, get_db
from app.services.template_service import TemplateService
from app.models.user import User
from pydantic import BaseModel, ConfigDict

router = APIRouter()

class TemplateCreate(BaseModel):
    title: str
    content: Dict[str, Any]
    type: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: bool = False
    metadata: Optional[Dict[str, Any]] = None

class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class TemplateResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    type: str
    category: Optional[str]
    is_public: bool
    created_by: int
    created_at: str
    updated_at: str
    usage_count: int
    metadata: Optional[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)

@router.post("/", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template"""
    template_service = TemplateService(db)
    return await template_service.create_template(
        user=current_user,
        title=template.title,
        content=template.content,
        template_type=template.type,
        description=template.description,
        category=template.category,
        is_public=template.is_public,
        metadata=template.metadata
    )

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a template by ID"""
    template_service = TemplateService(db)
    return await template_service.get_template(template_id)

@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    template_type: Optional[str] = None,
    category: Optional[str] = None,
    include_public: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List available templates"""
    template_service = TemplateService(db)
    return await template_service.list_templates(
        user=current_user,
        template_type=template_type,
        category=category,
        include_public=include_public
    )

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a template"""
    template_service = TemplateService(db)
    updates = template.dict(exclude_unset=True)
    return await template_service.update_template(
        user=current_user,
        template_id=template_id,
        updates=updates
    )

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a template"""
    template_service = TemplateService(db)
    await template_service.delete_template(user=current_user, template_id=template_id)
    return {"message": "Template deleted successfully"}

@router.post("/{template_id}/expand")
async def expand_template(
    template_id: int,
    variables: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Expand a template with provided variables"""
    template_service = TemplateService(db)
    return await template_service.expand_template(template_id, variables) 
