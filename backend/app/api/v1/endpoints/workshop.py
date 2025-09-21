from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.core.feature_access import require_feature, has_feature_access, get_user_plan, get_available_features, get_feature_requirements
from app.services.ai_service import AIService
from app.services.file_service import file_service
from app.services.web_scraping import WebScrapingService
from app.services.image_analysis_service import ImageAnalysisService
from app.services.diagram_service import diagram_service
from app.models.user import User
from app.crud import file_upload as file_upload_crud
from app.schemas.file_upload import FileUploadCreate
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

# Note: AIService will be instantiated per request with db session

@router.get("/health")
async def workshop_health_check():
    """
    Health check endpoint for the workshop service.
    """
    return {
        "status": "healthy",
        "service": "workshop",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Workshop service is running and ready to process requests!"
    }

@router.get("/quota-status")
async def check_openai_quota():
    """
    Check OpenAI API quota status and usage.
    """
    try:
        import os
        from openai import OpenAI
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {
                "status": "error",
                "message": "OpenAI API key not configured",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        client = OpenAI(api_key=api_key)
        
        # Try to make a minimal API call to check quota
        try:
            response = client.chat.completions.create(
                model="gpt-5-nano",
                messages=[{"role": "user", "content": "Hello"}],
                max_completion_tokens=5
            )
            
            return {
                "status": "healthy",
                "message": "OpenAI API quota available",
                "quota_status": "available",
                "timestamp": datetime.utcnow().isoformat(),
                "test_response": "Success"
            }
            
        except Exception as e:
            error_message = str(e)
            if "insufficient_quota" in error_message.lower() or "quota_exceeded" in error_message.lower():
                return {
                    "status": "quota_exceeded",
                    "message": "OpenAI API quota exceeded",
                    "quota_status": "exceeded",
                    "error": error_message,
                    "timestamp": datetime.utcnow().isoformat()
                }
            elif "rate_limit" in error_message.lower() or "429" in error_message:
                return {
                    "status": "rate_limited",
                    "message": "OpenAI API rate limit hit",
                    "quota_status": "rate_limited",
                    "error": error_message,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "status": "error",
                    "message": "OpenAI API error",
                    "quota_status": "error",
                    "error": error_message,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
    except Exception as e:
        logger.error(f"Error checking OpenAI quota: {e}")
        return {
            "status": "error",
            "message": "Failed to check quota status",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Initialize services
image_analysis_service = ImageAnalysisService()

def create_file_upload_record(
    db: Session,
    user_id: int,
    file: UploadFile,
    file_path: str,
    file_type: str,
    extracted_content: str = None,
    ai_analysis: str = None,
    processing_status: str = "completed"
) -> dict:
    """Create a file upload record in the database"""
    try:
        file_upload_data = FileUploadCreate(
            filename=file.filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=file.size,
            mime_type=file.content_type or "application/octet-stream",
            file_type=file_type,
            extracted_content=extracted_content,
            ai_analysis=ai_analysis,
            processing_status=processing_status,
            is_link=False,
            upload_metadata={
                "uploaded_via": "workshop",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        db_file_upload = file_upload_crud.create_file_upload(db, file_upload_data, user_id)
        return {
            "file_upload_id": db_file_upload.id,
            "success": True
        }
    except Exception as e:
        logger.error(f"Failed to create file upload record: {str(e)}")
        return {
            "file_upload_id": None,
            "success": False,
            "error": str(e)
        }

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
    prompt: str = Body(..., embed=True),
    conversation_history: List[dict] = Body(default=[]),
    stream: bool = Body(default=False, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI content based on a prompt. This endpoint now routes to different services
    based on the content of the prompt and enforces feature access controls.
    Supports streaming responses for real-time chat experience.
    """
    # Add comprehensive logging
    logger.info(f"=== WORKSHOP GENERATE ENDPOINT CALLED ===")
    logger.info(f"User ID: {current_user.id}")
    logger.info(f"User email: {current_user.email}")
    # Log prompt with Unicode handling
    try:
        logger.info(f"Received prompt: {prompt}")
    except UnicodeEncodeError:
        logger.info(f"Received prompt (length: {len(prompt)} characters)")
    logger.info(f"Prompt length: {len(prompt)} characters")
    logger.info(f"Request timestamp: {datetime.utcnow()}")

    # Initialize AI service with database session
    ai_service = AIService(db=db)

    try:
        prompt_lower = prompt.lower()
        
        # Detect diagram requests
        logger.info("Checking for diagram generation keywords...")
        if any(keyword in prompt_lower for keyword in ['create a diagram', 'generate chart', 'make a graph', 'draw a flowchart', 'create a bar chart', 'pie chart', 'line graph', 'scatter plot']):
            logger.info("Diagram generation keywords detected!")
            # Check if user has access to diagram generation
            logger.info("Checking diagram generation feature access...")
            if not has_feature_access(current_user, "diagram_generation", db):
                plan = get_user_plan(current_user, db)
                logger.warning(f"User {current_user.id} denied access to diagram generation. Plan: {plan}")
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
                logger.info("Calling diagram service...")
                result = await diagram_service.generate_diagram(
                    description=prompt,
                    diagram_type="auto",
                    style="modern"
                )
                logger.info(f"Diagram generation successful! Result length: {len(str(result))}")
                return {
                    "content": f"Diagram generated successfully!\n\n{result}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "service_used": "diagram_generation",
                    "has_diagram": True
                }
            except Exception as e:
                logger.error(f"Diagram generation failed: {str(e)}")
                logger.info("Falling back to general AI service...")
                # Fallback to general AI
                content = await ai_service.generate_assignment_content_from_prompt(prompt)
                logger.info(f"General AI fallback completed. Content length: {len(content)} characters")
                return {
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat(),
                    "service_used": "general_ai_fallback"
                }
        
        # Detect code generation requests
        elif any(keyword in prompt_lower for keyword in ['write code', 'generate function', 'create a script', 'program in', 'code for', 'python script', 'javascript function', 'java class', 'html code']):
            logger.info("Code generation keywords detected!")
            # Check if user has access to code generation
            logger.info("Checking code generation feature access...")
            if not has_feature_access(current_user, "code_analysis", db):
                plan = get_user_plan(current_user, db)
                logger.warning(f"User {current_user.id} denied access to code analysis. Plan: {plan}")
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "Code analysis not available in your plan",
                        "feature": "code_analysis",
                        "current_plan": plan,
                        "upgrade_message": "Upgrade to Pro plan to access code analysis",
                        "upgrade_url": "/dashboard/price-plan"
                    }
                )
            
            # Route to AI service with code generation focus
            logger.info("Routing to AI service for code generation...")
            code_prompt = f"Generate code for the following request: {prompt}\n\nPlease provide complete, working code with comments and explanations."
            content = await ai_service.generate_assignment_content_from_prompt(code_prompt)
            logger.info(f"Code generation completed. Content length: {len(content)} characters")
            return {
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
                "service_used": "code_analysis"
            }
        
        # Detect math problem solving
        elif any(keyword in prompt_lower for keyword in ['solve this math', 'calculate', 'equation', 'mathematical', 'solve for', 'find the value']):
            logger.info("Math problem solving keywords detected!")
            # Route to AI service with math focus
            logger.info("Routing to AI service for math solving...")
            math_prompt = f"Solve this mathematical problem step by step: {prompt}\n\nPlease show your work and explain each step."
            content = await ai_service.generate_assignment_content_from_prompt(math_prompt)
            logger.info(f"Math solving completed. Content length: {len(content)} characters")
            return {
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
                "service_used": "math_solving"
            }
        
        # Default to general AI content generation
        else:
            logger.info("No specific service detected, using general AI content generation...")
            logger.info("Routing to AI service for general content...")
            
            # Check if this looks like a simple chat message vs assignment request
            # Simple indicators: short message, conversational tone, questions, etc.
            is_simple_chat = (
                len(prompt.split()) <= 10 or  # Short messages
                prompt.endswith('?') or  # Questions
                any(word in prompt.lower() for word in ['hi', 'hello', 'hey', 'thanks', 'thank you', 'help', 'what', 'how', 'why', 'when', 'where', 'who']) or
                not any(word in prompt.lower() for word in ['assignment', 'homework', 'project', 'essay', 'report', 'paper', 'lesson', 'curriculum'])
            )
            
            if is_simple_chat:
                logger.info("Detected simple chat message, using GPT conversational AI...")
                
                # Check if streaming is requested
                if stream:
                    logger.info("Streaming response requested for chat message")
                    
                    async def generate_stream():
                        try:
                            logger.info("Starting streaming generation...")
                            chunk_count = 0
                            async for chunk in ai_service.generate_chat_response_stream(prompt, conversation_history, current_user.id):
                                chunk_count += 1
                                # Log chunk info without full content to avoid Unicode issues
                                chunk_preview = chunk[:100].replace('\n', ' ').replace('\r', ' ') if chunk else ""
                                logger.info(f"Yielding chunk {chunk_count} ({len(chunk)} chars): {chunk_preview}...")
                                # Format chunk as Server-Sent Events
                                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
                            logger.info(f"Streaming completed. Total chunks: {chunk_count}")
                            # Send final completion signal
                            yield f"data: {json.dumps({'content': '', 'done': True, 'timestamp': datetime.utcnow().isoformat(), 'service_used': 'gpt_chat_stream'})}\n\n"
                        except Exception as e:
                            logger.error(f"Error in streaming response: {str(e)}")
                            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
                    
                    return StreamingResponse(
                        generate_stream(),
                        media_type="text/event-stream",
                        headers={
                            "Cache-Control": "no-cache",
                            "Connection": "keep-alive",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Headers": "*"
                        }
                    )
                else:
                    # Use conversation history passed from frontend and user's subscription model
                    content = await ai_service.generate_chat_response(prompt, conversation_history, current_user.id)
                    logger.info(f"GPT chat response completed. Content length: {len(content)} characters")
                    return {
                        "content": content,
                        "timestamp": datetime.utcnow().isoformat(),
                        "service_used": "gpt_chat"
                    }
            else:
                logger.info("Detected assignment request, using assignment-focused AI...")
                content = await ai_service.generate_assignment_content_from_prompt(prompt)
                logger.info(f"Assignment generation completed. Content length: {len(content)} characters")
                return {
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat(),
                    "service_used": "general_ai"
                }
        
        # Add final success log
        logger.info("=== WORKSHOP GENERATE ENDPOINT COMPLETED SUCCESSFULLY ===")
        logger.info(f"User ID: {current_user.id}")
        logger.info(f"Service used: general_ai")
        logger.info(f"Timestamp: {datetime.utcnow()}")
            
    except HTTPException as e:
        # Re-raise HTTPExceptions (like 403 errors) without wrapping them
        logger.warning(f"HTTPException raised: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"=== ERROR IN WORKSHOP GENERATE ENDPOINT ===")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error(f"User ID: {current_user.id}")
        logger.error(f"Prompt: {prompt}")
        logger.error(f"Timestamp: {datetime.utcnow()}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error during content generation")

@router.post("/files/test")
async def test_file_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Simple test endpoint to debug 422 errors
    """
    logger.info(f"=== TEST FILE UPLOAD ENDPOINT CALLED ===")
    logger.info(f"User ID: {current_user.id}")
    logger.info(f"File name: {file.filename}")
    logger.info(f"File size: {file.size}")
    logger.info(f"File content type: {file.content_type}")
    
    return {
        "message": "File upload test successful",
        "filename": file.filename,
        "size": file.size,
        "content_type": file.content_type
    }

@router.post("/files/debug")
async def debug_file_upload(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Debug endpoint to see raw request data
    """
    logger.info(f"=== DEBUG FILE UPLOAD ENDPOINT CALLED ===")
    logger.info(f"User ID: {current_user.id}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request content type: {request.headers.get('content-type')}")
    
    # Try to read the request body
    try:
        body = await request.body()
        logger.info(f"Request body length: {len(body)}")
        logger.info(f"Request body preview: {body[:200]}")
    except Exception as e:
        logger.error(f"Error reading request body: {e}")
    
    return {
        "message": "Debug endpoint called",
        "user_id": current_user.id,
        "content_type": request.headers.get('content-type'),
        "body_length": len(await request.body()) if hasattr(request, 'body') else 0
    }

@router.post("/files")
async def upload_and_process_file(
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file, extract its content, and process it with the appropriate service.
    Now supports images, code files, data files, and documents.
    """
    # Add comprehensive logging
    logger.info(f"=== WORKSHOP FILES ENDPOINT CALLED ===")
    logger.info(f"User ID: {current_user.id}")
    logger.info(f"User email: {current_user.email}")
    logger.info(f"File object: {file}")
    logger.info(f"File name: {file.filename if file else 'None'}")
    logger.info(f"File size: {file.size if file else 'None'} bytes")
    logger.info(f"File content type: {file.content_type if file else 'None'}")
    logger.info(f"Request timestamp: {datetime.utcnow()}")
    
    # Validate file input
    if not file or not file.filename:
        logger.error("No file provided or no filename provided")
        raise HTTPException(status_code=422, detail="No file provided")
    
    if not file.content_type:
        logger.warning("No content type provided, will attempt to detect")
    
    logger.info(f"File validation passed - proceeding with processing")
    
    try:
        # Save the file
        logger.info("Saving uploaded file...")
        try:
            file_path, _ = await file_service.save_file(file, current_user.id)
            logger.info(f"File saved successfully to: {file_path}")
        except Exception as e:
            logger.error(f"Failed to save file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
        # Detect file type and determine service
        content_type = file.content_type or "application/octet-stream"
        logger.info(f"Detecting file type for content_type: {content_type}, filename: {file.filename}")
        file_info = detect_file_type_and_service(content_type, file.filename)
        logger.info(f"File detection result: {file_info}")
        
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
                
                # Create file upload record
                upload_record = create_file_upload_record(
                    db, current_user.id, file, file_path, "image", 
                    extracted_content=None, ai_analysis=analysis
                )
                
                return {
                    "id": str(uuid.uuid4()),
                    "file_upload_id": upload_record.get("file_upload_id"),
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
                
                # Create file upload record
                upload_record = create_file_upload_record(
                    db, current_user.id, file, file_path, "image", 
                    extracted_content=None, ai_analysis=analysis, processing_status="failed"
                )
                
                return {
                    "id": str(uuid.uuid4()),
                    "file_upload_id": upload_record.get("file_upload_id"),
                    "name": file.filename,
                    "size": file.size,
                    "type": content_type,
                    "path": file_path,
                    "content": f"Image Upload Results:\n{analysis}",
                    "analysis": analysis,
                    "service_used": "image_upload",
                    "file_category": "image",
                    "uploaded_at": datetime.utcnow().isoformat()
                }
        
        elif file_info['service'] == 'ai_analysis':
            # Handle text-based files (documents, code, data)
            logger.info(f"Processing file with AI analysis - type: {file_info['type']}, analysis_type: {file_info['analysis_type']}")
            try:
                content = await extract_file_content(file_path, content_type)
                logger.info(f"File content extracted successfully, length: {len(content)}")
                logger.info(f"Content preview (first 200 chars): {content[:200]}...")
            except Exception as e:
                logger.error(f"Failed to extract file content: {str(e)}")
                logger.error(f"Exception type: {type(e).__name__}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                content = f"Error extracting content from {file.filename}: {str(e)}"
            
            # Create specialized prompts based on file type
            if file_info['type'] == 'code':
                # Check if user has access to code analysis
                if not has_feature_access(current_user, "code_analysis", db):
                    plan = get_user_plan(current_user, db)
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "error": "Code analysis not available in your plan",
                            "feature": "code_analysis",
                            "current_plan": plan,
                            "upgrade_message": "Upgrade to Plus plan to access code analysis",
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
            
            logger.info(f"Generating AI analysis with prompt length: {len(analysis_prompt)}")
            logger.info(f"Analysis prompt preview: {analysis_prompt[:200]}...")
            try:
                # Initialize AI service with existing db session
                ai_service = AIService(db=db)
                analysis = await ai_service.generate_assignment_content_from_prompt(analysis_prompt)
                logger.info(f"AI analysis completed successfully, length: {len(analysis)}")
                logger.info(f"Analysis preview (first 200 chars): {analysis[:200]}...")
            except Exception as e:
                logger.error(f"AI analysis failed: {str(e)}")
                logger.error(f"Exception type: {type(e).__name__}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                analysis = f"Analysis failed: {str(e)}"
            
            logger.info("Preparing response for AI analysis...")
            
            # Create file upload record
            upload_record = create_file_upload_record(
                db, current_user.id, file, file_path, file_info['type'], 
                extracted_content=content, ai_analysis=analysis
            )
            
            response_data = {
                "id": str(uuid.uuid4()),
                "file_upload_id": upload_record.get("file_upload_id"),
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
            logger.info(f"Response prepared successfully. Content length: {len(content)}, Analysis length: {len(analysis)}")
            logger.info("=== WORKSHOP FILES ENDPOINT COMPLETED SUCCESSFULLY ===")
            return response_data
        
        else:
            # Fallback for unknown file types
            content = f"File uploaded: {file.filename} (Type: {content_type})"
            analysis = "File uploaded successfully. Content analysis not available for this file type."
            
            # Create file upload record
            upload_record = create_file_upload_record(
                db, current_user.id, file, file_path, "unknown", 
                extracted_content=content, ai_analysis=analysis
            )
            
            return {
                "id": str(uuid.uuid4()),
                "file_upload_id": upload_record.get("file_upload_id"),
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
            
    except HTTPException as e:
        # Re-raise HTTPExceptions (like 403 errors) without wrapping them
        logger.error(f"HTTPException in file processing: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing file: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"File details - name: {file.filename}, size: {file.size}, type: {file.content_type}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.post("/files/process")
async def process_uploaded_file(
    file_id: str = Body(..., embed=True),
    action: str = Body(..., embed=True),  # "summarize", "extract", "rewrite", "analyze"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process an uploaded file with specific AI actions.
    """
    # Add comprehensive logging
    logger.info(f"=== WORKSHOP FILES/PROCESS ENDPOINT CALLED ===")
    logger.info(f"User ID: {current_user.id}")
    logger.info(f"User email: {current_user.email}")
    logger.info(f"File ID: {file_id}")
    logger.info(f"Action: {action}")
    logger.info(f"Request timestamp: {datetime.utcnow()}")
    
    try:
        # In a real implementation, you'd fetch the file from storage
        # For now, we'll simulate the processing
        logger.info("Processing file with AI service...")
        if action == "summarize":
            prompt = "Please provide a comprehensive summary of the document content."
        elif action == "extract":
            prompt = "Please extract the key points and main ideas from the document."
        elif action == "rewrite":
            prompt = "Please rewrite the document content in a more academic tone."
        elif action == "analyze":
            prompt = "Please analyze the document structure, arguments, and provide feedback."
        else:
            logger.error(f"Invalid action specified: {action}")
            raise HTTPException(status_code=400, detail="Invalid action specified")
        
        logger.info(f"Generated prompt: {prompt}")
        result = await ai_service.generate_assignment_content_from_prompt(prompt)
        logger.info(f"AI processing completed. Result length: {len(result)}")
        logger.info("=== WORKSHOP FILES/PROCESS ENDPOINT COMPLETED SUCCESSFULLY ===")
        
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
    url: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a link and extract its content.
    """
    # Add comprehensive logging
    logger.info(f"=== WORKSHOP LINKS ENDPOINT CALLED ===")
    logger.info(f"User ID: {current_user.id}")
    logger.info(f"User email: {current_user.email}")
    logger.info(f"URL: {url}")
    logger.info(f"Request timestamp: {datetime.utcnow()}")
    
    try:
        logger.info("Initializing web scraping service...")
        async with WebScrapingService() as scraper:
            logger.info("Extracting content from URL...")
            result = await scraper.extract_content_from_url(url)
            logger.info(f"Content extraction completed. Title: {result['title']}, Content length: {len(result['content'])}")
            
            # Generate AI analysis of the extracted content
            logger.info("Generating AI analysis of extracted content...")
            analysis_prompt = f"Analyze the following web content and provide insights:\n\n{result['content'][:2000]}..."
            analysis = await ai_service.generate_assignment_content_from_prompt(analysis_prompt)
            logger.info(f"AI analysis completed. Analysis length: {len(analysis)}")
            
            # Create file upload record for link
            try:
                file_upload_data = FileUploadCreate(
                    filename=result['title'] or url,
                    original_filename=result['title'] or url,
                    file_path=url,
                    file_size=len(result['content']),
                    mime_type="text/html",
                    file_type="link",
                    extracted_content=result['content'],
                    ai_analysis=analysis,
                    processing_status="completed",
                    is_link=True,
                    link_url=url,
                    link_title=result['title'],
                    link_description=result['content'][:500] + "..." if len(result['content']) > 500 else result['content'],
                    upload_metadata={
                        "uploaded_via": "workshop",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                
                db_file_upload = file_upload_crud.create_file_upload(db, file_upload_data, current_user.id)
                file_upload_id = db_file_upload.id
            except Exception as e:
                logger.error(f"Failed to create file upload record for link: {str(e)}")
                file_upload_id = None
            
            logger.info("=== WORKSHOP LINKS ENDPOINT COMPLETED SUCCESSFULLY ===")
            return {
                "id": str(uuid.uuid4()),
                "file_upload_id": file_upload_id,
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
    logger.info(f"Extracting content from file: {file_path}, content_type: {content_type}")
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
            logger.info(f"Processing DOCX/DOC file: {file_path}")
            try:
                doc = Document(file_path)
                text = ""
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                logger.info(f"DOCX content extracted successfully, length: {len(text)}")
                return text.strip()
            except Exception as e:
                logger.error(f"Failed to extract DOCX content: {str(e)}")
                logger.error(f"Exception type: {type(e).__name__}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise
        
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
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"File path: {file_path}, Content type: {content_type}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return f"[Error extracting content: {str(e)}]" 