from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.core.feature_access import require_feature
from app.models.user import User
from app.services.smart_summarization_service import SmartSummarizationService
from app.services.research_assistant_service import ResearchAssistantService
from app.services.content_optimization_service import ContentOptimizationService
from app.core.logger import logger
from pydantic import BaseModel, Field

router = APIRouter()

# Pydantic models for request/response
class SummarizationRequest(BaseModel):
    content: str = Field(..., min_length=10, description="Content to summarize")
    summary_type: str = Field(default="comprehensive", description="Type of summary")
    max_length: Optional[int] = Field(None, description="Maximum length of summary")
    include_insights: bool = Field(default=True, description="Include key insights")

class MultiDocumentSummarizationRequest(BaseModel):
    documents: List[dict] = Field(..., min_length=1, description="List of documents to summarize")
    summary_type: str = Field(default="comprehensive", description="Type of summary")

class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="Topic to research")
    research_depth: str = Field(default="comprehensive", description="Depth of research")
    include_sources: bool = Field(default=True, description="Include source suggestions")
    fact_check: bool = Field(default=True, description="Perform fact-checking")

class SourceComparisonRequest(BaseModel):
    sources: List[str] = Field(..., min_length=2, description="List of sources to compare")
    topic: str = Field(..., min_length=3, description="Research topic")

class ContentOptimizationRequest(BaseModel):
    content: str = Field(..., min_length=10, description="Content to optimize")
    optimization_type: str = Field(default="general", description="Type of optimization")
    target_audience: Optional[str] = Field(None, description="Target audience")
    content_purpose: Optional[str] = Field(None, description="Purpose of content")
    include_metrics: bool = Field(default=True, description="Include optimization metrics")

class SEOOptimizationRequest(BaseModel):
    content: str = Field(..., min_length=10, description="Content to optimize")
    target_keywords: List[str] = Field(..., min_length=1, description="Target keywords")
    content_type: str = Field(default="article", description="Type of content")

# Smart Content Summarization Endpoints
@router.post("/summarize")
@require_feature("smart_content_summarization")
async def summarize_content(
    request: SummarizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate intelligent content summarization with key insights.
    Available for Plus plan and above.
    """
    try:
        logger.info(f"Smart summarization requested by user {current_user.id}")
        
        service = SmartSummarizationService()
        result = await service.summarize_content(
            content=request.content,
            summary_type=request.summary_type,
            max_length=request.max_length,
            include_insights=request.include_insights
        )
        
        logger.info(f"Smart summarization completed for user {current_user.id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in smart summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@router.post("/summarize-multiple")
@require_feature("smart_content_summarization")
async def summarize_multiple_documents(
    request: MultiDocumentSummarizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Summarize multiple documents and provide comparative analysis.
    Available for Plus plan and above.
    """
    try:
        logger.info(f"Multi-document summarization requested by user {current_user.id}")
        
        service = SmartSummarizationService()
        result = await service.summarize_multiple_documents(
            documents=request.documents,
            summary_type=request.summary_type
        )
        
        logger.info(f"Multi-document summarization completed for user {current_user.id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in multi-document summarization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to summarize documents: {str(e)}")

# Advanced Research Assistant Endpoints
@router.post("/research")
@require_feature("advanced_research_assistant")
async def research_topic(
    request: ResearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Conduct comprehensive research on a given topic with fact-checking.
    Available for Pro plan and above.
    """
    try:
        logger.info(f"Research requested by user {current_user.id} for topic: {request.topic}")
        
        service = ResearchAssistantService()
        result = await service.research_topic(
            topic=request.topic,
            research_depth=request.research_depth,
            include_sources=request.include_sources,
            fact_check=request.fact_check
        )
        
        logger.info(f"Research completed for user {current_user.id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in research: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to conduct research: {str(e)}")

@router.post("/compare-sources")
@require_feature("advanced_research_assistant")
async def compare_research_sources(
    request: SourceComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare multiple research sources for a given topic.
    Available for Pro plan and above.
    """
    try:
        logger.info(f"Source comparison requested by user {current_user.id} for topic: {request.topic}")
        
        service = ResearchAssistantService()
        result = await service.compare_research_sources(
            sources=request.sources,
            topic=request.topic
        )
        
        logger.info(f"Source comparison completed for user {current_user.id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in source comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to compare sources: {str(e)}")

# Advanced Content Optimization Endpoints
@router.post("/optimize-content")
@require_feature("advanced_content_optimization")
async def optimize_content(
    request: ContentOptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Optimize content for maximum impact using AI.
    Available for Max plan only.
    """
    try:
        logger.info(f"Content optimization requested by user {current_user.id}")
        
        service = ContentOptimizationService()
        result = await service.optimize_content(
            content=request.content,
            optimization_type=request.optimization_type,
            target_audience=request.target_audience,
            content_purpose=request.content_purpose,
            include_metrics=request.include_metrics
        )
        
        logger.info(f"Content optimization completed for user {current_user.id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in content optimization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to optimize content: {str(e)}")

@router.post("/optimize-seo")
@require_feature("advanced_content_optimization")
async def optimize_for_seo(
    request: SEOOptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Optimize content for search engine optimization (SEO).
    Available for Max plan only.
    """
    try:
        logger.info(f"SEO optimization requested by user {current_user.id}")
        
        service = ContentOptimizationService()
        result = await service.optimize_for_seo(
            content=request.content,
            target_keywords=request.target_keywords,
            content_type=request.content_type
        )
        
        logger.info(f"SEO optimization completed for user {current_user.id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in SEO optimization: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to optimize for SEO: {str(e)}")

# Feature Information Endpoints
@router.get("/features/smart-summarization")
async def get_smart_summarization_info():
    """Get information about smart content summarization feature."""
    return {
        "feature": "smart_content_summarization",
        "name": "Smart Content Summarization",
        "description": "Intelligent content summarization with key insights",
        "available_plans": ["plus", "pro", "max"],
        "capabilities": [
            "Comprehensive summarization",
            "Executive summaries",
            "Bullet point summaries",
            "Key insights extraction",
            "Multi-document comparison",
            "Readability metrics",
            "Compression ratio analysis"
        ],
        "use_cases": [
            "Academic paper summaries",
            "Business report analysis",
            "Research document review",
            "Content curation",
            "Information extraction"
        ]
    }

@router.get("/features/research-assistant")
async def get_research_assistant_info():
    """Get information about advanced research assistant feature."""
    return {
        "feature": "advanced_research_assistant",
        "name": "Advanced Research Assistant",
        "description": "AI-powered research and fact-checking",
        "available_plans": ["pro", "max"],
        "capabilities": [
            "Comprehensive topic research",
            "Fact-checking and verification",
            "Source suggestions",
            "Research planning",
            "Comparative analysis",
            "Executive summaries",
            "Confidence scoring"
        ],
        "use_cases": [
            "Academic research",
            "Business intelligence",
            "Fact verification",
            "Source comparison",
            "Research planning"
        ]
    }

@router.get("/features/content-optimization")
async def get_content_optimization_info():
    """Get information about advanced content optimization feature."""
    return {
        "feature": "advanced_content_optimization",
        "name": "Advanced Content Optimization",
        "description": "AI-powered content optimization for maximum impact",
        "available_plans": ["max"],
        "capabilities": [
            "Content structure optimization",
            "Readability improvements",
            "Engagement enhancement",
            "Audience alignment",
            "SEO optimization",
            "Performance metrics",
            "Improvement reports"
        ],
        "use_cases": [
            "Content marketing",
            "SEO content creation",
            "Academic writing",
            "Business communications",
            "Creative writing"
        ]
    }

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for smart features service."""
    return {
        "status": "healthy",
        "services": {
            "smart_summarization": "available",
            "research_assistant": "available",
            "content_optimization": "available"
        },
        "timestamp": "2024-01-01T00:00:00Z"
    }
