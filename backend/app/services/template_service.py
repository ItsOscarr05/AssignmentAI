from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.template import Template
from app.models.user import User
from fastapi import HTTPException
from datetime import datetime

class TemplateService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _hydrate_template(template: Template) -> Template:
        if template is not None:
            setattr(template, "metadata", getattr(template, "_metadata", None) or {})
            if template.tags is None:
                setattr(template, "tags", [])
        return template

    async def create_template(
        self,
        user: User,
        title: str,
        content: Dict[str, Any],
        template_type: str,
        description: Optional[str] = None,
        category: Optional[str] = None,
        is_public: bool = False,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Template:
        """Create a new template"""
        template = Template(
            title=title,
            description=description,
            content=content,
            type=template_type,
            category=category,
            is_public=is_public,
            created_by=user.id,
        )
        if metadata is not None:
            template._metadata = metadata or {}
        self._hydrate_template(template)
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return self._hydrate_template(template)

    async def get_template(self, template_id: int) -> Template:
        """Get a template by ID"""
        template = self.db.query(Template).filter(Template.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return self._hydrate_template(template)

    async def list_templates(
        self,
        user: User,
        template_type: Optional[str] = None,
        category: Optional[str] = None,
        include_public: bool = True
    ) -> List[Template]:
        """List templates available to the user"""
        query = self.db.query(Template)
        
        # Filter by user's templates and public templates
        if include_public:
            query = query.filter(
                (Template.created_by == user.id) | (Template.is_public == True)
            )
        else:
            query = query.filter(Template.created_by == user.id)
        
        # Apply additional filters
        if template_type:
            query = query.filter(Template.type == template_type)
        if category:
            query = query.filter(Template.category == category)
            
        templates = query.all()
        return [self._hydrate_template(t) for t in templates]

    async def update_template(
        self,
        user: User,
        template_id: int,
        updates: Dict[str, Any]
    ) -> Template:
        """Update a template"""
        template = await self.get_template(template_id)
        
        # Check ownership
        if template.created_by != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this template")
        
        # Update fields
        for field, value in updates.items():
            if field == "metadata":
                template._metadata = value or {}
            elif hasattr(template, field):
                setattr(template, field, value)
        
        template.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(template)
        return self._hydrate_template(template)

    async def delete_template(self, user: User, template_id: int) -> None:
        """Delete a template"""
        template = await self.get_template(template_id)
        
        # Check ownership
        if template.created_by != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this template")
        
        self.db.delete(template)
        self.db.commit()

    async def increment_usage(self, template_id: int) -> None:
        """Increment the usage count of a template"""
        template = await self.get_template(template_id)
        template.usage_count = (template.usage_count or 0) + 1
        self.db.commit()

    async def expand_template(
        self,
        template_id: int,
        variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Expand a template with provided variables"""
        template = await self.get_template(template_id)
        
        # Increment usage count
        await self.increment_usage(template_id)
        
        # Expand template content with variables
        expanded_content = self._expand_content(template.content, variables)
        return expanded_content

    def _expand_content(self, content: Dict[str, Any], variables: Dict[str, Any]) -> Dict[str, Any]:
        """Helper method to expand template content with variables"""
        if isinstance(content, dict):
            return {k: self._expand_content(v, variables) for k, v in content.items()}
        elif isinstance(content, list):
            return [self._expand_content(item, variables) for item in content]
        elif isinstance(content, str):
            # Replace variables in string content
            for var_name, var_value in variables.items():
                content = content.replace(f"{{{{ {var_name} }}}}", str(var_value))
            return content
        return content 