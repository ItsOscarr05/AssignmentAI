from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pathlib import Path
import uuid
import os
from datetime import datetime

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.services.file_processing_service import FileProcessingService
from app.services.file_service import file_service
from app.core.logger import logger

router = APIRouter()

@router.post("/analyze")
async def analyze_file_for_filling(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze an uploaded file to identify sections that can be filled in.
    This is the first step before actually filling the file.
    """
    try:
        logger.info(f"File analysis request from user {current_user.id} for file {file.filename}")
        
        # Save the uploaded file
        file_path, file_id = await file_service.save_file(file, current_user.id)
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        # Analyze the file
        analysis_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="analyze"
        )
        
        return {
            "file_id": file_id,
            "file_path": file_path,
            "file_name": file.filename,
            "file_type": analysis_result.get('file_type'),
            "analysis": analysis_result.get('analysis'),
            "fillable_sections": analysis_result.get('fillable_sections', []),
            "processed_at": analysis_result.get('processed_at'),
            "status": "analyzed"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze file: {str(e)}")

@router.post("/fill")
async def fill_file_content(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fill in the identified sections of an uploaded file with AI-generated content.
    This actually modifies the file content.
    """
    try:
        logger.info(f"File filling request from user {current_user.id} for file {file.filename}")
        
        # Save the uploaded file
        file_path, file_id = await file_service.save_file(file, current_user.id)
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        # Fill the file content
        fill_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="fill"
        )
        
        # Generate the filled file
        output_filename = f"filled_{file.filename}"
        output_path = os.path.join(
            os.path.dirname(file_path),
            output_filename
        )
        
        filled_file_path = await processing_service.generate_filled_file(
            original_path=file_path,
            filled_content=fill_result.get('filled_content', {}),
            output_path=output_path
        )
        
        return {
            "file_id": file_id,
            "original_file_path": file_path,
            "filled_file_path": filled_file_path,
            "file_name": file.filename,
            "filled_file_name": output_filename,
            "file_type": fill_result.get('file_type'),
            "sections_filled": fill_result.get('sections_filled', 0),
            "original_content": fill_result.get('original_content'),
            "filled_content": fill_result.get('filled_content'),
            "processed_at": fill_result.get('processed_at'),
            "status": "filled",
            "download_url": f"/api/v1/file-processing/download/{file_id}"
        }
        
    except Exception as e:
        logger.error(f"Error filling file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fill file: {str(e)}")

@router.post("/process-existing")
async def process_existing_file(
    file_id: str = Body(..., embed=True),
    action: str = Body(..., embed=True),  # "analyze" or "fill"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process an already uploaded file (by file_id) for analysis or filling.
    """
    try:
        logger.info(f"Processing existing file {file_id} with action {action} for user {current_user.id}")
        
        # For now, we'll construct the file path based on the file_id
        # In a real implementation, you'd fetch this from a database
        user_dir = Path(f"uploads/{current_user.id}")
        
        # Find the file with the given ID (look for files that might match)
        # This is a temporary solution - in production you'd have a proper file metadata table
        if not user_dir.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Look for files in the user's directory
        files = list(user_dir.glob("*"))
        if not files:
            raise HTTPException(status_code=404, detail="File not found")
        
        # For now, use the most recent file (in production, you'd match by file_id)
        file_path = files[-1]
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        # Process the file
        result = await processing_service.process_file(
            file_path=str(file_path),
            user_id=current_user.id,
            action=action
        )
        
        if action == "fill":
            # Generate the actual filled file
            filled_file_name = f"filled_{file_path.name}"
            filled_file_path = file_path.parent / filled_file_name
            
            # Generate the filled file
            actual_filled_path = await processing_service.generate_filled_file(
                original_path=str(file_path),
                filled_content=result.get('filled_content', {}),
                output_path=str(filled_file_path)
            )
            
            return {
                "file_id": file_id,
                "original_file_path": str(file_path),
                "filled_file_path": actual_filled_path,
                "file_name": file_path.name,
                "filled_file_name": filled_file_name,
                "file_type": result.get('file_type'),
                "sections_filled": result.get('sections_filled', 0),
                "original_content": result.get('original_content'),
                "filled_content": result.get('filled_content'),
                "processed_at": result.get('processed_at'),
                "status": "completed",
                "download_url": f"/api/v1/file-processing/download/{file_id}"
            }
        else:  # analyze
            return {
                "file_id": file_id,
                "file_path": str(file_path),
                "file_name": file_path.name,
                "file_type": result.get('file_type'),
                "analysis": result.get('analysis'),
                "fillable_sections": result.get('fillable_sections', []),
                "processed_at": result.get('processed_at'),
                "status": "completed"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing existing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.get("/download/{file_id}")
async def download_filled_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a filled file.
    """
    try:
        logger.info(f"Download request for file {file_id} from user {current_user.id}")
        
        from fastapi.responses import FileResponse
        import os
        from pathlib import Path
        
        # In a real implementation, you'd fetch the file path from a database
        # For now, we'll construct the path based on the file_id
        user_dir = Path(f"uploads/{current_user.id}")
        
        # Find the filled file (look for files starting with "filled_")
        filled_files = list(user_dir.glob(f"filled_*"))
        
        if not filled_files:
            raise HTTPException(status_code=404, detail="Filled file not found")
        
        # Get the most recent filled file (in a real app, you'd use the file_id to find the exact file)
        filled_file_path = filled_files[-1]
        
        logger.info(f"Found filled file: {filled_file_path}")
        
        if not filled_file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Return the file as a download
        return FileResponse(
            path=str(filled_file_path),
            filename=filled_file_path.name,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

@router.get("/status/{file_id}")
async def get_processing_status(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the processing status of a file.
    """
    try:
        logger.info(f"Status request for file {file_id} from user {current_user.id}")
        
        # In a real implementation, you'd check the processing status from the database
        # For now, return a placeholder response
        return {
            "file_id": file_id,
            "status": "completed",
            "processed_at": datetime.utcnow().isoformat(),
            "message": "File processing completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error getting file status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get file status: {str(e)}")

@router.post("/preview")
async def preview_filled_content(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Preview what the filled file would look like without actually creating it.
    This allows users to see the changes before committing.
    """
    try:
        logger.info(f"File preview request from user {current_user.id} for file {file.filename}")
        
        # Save the uploaded file temporarily
        file_path, file_id = await file_service.save_file(file, current_user.id)
        
        # Initialize file processing service
        processing_service = FileProcessingService(db)
        
        # Analyze the file first
        analysis_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="analyze"
        )
        
        # Get a preview of what would be filled
        fill_result = await processing_service.process_file(
            file_path=file_path,
            user_id=current_user.id,
            action="fill"
        )
        
        return {
            "file_id": file_id,
            "file_name": file.filename,
            "file_type": analysis_result.get('file_type'),
            "fillable_sections": analysis_result.get('fillable_sections', []),
            "preview_content": fill_result.get('filled_content'),
            "sections_to_fill": fill_result.get('sections_filled', 0),
            "processed_at": datetime.utcnow().isoformat(),
            "status": "preview_ready"
        }
        
    except Exception as e:
        logger.error(f"Error creating file preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create preview: {str(e)}")

@router.get("/supported-formats")
async def get_supported_formats():
    """
    Get list of supported file formats for processing.
    """
    return {
        "supported_formats": [
            # Document formats
            {
                "extension": "pdf",
                "mime_type": "application/pdf",
                "description": "PDF documents",
                "supports_filling": True
            },
            {
                "extension": "docx",
                "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "description": "Microsoft Word documents",
                "supports_filling": True
            },
            {
                "extension": "doc",
                "mime_type": "application/msword",
                "description": "Microsoft Word documents (legacy)",
                "supports_filling": True
            },
            {
                "extension": "txt",
                "mime_type": "text/plain",
                "description": "Plain text files",
                "supports_filling": True
            },
            {
                "extension": "rtf",
                "mime_type": "application/rtf",
                "description": "Rich Text Format documents",
                "supports_filling": True
            },
            # Spreadsheet formats
            {
                "extension": "csv",
                "mime_type": "text/csv",
                "description": "Comma-separated values",
                "supports_filling": True
            },
            {
                "extension": "xlsx",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "description": "Microsoft Excel spreadsheets",
                "supports_filling": True
            },
            {
                "extension": "xls",
                "mime_type": "application/vnd.ms-excel",
                "description": "Microsoft Excel spreadsheets (legacy)",
                "supports_filling": True
            },
            # Data formats
            {
                "extension": "json",
                "mime_type": "application/json",
                "description": "JSON data files",
                "supports_filling": True
            },
            {
                "extension": "xml",
                "mime_type": "application/xml",
                "description": "XML data files",
                "supports_filling": True
            },
            # Code formats
            {
                "extension": "py",
                "mime_type": "text/x-python",
                "description": "Python source code",
                "supports_filling": True
            },
            {
                "extension": "js",
                "mime_type": "text/javascript",
                "description": "JavaScript source code",
                "supports_filling": True
            },
            {
                "extension": "java",
                "mime_type": "text/x-java-source",
                "description": "Java source code",
                "supports_filling": True
            },
            {
                "extension": "cpp",
                "mime_type": "text/x-c++src",
                "description": "C++ source code",
                "supports_filling": True
            },
            {
                "extension": "c",
                "mime_type": "text/x-csrc",
                "description": "C source code",
                "supports_filling": True
            },
            {
                "extension": "html",
                "mime_type": "text/html",
                "description": "HTML documents",
                "supports_filling": True
            },
            {
                "extension": "css",
                "mime_type": "text/css",
                "description": "CSS stylesheets",
                "supports_filling": True
            },
            # Image formats
            {
                "extension": "png",
                "mime_type": "image/png",
                "description": "PNG images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "jpg",
                "mime_type": "image/jpeg",
                "description": "JPEG images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "gif",
                "mime_type": "image/gif",
                "description": "GIF images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "bmp",
                "mime_type": "image/bmp",
                "description": "BMP images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "tiff",
                "mime_type": "image/tiff",
                "description": "TIFF images (OCR processing)",
                "supports_filling": True
            },
            {
                "extension": "webp",
                "mime_type": "image/webp",
                "description": "WebP images (OCR processing)",
                "supports_filling": True
            }
        ],
        "max_file_size": "100MB",
        "processing_limits": {
            "free_plan": "5 files per day",
            "plus_plan": "50 files per day",
            "pro_plan": "200 files per day",
            "max_plan": "Unlimited"
        }
    }
