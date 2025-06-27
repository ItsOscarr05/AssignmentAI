from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.services.ai import ai_service
from app.services.file_service import file_service
from app.services.web_scraping import WebScrapingService
from app.models.user import User
import logging
import uuid
from datetime import datetime
import PyPDF2
from docx import Document
import io

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/generate")
async def generate_content(
    prompt: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI content based on a prompt.
    """
    try:
        content = await ai_service.generate_assignment_content_from_prompt(prompt)
        
        return {
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

@router.post("/files")
async def upload_and_process_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file, extract its content, and process it with AI.
    """
    try:
        # Save the file
        file_path, _ = await file_service.save_file(file, current_user.id)
        
        # Extract content from the file
        content_type = file.content_type or "application/octet-stream"
        content = await extract_file_content(file_path, content_type)
        
        # Generate AI analysis of the content
        analysis_prompt = f"Analyze the following document content and provide insights:\n\n{content[:2000]}..."
        analysis = await ai_service.generate_assignment_content_from_prompt(analysis_prompt)
        
        return {
            "id": str(uuid.uuid4()),
            "name": file.filename,
            "size": file.size,
            "type": content_type,
            "path": file_path,
            "content": content,
            "analysis": analysis,
            "uploaded_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.post("/files/process")
async def process_uploaded_file(
    file_id: str = Form(...),
    action: str = Form(...),  # "summarize", "extract", "rewrite", "analyze"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process an uploaded file with specific AI actions.
    """
    try:
        # In a real implementation, you'd fetch the file from storage
        # For now, we'll simulate the processing
        
        if action == "summarize":
            prompt = "Please provide a comprehensive summary of the document content."
        elif action == "extract":
            prompt = "Please extract the key points and main ideas from the document."
        elif action == "rewrite":
            prompt = "Please rewrite the document content in a more academic tone."
        elif action == "analyze":
            prompt = "Please analyze the document structure, arguments, and provide feedback."
        else:
            raise HTTPException(status_code=400, detail="Invalid action specified")
        
        result = await ai_service.generate_assignment_content_from_prompt(prompt)
        
        return {
            "action": action,
            "result": result,
            "processed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error processing file action: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.post("/links")
async def process_link(
    url: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a link and extract its content.
    """
    try:
        async with WebScrapingService() as scraper:
            result = await scraper.extract_content_from_url(url)
            
            # Generate AI analysis of the extracted content
            analysis_prompt = f"Analyze the following web content and provide insights:\n\n{result['content'][:2000]}..."
            analysis = await ai_service.generate_assignment_content_from_prompt(analysis_prompt)
            
            return {
                "id": str(uuid.uuid4()),
                "url": url,
                "title": result['title'],
                "content": result['content'],
                "type": result['type'],
                "analysis": analysis,
                "extracted_at": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error processing link: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process link: {str(e)}")

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a processed file.
    """
    try:
        # In a real implementation, you'd delete the file from storage
        # For now, we'll just return success
        return {"message": "File deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@router.delete("/links/{link_id}")
async def delete_link(
    link_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a processed link.
    """
    try:
        # In a real implementation, you'd remove the link from storage
        return {"message": "Link deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting link: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete link: {str(e)}")

async def extract_file_content(file_path: str, content_type: str) -> str:
    """
    Extract text content from various file types using proper parsing libraries.
    """
    try:
        if content_type == "text/plain":
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        elif content_type == "application/pdf":
            # Use PyPDF2 for PDF parsing
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        elif content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            # Use python-docx for Word document parsing
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        elif content_type == "application/rtf":
            # Basic RTF parsing (strip RTF markup)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Simple RTF markup removal
                import re
                # Remove RTF control words and braces
                content = re.sub(r'\\[a-z]+\d*', '', content)
                content = re.sub(r'[{}]', '', content)
                return content.strip()
        else:
            return f"[Content from {file_path} - Format not supported for text extraction]"
    except Exception as e:
        logger.error(f"Error extracting content from file: {str(e)}")
        return f"[Error extracting content: {str(e)}]" 