from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.core.feature_access import require_feature, has_feature_access, get_user_plan, get_available_features, get_feature_requirements
from app.services.ai import ai_service
from app.services.file_service import file_service
from app.services.web_scraping import WebScrapingService
from app.services.image_analysis_service import ImageAnalysisService
from app.services.diagram_service import diagram_service
from app.models.user import User
import logging
import uuid
from datetime import datetime
import pypdf
from docx import Document
import io
import base64
import json

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
image_analysis_service = ImageAnalysisService()

def detect_file_type_and_service(content_type: str, filename: str) -> dict:
    """
    Detect the type of file and determine which service should process it.
    """
    file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
    
    # Image files - route to image analysis
    if content_type.startswith('image/') or file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']:
        return {
            'type': 'image',
            'service': 'image_analysis',
            'analysis_type': 'general'
        }
    
    # Code files - route to AI code analysis
    elif file_extension in ['py', 'js', 'java', 'cpp', 'cc', 'c', 'html', 'htm', 'css', 'json', 'xml']:
        return {
            'type': 'code',
            'service': 'ai_analysis',
            'analysis_type': 'code_review'
        }
    
    # Data files - route to data analysis
    elif file_extension in ['csv', 'xls', 'xlsx']:
        return {
            'type': 'data',
            'service': 'ai_analysis',
            'analysis_type': 'data_analysis'
        }
    
    # Document files - route to document analysis
    elif content_type in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf']:
        return {
            'type': 'document',
            'service': 'ai_analysis',
            'analysis_type': 'document_analysis'
        }
    
    # Default to general AI analysis
    else:
        return {
            'type': 'unknown',
            'service': 'ai_analysis',
            'analysis_type': 'general'
        }

@router.post("/generate")
async def generate_content(
    prompt: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI content based on a prompt. This endpoint now routes to different services
    based on the content of the prompt and enforces feature access controls.
    """
    try:
        prompt_lower = prompt.lower()
        
        # Detect diagram requests
        if any(keyword in prompt_lower for keyword in ['create a diagram', 'generate chart', 'make a graph', 'draw a flowchart', 'create a bar chart', 'pie chart', 'line graph', 'scatter plot']):
            # Check if user has access to diagram generation
            if not has_feature_access(current_user, "diagram_generation", db):
                plan = get_user_plan(current_user, db)
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Diagram generation not available in your plan",
                        "feature": "diagram_generation",
                        "current_plan": plan,
                        "upgrade_message": "Upgrade to Pro plan to access diagram generation",
                        "upgrade_url": "/dashboard/price-plan"
                    }
                )
            
            try:
                # Route to diagram service
                result = await diagram_service.generate_diagram(
                    description=prompt,
                    diagram_type="auto",
                    style="modern"
                )
                return {
                    "content": f"Diagram generated successfully!\n\n{result}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "service_used": "diagram_generation",
                    "has_diagram": True
                }
            except Exception as e:
                logger.error(f"Diagram generation failed: {str(e)}")
                # Fallback to general AI
                pass
        
        # Detect code generation requests
        elif any(keyword in prompt_lower for keyword in ['write code', 'generate function', 'create a script', 'program in', 'code for', 'python script', 'javascript function', 'java class', 'html code']):
            # Check if user has access to code generation
            if not has_feature_access(current_user, "code_generation", db):
                plan = get_user_plan(current_user, db)
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Code generation not available in your plan",
                        "feature": "code_generation",
                        "current_plan": plan,
                        "upgrade_message": "Upgrade to Pro plan to access code generation",
                        "upgrade_url": "/dashboard/price-plan"
                    }
                )
            
            # Route to AI service with code generation focus
            code_prompt = f"Generate code for the following request: {prompt}\n\nPlease provide complete, working code with comments and explanations."
            content = await ai_service.generate_assignment_content_from_prompt(code_prompt)
            return {
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
                "service_used": "code_generation"
            }
        
        # Detect math problem solving
        elif any(keyword in prompt_lower for keyword in ['solve this math', 'calculate', 'equation', 'mathematical', 'solve for', 'find the value']):
            # Route to AI service with math focus
            math_prompt = f"Solve this mathematical problem step by step: {prompt}\n\nPlease show your work and explain each step."
            content = await ai_service.generate_assignment_content_from_prompt(math_prompt)
            return {
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
                "service_used": "math_solving"
            }
        
        # Default to general AI content generation
        else:
            content = await ai_service.generate_assignment_content_from_prompt(prompt)
            return {
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
                "service_used": "general_ai"
            }
            
    except HTTPException:
        # Re-raise HTTPExceptions (like 403 errors) without wrapping them
        raise
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
    Upload a file, extract its content, and process it with the appropriate service.
    Now supports images, code files, data files, and documents.
    """
    try:
        # Save the file
        file_path, _ = await file_service.save_file(file, current_user.id)
        
        # Detect file type and determine service
        content_type = file.content_type or "application/octet-stream"
        file_info = detect_file_type_and_service(content_type, file.filename)
        
        # Process based on file type
        if file_info['service'] == 'image_analysis':
            # Check if user has access to image analysis
            if not has_feature_access(current_user, "image_analysis", db):
                plan = get_user_plan(current_user, db)
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Image analysis not available in your plan",
                        "feature": "image_analysis",
                        "current_plan": plan,
                        "upgrade_message": "Upgrade to Pro plan to access image analysis",
                        "upgrade_url": "/dashboard/price-plan"
                    }
                )
            
            # Handle image files
            try:
                with open(file_path, 'rb') as img_file:
                    image_bytes = img_file.read()
                
                # Analyze image based on content type
                if file_info['analysis_type'] == 'general':
                    analysis = await image_analysis_service.analyze_image_and_answer(
                        image_data=image_bytes,
                        question="Provide a comprehensive analysis of this image",
                        context=None
                    )
                else:
                    analysis = await image_analysis_service.analyze_image_and_answer(
                        image_data=image_bytes,
                        question="Analyze this image and provide insights",
                        context=None
                    )
                
                return {
                    "id": str(uuid.uuid4()),
                    "name": file.filename,
                    "size": file.size,
                    "type": content_type,
                    "path": file_path,
                    "content": f"Image Analysis Results:\n{analysis}",
                    "analysis": analysis,
                    "service_used": "image_analysis",
                    "file_category": "image",
                    "uploaded_at": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Image analysis failed: {str(e)}")
                # Fallback to general analysis
                analysis = f"Image uploaded successfully. Analysis failed: {str(e)}"
        
        elif file_info['service'] == 'ai_analysis':
            # Handle text-based files (documents, code, data)
            content = await extract_file_content(file_path, content_type)
            
            # Create specialized prompts based on file type
            if file_info['type'] == 'code':
                # Check if user has access to code analysis
                if not has_feature_access(current_user, "code_generation", db):
                    plan = get_user_plan(current_user, db)
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "error": "Code analysis not available in your plan",
                            "feature": "code_generation",
                            "current_plan": plan,
                            "upgrade_message": "Upgrade to Pro plan to access code analysis",
                            "upgrade_url": "/dashboard/price-plan"
                        }
                    )
                
                analysis_prompt = f"Review and analyze this code:\n\n{content[:3000]}...\n\nProvide a comprehensive code review including:\n1. Code quality assessment\n2. Potential improvements\n3. Best practices suggestions\n4. Security considerations\n5. Performance optimizations"
            elif file_info['type'] == 'data':
                # Check if user has access to data analysis
                if not has_feature_access(current_user, "data_analysis", db):
                    plan = get_user_plan(current_user, db)
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "error": "Data analysis not available in your plan",
                            "feature": "data_analysis",
                            "current_plan": plan,
                            "upgrade_message": "Upgrade to Pro plan to access data analysis",
                            "upgrade_url": "/dashboard/price-plan"
                        }
                    )
                
                analysis_prompt = f"Analyze this data:\n\n{content[:3000]}...\n\nProvide insights including:\n1. Data structure analysis\n2. Key patterns and trends\n3. Statistical summary\n4. Data quality assessment\n5. Visualization suggestions"
            else:
                analysis_prompt = f"Analyze the following document content and provide comprehensive insights:\n\n{content[:3000]}..."
            
            analysis = await ai_service.generate_assignment_content_from_prompt(analysis_prompt)
            
            return {
                "id": str(uuid.uuid4()),
                "name": file.filename,
                "size": file.size,
                "type": content_type,
                "path": file_path,
                "content": content,
                "analysis": analysis,
                "service_used": "ai_analysis",
                "file_category": file_info['type'],
                "uploaded_at": datetime.utcnow().isoformat()
            }
        
        else:
            # Fallback for unknown file types
            content = f"File uploaded: {file.filename} (Type: {content_type})"
            analysis = "File uploaded successfully. Content analysis not available for this file type."
            
            return {
                "id": str(uuid.uuid4()),
                "name": file.filename,
                "size": file.size,
                "type": content_type,
                "path": file_path,
                "content": content,
                "analysis": analysis,
                "service_used": "file_upload",
                "file_category": "unknown",
                "uploaded_at": datetime.utcnow().isoformat()
            }
            
    except HTTPException:
        # Re-raise HTTPExceptions (like 403 errors) without wrapping them
        raise
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
    except HTTPException:
        raise
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

@router.get("/features")
async def get_user_features(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the user's available features based on their subscription plan.
    """
    try:
        from app.core.feature_access import get_available_features, get_user_plan, get_feature_requirements
        
        plan = get_user_plan(current_user, db)
        available_features = get_available_features(current_user, db)
        feature_requirements = get_feature_requirements()
        
        return {
            "current_plan": plan,
            "available_features": available_features,
            "feature_requirements": feature_requirements,
            "upgrade_url": "/dashboard/price-plan"
        }
    except Exception as e:
        logger.error(f"Error getting user features: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user features: {str(e)}")

async def extract_file_content(file_path: str, content_type: str) -> str:
    """
    Extract text content from various file types using proper parsing libraries.
    Now supports code files, data files, and additional document formats.
    """
    try:
        # Text-based files
        if content_type == "text/plain":
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        
        # PDF files
        elif content_type == "application/pdf":
            with open(file_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        
        # Word documents
        elif content_type in ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        
        # RTF files
        elif content_type == "application/rtf":
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                import re
                content = re.sub(r'\\[a-z]+\d*', '', content)
                content = re.sub(r'[{}]', '', content)
                return content.strip()
        
        # Code files
        elif content_type in ["text/x-python", "text/javascript", "text/x-java-source", "text/x-c++src", "text/x-csrc", "text/html", "text/css", "application/json", "text/xml"]:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        
        # Data files
        elif content_type in ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
            if content_type == "text/csv":
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                # For Excel files, return a placeholder (could be enhanced with pandas)
                return f"[Excel file content from {file_path} - Data analysis available through AI]"
        
        # Image files (return placeholder for analysis)
        elif content_type.startswith("image/"):
            return f"[Image file: {file_path} - Image analysis performed separately]"
        
        # Default fallback
        else:
            try:
                # Try to read as text
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except UnicodeDecodeError:
                # If text reading fails, return file info
                return f"[Binary file: {file_path} - Content type: {content_type}]"
                
    except Exception as e:
        logger.error(f"Error extracting content from file: {str(e)}")
        return f"[Error extracting content: {str(e)}]" 