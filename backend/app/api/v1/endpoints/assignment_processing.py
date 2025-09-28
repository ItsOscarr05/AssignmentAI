"""
Assignment Processing API Endpoints
Implements the core file upload and processing functionality per PRD requirements
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import tempfile
from pathlib import Path

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.services.file_processing_service import FileProcessingService
from app.services.job_queue_service import job_queue_service
from app.services.preview_edit_service import preview_edit_service
from app.core.logger import logger

router = APIRouter()

@router.post("/upload-and-process")
async def upload_and_process_assignment(
    file: UploadFile = File(...),
    subscription_tier: str = "free",
    priority: str = "normal",
    create_preview: bool = True,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file and process it for assignment completion
    Main entry point for the AssignmentAI functionality
    """
    try:
        # Validate file size (25MB limit per PRD)
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > 25 * 1024 * 1024:  # 25MB
            raise HTTPException(
                status_code=413,
                detail="File size exceeds 25MB limit"
            )
        
        # Validate file type
        file_extension = Path(file.filename).suffix[1:].lower()
        supported_extensions = {
            # Document-based (PRD requirement)
            'pdf', 'doc', 'docx', 'txt', 'rtf',
            # Image-based (OCR required) (PRD requirement)
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff',
            # Code-based (PRD requirement)
            'py', 'js', 'java', 'cpp', 'c', 'html', 'css',
            # Spreadsheet-based (PRD requirement)
            'csv', 'xls', 'xlsx',
            # Data formats
            'json', 'xml'
        }
        
        if file_extension not in supported_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_extension}"
            )
        
        # Save uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, file.filename)
        
        with open(temp_file_path, 'wb') as f:
            f.write(content)
        
        # Initialize file processing service
        file_service = FileProcessingService(db)
        
        if create_preview:
            # Create preview for immediate user interaction
            preview_id = await file_service.create_preview(
                file_path=temp_file_path,
                user_id=current_user.id,
                subscription_tier=subscription_tier
            )
            
            # Also enqueue for full processing
            job_id = await file_service.process_file_with_queue(
                file_path=temp_file_path,
                user_id=current_user.id,
                subscription_tier=subscription_tier,
                priority=priority
            )
            
            return {
                "status": "success",
                "message": "File uploaded and processing started",
                "preview_id": preview_id,
                "job_id": job_id,
                "file_name": file.filename,
                "file_size": file_size,
                "subscription_tier": subscription_tier,
                "estimated_completion": "2-5 minutes" if subscription_tier == "free" else "30-60 seconds"
            }
        else:
            # Process immediately (for small files or premium users)
            if subscription_tier in ["pro", "max"]:
                result = await file_service.process_file(
                    file_path=temp_file_path,
                    user_id=current_user.id,
                    action="fill"
                )
                
                return {
                    "status": "success",
                    "message": "File processed immediately",
                    "result": result,
                    "file_name": file.filename,
                    "file_size": file_size,
                    "subscription_tier": subscription_tier
                }
            else:
                # Queue for free/plus users
                job_id = await file_service.process_file_with_queue(
                    file_path=temp_file_path,
                    user_id=current_user.id,
                    subscription_tier=subscription_tier,
                    priority=priority
                )
                
                return {
                    "status": "queued",
                    "message": "File queued for processing",
                    "job_id": job_id,
                    "file_name": file.filename,
                    "file_size": file_size,
                    "subscription_tier": subscription_tier,
                    "estimated_completion": "2-5 minutes"
                }
    
    except Exception as e:
        logger.error(f"Error processing assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/preview/{preview_id}")
async def get_preview(
    preview_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get preview HTML for a processed file
    """
    try:
        preview_data = await preview_edit_service.get_preview(preview_id)
        if not preview_data:
            raise HTTPException(status_code=404, detail="Preview not found")
        
        # Replace placeholder with actual preview ID
        html_content = preview_data.preview_html.replace(
            'PREVIEW_ID_PLACEHOLDER', 
            preview_id
        )
        
        return HTMLResponse(content=html_content)
    
    except Exception as e:
        logger.error(f"Error getting preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get preview: {str(e)}")

@router.post("/preview/{preview_id}/edit/{section_id}")
async def edit_preview_section(
    preview_id: str,
    section_id: str,
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Edit a specific section in the preview
    """
    try:
        new_text = request_data.get('new_text', '')
        
        success = await preview_edit_service.edit_section(
            preview_id=preview_id,
            section_id=section_id,
            new_text=new_text,
            user_id=current_user.id
        )
        
        if success:
            return {"status": "success", "message": "Section updated successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to update section")
    
    except Exception as e:
        logger.error(f"Error editing section: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to edit section: {str(e)}")

@router.get("/preview/{preview_id}/history")
async def get_edit_history(
    preview_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get edit history for a preview
    """
    try:
        history = await preview_edit_service.get_edit_history(preview_id)
        return {"edit_history": history}
    
    except Exception as e:
        logger.error(f"Error getting edit history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get edit history: {str(e)}")

@router.post("/preview/{preview_id}/undo")
async def undo_last_edit(
    preview_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Undo the last edit for a preview
    """
    try:
        success = await preview_edit_service.undo_edit(
            preview_id=preview_id,
            user_id=current_user.id
        )
        
        if success:
            return {"status": "success", "message": "Edit undone successfully"}
        else:
            raise HTTPException(status_code=400, detail="No edit to undo")
    
    except Exception as e:
        logger.error(f"Error undoing edit: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to undo edit: {str(e)}")

@router.post("/preview/{preview_id}/export")
async def export_preview(
    preview_id: str,
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Export preview content as a file
    """
    try:
        output_format = request_data.get('format', 'original')
        include_metadata = request_data.get('include_metadata', True)
        
        # Get user's subscription tier (this would come from user model)
        subscription_tier = getattr(current_user, 'subscription_tier', 'free')
        
        # Export the preview
        export_data = await preview_edit_service.export_preview(
            preview_id=preview_id,
            output_format=output_format,
            include_metadata=include_metadata
        )
        
        return {
            "status": "success",
            "export_data": export_data,
            "subscription_tier": subscription_tier
        }
    
    except Exception as e:
        logger.error(f"Error exporting preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export preview: {str(e)}")

@router.get("/jobs/{job_id}/status")
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a processing job
    """
    try:
        job_status = await job_queue_service.get_job_status(job_id)
        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if job belongs to user
        if job_status.get('user_id') != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {"job_status": job_status}
    
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")

@router.get("/jobs")
async def get_user_jobs(
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    Get jobs for the current user
    """
    try:
        jobs = await job_queue_service.get_user_jobs(
            user_id=current_user.id,
            limit=limit
        )
        
        return {"jobs": jobs}
    
    except Exception as e:
        logger.error(f"Error getting user jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get jobs: {str(e)}")

@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a processing job
    """
    try:
        success = await job_queue_service.cancel_job(
            job_id=job_id,
            user_id=current_user.id
        )
        
        if success:
            return {"status": "success", "message": "Job cancelled successfully"}
        else:
            raise HTTPException(status_code=400, detail="Job could not be cancelled")
    
    except Exception as e:
        logger.error(f"Error cancelling job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")

@router.get("/supported-formats")
async def get_supported_formats():
    """
    Get list of supported file formats per PRD requirements
    """
    return {
        "supported_formats": {
            "document_based": [
                {
                    "extension": "pdf",
                    "mime_type": "application/pdf",
                    "description": "PDF documents",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "docx",
                    "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "description": "Microsoft Word documents",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "doc",
                    "mime_type": "application/msword",
                    "description": "Microsoft Word documents (legacy)",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "txt",
                    "mime_type": "text/plain",
                    "description": "Plain text files",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "rtf",
                    "mime_type": "application/rtf",
                    "description": "Rich Text Format documents",
                    "supports_filling": True,
                    "max_size_mb": 25
                }
            ],
            "image_based": [
                {
                    "extension": "jpg",
                    "mime_type": "image/jpeg",
                    "description": "JPEG images (OCR required)",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "png",
                    "mime_type": "image/png",
                    "description": "PNG images (OCR required)",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "gif",
                    "mime_type": "image/gif",
                    "description": "GIF images (OCR required)",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "bmp",
                    "mime_type": "image/bmp",
                    "description": "BMP images (OCR required)",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "tiff",
                    "mime_type": "image/tiff",
                    "description": "TIFF images (OCR required)",
                    "supports_filling": True,
                    "max_size_mb": 25
                }
            ],
            "code_based": [
                {
                    "extension": "py",
                    "mime_type": "text/x-python",
                    "description": "Python code files",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "js",
                    "mime_type": "text/javascript",
                    "description": "JavaScript code files",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "java",
                    "mime_type": "text/x-java-source",
                    "description": "Java code files",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "cpp",
                    "mime_type": "text/x-c++src",
                    "description": "C++ code files",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "html",
                    "mime_type": "text/html",
                    "description": "HTML files",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "css",
                    "mime_type": "text/css",
                    "description": "CSS files",
                    "supports_filling": True,
                    "max_size_mb": 25
                }
            ],
            "spreadsheet_based": [
                {
                    "extension": "csv",
                    "mime_type": "text/csv",
                    "description": "Comma-separated values",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "xls",
                    "mime_type": "application/vnd.ms-excel",
                    "description": "Microsoft Excel spreadsheets (legacy)",
                    "supports_filling": True,
                    "max_size_mb": 25
                },
                {
                    "extension": "xlsx",
                    "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "description": "Microsoft Excel spreadsheets",
                    "supports_filling": True,
                    "max_size_mb": 25
                }
            ]
        },
        "limits": {
            "max_file_size_mb": 25,
            "max_concurrent_uploads": {
                "free": 1,
                "plus": 2,
                "pro": 5,
                "max": 10
            },
            "processing_priorities": {
                "free": "normal",
                "plus": "normal",
                "pro": "high",
                "max": "urgent"
            }
        },
        "features": {
            "queue_based_processing": True,
            "preview_and_edit": True,
            "answer_validation": True,
            "format_preservation": True,
            "watermarking": True,
            "ocr_support": True,
            "code_execution": True,
            "math_verification": True
        }
    }

@router.delete("/preview/{preview_id}")
async def delete_preview(
    preview_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a preview and clean up associated data
    """
    try:
        success = await preview_edit_service.delete_preview(
            preview_id=preview_id,
            user_id=current_user.id
        )
        
        if success:
            return {"status": "success", "message": "Preview deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Preview not found")
    
    except Exception as e:
        logger.error(f"Error deleting preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete preview: {str(e)}")
