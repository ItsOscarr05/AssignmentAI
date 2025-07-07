from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.services.web_scraping import WebScrapingService
from app.services.export_service import ExportService
from app.services.ai_service import AIService
from pydantic import BaseModel
import logging
import base64

logger = logging.getLogger(__name__)
router = APIRouter()

# Request/Response models
class LinkSubmissionRequest(BaseModel):
    url: str

class LinkSubmissionResponse(BaseModel):
    id: str
    url: str
    title: str
    content: str
    type: str
    status: str
    extracted_at: float

class ExportRequest(BaseModel):
    content: str
    format: str
    options: Dict[str, Any]

class ChatMessageRequest(BaseModel):
    message: str
    context: str = ""

class ChatMessageResponse(BaseModel):
    response: str
    tokens_used: int
    model_used: str

@router.post("/extract-from-link", response_model=LinkSubmissionResponse)
async def extract_content_from_link(
    request: LinkSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extract content from a URL (Google Docs, public documents, webpages).
    """
    try:
        async with WebScrapingService() as scraper:
            result = await scraper.extract_content_from_url(request.url)
            
            return LinkSubmissionResponse(
                id=str(hash(request.url)),
                url=request.url,
                title=result['title'],
                content=result['content'],
                type=result['type'],
                status='completed',
                extracted_at=result['extracted_at']
            )
    except Exception as e:
        logger.error(f"Error extracting content from link: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/validate-link")
async def validate_link(
    request: LinkSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate if a URL is accessible and get basic metadata.
    """
    try:
        async with WebScrapingService() as scraper:
            result = await scraper.validate_url(request.url)
            return result
    except Exception as e:
        logger.error(f"Error validating link: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/chat/generate")
async def generate_chat_response(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI response for chat-based assignment input.
    """
    try:
        # Create a simplified AI service for chat generation (no database needed)
        from openai import AsyncOpenAI
        from app.core.config import settings
        
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Create a prompt that includes context if provided
        prompt = request.message
        if request.context:
            prompt = f"Context: {request.context}\n\nUser Request: {request.message}"
        
        # Construct a system prompt for chat-based generation
        system_prompt = """You are an expert educational content creator. 
        When given a description of an assignment, create a comprehensive, 
        well-structured assignment that includes:
        
        1. Clear title and description
        2. Learning objectives
        3. Detailed instructions
        4. Requirements and deliverables
        5. Evaluation criteria
        6. Estimated time and resources needed
        
        Format the response in a clear, structured manner that students can easily follow.
        Make sure the assignment is appropriate for the described level and subject."""
        
        # Call OpenAI API directly
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=settings.AI_TEMPERATURE,
            top_p=settings.AI_TOP_P,
            frequency_penalty=settings.AI_FREQUENCY_PENALTY,
            presence_penalty=settings.AI_PRESENCE_PENALTY
        )
        
        content = response.choices[0].message.content
        if content is None:
            raise ValueError("OpenAI returned None content")
        response_text = content
        
        return ChatMessageResponse(
            response=response_text,
            tokens_used=len(response_text.split()),  # Approximate token count
            model_used="gpt-4"
        )
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")

@router.post("/export/{format}")
async def export_assignment(
    format: str,
    request: ExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export assignment content in various formats (PDF, DOCX, Google Docs).
    """
    try:
        export_service = ExportService()
        
        if format == "pdf":
            pdf_content = await export_service.export_to_pdf(request.content, request.options)
            encoded_content = base64.b64encode(pdf_content).decode("utf-8")
            return {
                "content": encoded_content,
                "format": "pdf",
                "filename": f"{request.options.get('customTitle', 'assignment')}.pdf",
                "content_type": "application/pdf"
            }
        elif format == "docx":
            word_content = await export_service.export_to_word(request.content, request.options)
            encoded_content = base64.b64encode(word_content).decode("utf-8")
            return {
                "content": encoded_content,
                "format": "docx",
                "filename": f"{request.options.get('customTitle', 'assignment')}.docx",
                "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
        elif format == "google-docs":
            gdocs_content = await export_service.export_to_google_docs(request.content, request.options)
            return {
                "content": gdocs_content,
                "format": "google-docs",
                "filename": f"{request.options.get('customTitle', 'assignment')}.txt",
                "content_type": "text/plain"
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported export format: {format}")
            
    except Exception as e:
        logger.error(f"Error exporting assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export assignment: {str(e)}")

@router.get("/export/formats")
async def get_export_formats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get available export formats and their capabilities.
    """
    try:
        export_service = ExportService()
        formats = await export_service.get_export_formats()
        return formats
    except Exception as e:
        logger.error(f"Error getting export formats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get export formats: {str(e)}")

@router.post("/process-multiple-inputs")
async def process_multiple_inputs(
    files: List[UploadFile] = File([]),
    links: List[str] = Form([]),
    chat_prompt: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process multiple input types (files, links, chat) and combine them.
    """
    try:
        results = {
            "files": [],
            "links": [],
            "chat": None,
            "combined_content": ""
        }
        
        # Process uploaded files
        for file in files:
            # Here you would process the file content
            # For now, we'll just store file info
            results["files"].append({
                "filename": file.filename,
                "size": file.size,
                "content_type": file.content_type
            })
        
        # Process links
        async with WebScrapingService() as scraper:
            for link in links:
                try:
                    content = await scraper.extract_content_from_url(link)
                    results["links"].append({
                        "url": link,
                        "title": content["title"],
                        "content": content["content"][:500] + "..." if len(content["content"]) > 500 else content["content"]
                    })
                except Exception as e:
                    results["links"].append({
                        "url": link,
                        "error": str(e)
                    })
        
        # Process chat prompt
        if chat_prompt:
            # Create a simplified AI service for chat generation (no database needed)
            from openai import AsyncOpenAI
            from app.core.config import settings
            
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Construct a system prompt for chat-based generation
            system_prompt = """You are an expert educational content creator. 
            When given a description of an assignment, create a comprehensive, 
            well-structured assignment that includes:
            
            1. Clear title and description
            2. Learning objectives
            3. Detailed instructions
            4. Requirements and deliverables
            5. Evaluation criteria
            6. Estimated time and resources needed
            
            Format the response in a clear, structured manner that students can easily follow.
            Make sure the assignment is appropriate for the described level and subject."""
            
            # Call OpenAI API directly
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": chat_prompt}
                ],
                max_tokens=settings.AI_MAX_TOKENS,
                temperature=settings.AI_TEMPERATURE,
                top_p=settings.AI_TOP_P,
                frequency_penalty=settings.AI_FREQUENCY_PENALTY,
                presence_penalty=settings.AI_PRESENCE_PENALTY
            )
            
            content = response.choices[0].message.content
            if content is None:
                content = "No response generated"
            
            results["chat"] = {
                "prompt": chat_prompt,
                "response": content
            }
        
        # Combine all content
        combined_parts = []
        
        if results["chat"]:
            combined_parts.append(f"AI Generated Content:\n{results['chat']['response']}")
        
        for link_result in results["links"]:
            if "content" in link_result:
                combined_parts.append(f"Content from {link_result['url']}:\n{link_result['content']}")
        
        results["combined_content"] = "\n\n".join(combined_parts)
        
        return results
        
    except Exception as e:
        logger.error(f"Error processing multiple inputs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process inputs: {str(e)}") 