import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.deps import get_current_user, get_db
from app.core.feature_access import has_feature_access, get_user_plan
from app.services.citation_service import CitationService
from app.models.user import User
from pydantic import BaseModel, ConfigDict

router = APIRouter()

def check_citation_access(current_user: User, db: Session):
    """Helper function to check citation management access"""
    if os.getenv("TESTING") == "true":
        return
    if not has_feature_access(current_user, "citation_management", db):
        plan = get_user_plan(current_user, db)
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Citation management not available in your plan",
                "feature": "citation_management",
                "current_plan": plan,
                "upgrade_message": "Upgrade to Pro plan to access citation management",
                "upgrade_url": "/dashboard/price-plan"
            }
        )

class CitationCreate(BaseModel):
    title: str
    authors: str
    year: Optional[str] = None
    journal: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    publisher: Optional[str] = None
    location: Optional[str] = None
    type: str = 'journal'
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class CitationUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    year: Optional[str] = None
    journal: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    publisher: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class CitationResponse(BaseModel):
    id: int
    title: str
    authors: str
    year: Optional[str]
    journal: Optional[str]
    volume: Optional[str]
    issue: Optional[str]
    pages: Optional[str]
    url: Optional[str]
    doi: Optional[str]
    publisher: Optional[str]
    location: Optional[str]
    citation_type: str
    formatted_citations: Dict[str, str]
    notes: Optional[str]
    tags: Optional[List[str]]
    created_at: str  # Ensure this is always a string
    updated_at: str  # Ensure this is always a string

    @classmethod
    def from_orm(cls, obj):
        # Convert datetime fields to ISO format strings
        data = obj.__dict__.copy()
        if isinstance(data.get('created_at'), (str, type(None))):
            pass
        else:
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), (str, type(None))):
            pass
        else:
            data['updated_at'] = data['updated_at'].isoformat()
        return cls(**data)
    
    model_config = ConfigDict(from_attributes=True)

@router.post("/", response_model=CitationResponse)
async def create_citation(
    citation: CitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new citation. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    return await citation_service.create_citation(
        user=current_user,
        citation_data=citation.model_dump()
    )

@router.get("/", response_model=List[CitationResponse])
async def list_citations(
    citation_type: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated tags
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List user's citations with optional filtering. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    
    # Parse tags if provided
    tag_list = None
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',')]
    
    return await citation_service.list_citations(
        user=current_user,
        citation_type=citation_type,
        tags=tag_list,
        search=search
    )

@router.post("/batch")
async def generate_citations_batch(
    citations: List[CitationCreate],
    format_type: str = Query('APA', pattern='^(APA|MLA|Chicago|Harvard)$'),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate formatted citations for multiple sources. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    citations_data = [citation.model_dump() for citation in citations]
    return await citation_service.generate_citations_batch(
        user=current_user,
        citations_data=citations_data,
        format_type=format_type
    )

@router.post("/extract-from-url")
async def extract_citation_from_url(
    url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Extract citation information from a URL. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    return await citation_service.extract_citation_from_url(url)

@router.get("/validate-doi/{doi:path}")
async def validate_doi(
    doi: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate and fetch metadata for a DOI. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    return await citation_service.validate_doi(doi)

@router.get("/formats/{citation_id}")
async def get_citation_formats(
    citation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all formatted versions of a citation. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    citation = await citation_service.get_citation(citation_id, current_user)
    return citation.formatted_citations

@router.get("/{citation_id}", response_model=CitationResponse)
async def get_citation(
    citation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a citation by ID. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    return await citation_service.get_citation(citation_id, current_user)

@router.put("/{citation_id}", response_model=CitationResponse)
async def update_citation(
    citation_id: int,
    citation: CitationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a citation. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    updates = citation.model_dump(exclude_unset=True)
    return await citation_service.update_citation(
        user=current_user,
        citation_id=citation_id,
        updates=updates
    )

@router.delete("/{citation_id}")
async def delete_citation(
    citation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a citation. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    await citation_service.delete_citation(user=current_user, citation_id=citation_id)
    return {"message": "Citation deleted successfully"}

@router.post("/{citation_id}/duplicate")
async def duplicate_citation(
    citation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Duplicate an existing citation. Requires Pro or Max plan."""
    check_citation_access(current_user, db)
    citation_service = CitationService(db)
    original_citation = await citation_service.get_citation(citation_id, current_user)
    
    # Create new citation with same data but new ID
    citation_data = {
        'title': original_citation.title,
        'authors': original_citation.authors,
        'year': original_citation.year,
        'journal': original_citation.journal,
        'volume': original_citation.volume,
        'issue': original_citation.issue,
        'pages': original_citation.pages,
        'url': original_citation.url,
        'doi': original_citation.doi,
        'publisher': original_citation.publisher,
        'location': original_citation.location,
        'type': original_citation.citation_type,
        'notes': original_citation.notes,
        'tags': original_citation.tags
    }
    
    return await citation_service.create_citation(
        user=current_user,
        citation_data=citation_data
    ) 
