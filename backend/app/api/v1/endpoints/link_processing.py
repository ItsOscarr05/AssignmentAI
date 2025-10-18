from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.models.user import User
from app.auth import get_current_user
from app.services.ai_service import AIService
from app.services.web_scraping import WebScrapingService
from app.services.link_analysis_service import LinkAnalysisService
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class LinkAnalysisRequest(BaseModel):
    link_id: str
    url: str
    content: str

class LinkAnalysisResponse(BaseModel):
    analysis: Dict[str, Any]

class ChatWithLinkRequest(BaseModel):
    link_id: str
    message: str
    content: str
    analysis: Dict[str, Any] = None

class ChatWithLinkResponse(BaseModel):
    response: str
    updated_analysis: Dict[str, Any] = None

class SuggestLinksRequest(BaseModel):
    topics: List[str]
    current_url: str

class SuggestLinksResponse(BaseModel):
    suggested_urls: List[str]

class ExtractContentRequest(BaseModel):
    url: str = Field(..., description="URL to extract content from")

@router.post("/analyze-link", response_model=LinkAnalysisResponse)
async def analyze_link_comprehensive(
    request: LinkAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Perform comprehensive AI analysis of a link including:
    - Content summarization
    - Key points extraction
    - Credibility assessment
    - Sentiment analysis
    - Related topics identification
    - Suggested actions
    """
    try:
        logger.info(f"Starting comprehensive link analysis for user {current_user.id}")
        
        # Initialize services
        ai_service = AIService(db=db)
        analysis_service = LinkAnalysisService()
        
        # Perform comprehensive analysis
        analysis = await analysis_service.analyze_content_comprehensive(
            content=request.content,
            url=request.url,
            ai_service=ai_service
        )
        
        logger.info(f"Link analysis completed successfully for user {current_user.id}")
        
        return LinkAnalysisResponse(analysis=analysis)
        
    except Exception as e:
        logger.error(f"Error in comprehensive link analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze link: {str(e)}"
        )

@router.post("/chat-with-link", response_model=ChatWithLinkResponse)
async def chat_with_link(
    request: ChatWithLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Interactive chat with AI about a specific link.
    Allows users to ask questions, request enhancements, and get insights.
    """
    try:
        logger.info(f"Processing chat message for link {request.link_id} from user {current_user.id}")
        
        ai_service = AIService(db=db)
        
        # Create context-aware prompt
        context_prompt = f"""
        You are an AI assistant helping analyze and discuss the following web content:

        URL: {request.url if hasattr(request, 'url') else 'N/A'}
        
        Content: {request.content[:2000]}...
        
        Current Analysis: {request.analysis if request.analysis else 'No analysis available'}
        
        User Question: {request.message}
        
        Please provide a helpful, accurate response based on the content and analysis.
        If the user is asking for enhancements, suggestions, or deeper analysis, provide actionable insights.
        If they're asking questions about the content, answer based on what you can infer from the provided information.
        """
        
        # Generate AI response
        response = await ai_service.generate_assignment_content_from_prompt(
            context_prompt, 
            user_id=current_user.id, 
            feature='link_chat', 
            action='chat_message'
        )
        
        # Check if the response suggests updating the analysis
        updated_analysis = None
        if any(keyword in request.message.lower() for keyword in ['reanalyze', 'update analysis', 'new insights']):
            analysis_service = LinkAnalysisService()
            updated_analysis = await analysis_service.analyze_content_comprehensive(
                content=request.content,
                url=getattr(request, 'url', ''),
                ai_service=ai_service
            )
        
        logger.info(f"Chat response generated successfully for user {current_user.id}")
        
        return ChatWithLinkResponse(
            response=response,
            updated_analysis=updated_analysis
        )
        
    except Exception as e:
        logger.error(f"Error in chat with link: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )

@router.post("/suggest-links", response_model=SuggestLinksResponse)
async def suggest_related_links(
    request: SuggestLinksRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate suggestions for related links based on topics and current URL.
    """
    try:
        logger.info(f"Generating related link suggestions for user {current_user.id}")
        
        ai_service = AIService(db=db)
        
        # Create prompt for link suggestions
        topics_str = ", ".join(request.topics)
        suggestion_prompt = f"""
        Based on the following topics: {topics_str}
        
        And the current URL: {request.current_url}
        
        Suggest 5-10 related URLs that would be valuable for research or learning.
        These should be authoritative sources that complement the current content.
        
        Focus on:
        - Academic sources
        - News articles
        - Expert opinions
        - Related research papers
        - Complementary viewpoints
        
        Return only the URLs, one per line.
        """
        
        # Generate suggestions
        suggestions_text = await ai_service.generate_assignment_content_from_prompt(
            suggestion_prompt, 
            user_id=current_user.id, 
            feature='link_suggestions', 
            action='suggest_related'
        )
        
        # Parse URLs from response
        suggested_urls = []
        for line in suggestions_text.split('\n'):
            line = line.strip()
            if line and ('http' in line or 'www.' in line):
                # Extract URL from line
                if 'http' in line:
                    url = line.split('http')[1]
                    if url:
                        suggested_urls.append('http' + url.split()[0])
        
        logger.info(f"Generated {len(suggested_urls)} link suggestions for user {current_user.id}")
        
        return SuggestLinksResponse(suggested_urls=suggested_urls[:10])  # Limit to 10
        
    except Exception as e:
        logger.error(f"Error generating link suggestions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate link suggestions: {str(e)}"
        )

@router.post("/extract-content")
async def extract_link_content(
    request: ExtractContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extract and preprocess content from a URL for analysis.
    """
    try:
        logger.info(f"Extracting content from {request.url} for user {current_user.id}")
        
        async with WebScrapingService() as scraper:
            result = await scraper.extract_content_from_url(request.url)
            
        logger.info(f"Content extraction completed for user {current_user.id}")
        
        return {
            "url": request.url,
            "title": result.get('title', ''),
            "content": result.get('content', ''),
            "type": result.get('type', 'unknown'),
            "extracted_at": result.get('extracted_at', ''),
            "metadata": result.get('metadata', {})
        }
        
    except Exception as e:
        logger.error(f"Error extracting content from {request.url}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract content: {str(e)}"
        )
