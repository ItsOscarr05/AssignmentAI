import os
import uuid
import mimetypes
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException
from pathlib import Path
from app.core.config import settings
from app.services.security_service import security_service
import aiofiles
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Define allowed file types and their MIME types - Updated per PRD requirements
        self.allowed_types = {
            # Document-based (PRD requirement)
            'pdf': ['application/pdf'],
            'doc': ['application/msword'],
            'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'txt': ['text/plain'],
            'rtf': ['application/rtf'],
            
            # Image-based (OCR required) (PRD requirement)
            'jpg': ['image/jpeg'],
            'jpeg': ['image/jpeg'],
            'png': ['image/png'],
            'gif': ['image/gif'],
            'bmp': ['image/bmp'],
            'tiff': ['image/tiff'],
            
            # Code-based (PRD requirement)
            'py': ['text/x-python'],
            'js': ['text/javascript', 'application/javascript'],
            'java': ['text/x-java-source'],
            'cpp': ['text/x-c++src'],
            'c': ['text/x-csrc'],
            'html': ['text/html'],
            'css': ['text/css'],
            
            # Spreadsheet-based (PRD requirement)
            'csv': ['text/csv'],
            'xls': ['application/vnd.ms-excel'],
            'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            
            # Data formats
            'json': ['application/json'],
            'xml': ['application/xml', 'text/xml'],
            
            # Audio
            'mp3': ['audio/mpeg'],
            'wav': ['audio/wav'],
            'ogg': ['audio/ogg'],
            
            # Video
            'mp4': ['video/mp4'],
            'avi': ['video/x-msvideo'],
            'mov': ['video/quicktime'],
            
            # Other
            'yaml': ['text/yaml'],
            'yml': ['text/yaml']
        }
        
        self.max_file_size = 100 * 1024 * 1024  # 100MB in bytes

    async def save_file(self, file: UploadFile, user_id: int) -> Tuple[str, str]:
        """
        Save an uploaded file securely
        Returns (file_path, file_id)
        """
        try:
            # Validate file size
            if file.size > self.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File size exceeds maximum limit of 100MB"
                )

            # Validate filename
            if not security_service.validate_filename(file.filename):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid filename"
                )

            # Get file extension
            extension = file.filename.lower().split('.')[-1]
            
            # Validate file type
            if extension not in self.allowed_types:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type not allowed. Allowed types: {', '.join(self.allowed_types.keys())}"
                )

            # Read file content
            content = await file.read()
            
            # Detect MIME type using mimetypes
            mime_type, _ = mimetypes.guess_type(file.filename)
            if mime_type is None:
                mime_type = 'application/octet-stream'
            
            # Validate MIME type against expected MIME types for this extension
            expected_mime_types = self.allowed_types.get(extension, [])
            if mime_type not in expected_mime_types:
                # Log the mismatch for debugging
                logger.warning(f"MIME type mismatch for {file.filename}: expected {expected_mime_types}, got {mime_type}")
                # For now, allow the upload but log the issue
                # In production, you might want to be more strict

            # Generate unique filename with corrected extension based on MIME type
            file_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            
            # Correct file extension based on MIME type if there's a mismatch
            corrected_extension = extension
            if mime_type == 'application/vnd.ms-excel' and extension == 'csv':
                corrected_extension = 'xls'
                logger.info(f"Correcting file extension from .csv to .xls based on MIME type")
            elif mime_type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' and extension == 'csv':
                corrected_extension = 'xlsx'
                logger.info(f"Correcting file extension from .csv to .xlsx based on MIME type")
            
            safe_filename = f"{timestamp}_{file_id}.{corrected_extension}"
            
            # Create user directory if it doesn't exist
            user_dir = self.upload_dir / str(user_id)
            user_dir.mkdir(exist_ok=True)
            
            # Save file
            file_path = user_dir / safe_filename
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)

            # Log file upload
            logger.info(f"File uploaded: {file_path} by user {user_id}")

            return str(file_path), file_id

        except Exception as e:
            logger.error(f"Error saving file: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error saving file: {str(e)}"
            )

    async def delete_file(self, file_path: str, user_id: int) -> bool:
        """Delete a file securely"""
        try:
            path = Path(file_path)
            
            # Validate file path
            if not path.is_file() or str(path.parent) != str(self.upload_dir / str(user_id)):
                return False
            
            # Delete file
            path.unlink()
            
            # Log file deletion
            logger.info(f"File deleted: {file_path} by user {user_id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return False

    def get_file_info(self, file_path: str) -> Optional[dict]:
        """Get file information"""
        try:
            path = Path(file_path)
            if not path.is_file():
                return None
                
            return {
                "filename": path.name,
                "size": path.stat().st_size,
                "created_at": datetime.fromtimestamp(path.stat().st_ctime),
                "modified_at": datetime.fromtimestamp(path.stat().st_mtime),
                "extension": path.suffix[1:].lower()
            }
            
        except Exception as e:
            logger.error(f"Error getting file info: {str(e)}")
            return None

# Create a global file service instance
file_service = FileService() 