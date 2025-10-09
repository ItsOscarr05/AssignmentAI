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

# Try to import magic, but make it optional
try:
    import magic
    MAGIC_AVAILABLE = True
except (ImportError, OSError) as e:
    MAGIC_AVAILABLE = False
    magic = None
    print(f"Warning: python-magic not available: {str(e)}. File type detection will use fallback method.")

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
        
        # Initialize magic for file type detection if available
        if MAGIC_AVAILABLE:
            try:
                self.magic = magic.Magic(mime=True)
                logger.info("python-magic initialized successfully for file type detection")
            except Exception as e:
                logger.warning(f"Failed to initialize python-magic: {str(e)}. Using fallback file type detection.")
                self.magic = None
        else:
            self.magic = None
            logger.info("python-magic not available. Using fallback file type detection (magic bytes).")
    
    def _validate_file_type_by_content(self, content: bytes, extension: str, filename: str) -> Tuple[bool, str]:
        """
        Validate file type by checking magic bytes/file signatures
        Returns (is_valid, detected_mime_type)
        """
        try:
            if self.magic:
                detected_mime = self.magic.from_buffer(content)
            else:
                # Fallback: check file signatures manually
                detected_mime = self._detect_mime_by_signature(content)
            
            logger.info(f"File '{filename}' - Extension: .{extension}, Detected MIME: {detected_mime}")
            
            # Validate that the detected MIME type matches the file extension
            expected_mimes = self.allowed_types.get(extension, [])
            
            # Special handling for Office documents (they may have generic MIME types)
            if extension in ['doc', 'docx', 'xls', 'xlsx']:
                # Office documents have specific signatures
                if extension == 'docx':
                    # DOCX files are ZIP files with specific structure
                    if detected_mime in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                                        'application/zip']:
                        return True, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                elif extension == 'doc':
                    # DOC files are OLE/Compound File Binary Format
                    if detected_mime in ['application/msword', 'application/x-ole-storage']:
                        return True, 'application/msword'
                elif extension == 'xlsx':
                    # XLSX files are ZIP files with specific structure
                    if detected_mime in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                        'application/zip']:
                        return True, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                elif extension == 'xls':
                    # XLS files are OLE/Compound File Binary Format
                    if detected_mime in ['application/vnd.ms-excel', 'application/x-ole-storage']:
                        return True, 'application/vnd.ms-excel'
                
                # If MIME type doesn't match, log warning
                logger.warning(f"Office file type mismatch: extension=.{extension}, detected={detected_mime}")
                return False, detected_mime
            
            # For CSV, ensure it's not actually an Excel file
            if extension == 'csv':
                if detected_mime not in ['text/csv', 'text/plain']:
                    logger.error(f"CSV file has wrong MIME type: {detected_mime}. Possible misnamed Excel file.")
                    return False, detected_mime
            
            # Check if detected MIME is in expected list
            if detected_mime in expected_mimes:
                return True, detected_mime
            
            # Some flexibility for text-based formats
            if extension in ['txt', 'py', 'js', 'html', 'css', 'json', 'xml', 'csv'] and detected_mime.startswith('text/'):
                return True, detected_mime
            
            logger.warning(f"File type validation failed: extension=.{extension}, expected={expected_mimes}, detected={detected_mime}")
            return False, detected_mime
            
        except Exception as e:
            logger.error(f"Error validating file type: {str(e)}")
            # Default to allowing if validation fails
            return True, 'application/octet-stream'
    
    def _detect_mime_by_signature(self, content: bytes) -> str:
        """Fallback method to detect MIME type by file signature (magic bytes)"""
        if len(content) < 8:
            return 'application/octet-stream'
        
        # Check common file signatures
        signatures = {
            b'%PDF': 'application/pdf',
            b'PK\x03\x04': 'application/zip',  # Could be docx, xlsx, etc.
            b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1': 'application/x-ole-storage',  # OLE format (doc, xls)
            b'\x89PNG\r\n\x1a\n': 'image/png',
            b'\xFF\xD8\xFF': 'image/jpeg',
            b'GIF87a': 'image/gif',
            b'GIF89a': 'image/gif',
        }
        
        for signature, mime_type in signatures.items():
            if content.startswith(signature):
                return mime_type
        
        # Try to decode as text
        try:
            content[:1000].decode('utf-8')
            return 'text/plain'
        except UnicodeDecodeError:
            return 'application/octet-stream'

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
            
            # Validate file type by content (magic bytes)
            is_valid, detected_mime = self._validate_file_type_by_content(content, extension, file.filename)
            
            if not is_valid:
                # Provide helpful error message based on detected type
                if extension == 'csv' and 'excel' in detected_mime.lower():
                    raise HTTPException(
                        status_code=400,
                        detail=f"File appears to be an Excel file, but has .csv extension. Please save as .xlsx or .xls format."
                    )
                elif extension in ['docx', 'doc'] and detected_mime not in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/x-ole-storage', 'application/zip']:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File does not appear to be a valid Word document. Detected type: {detected_mime}"
                    )
                elif extension in ['xlsx', 'xls'] and detected_mime not in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/x-ole-storage', 'application/zip']:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File does not appear to be a valid Excel file. Detected type: {detected_mime}"
                    )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File type mismatch: .{extension} file expected, but detected {detected_mime}"
                    )
            
            mime_type = detected_mime
            logger.info(f"File validated: {file.filename} - MIME: {mime_type}")

            # Generate unique filename
            file_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"{timestamp}_{file_id}.{extension}"
            
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