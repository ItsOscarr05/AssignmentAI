import os
import uuid
from fastapi import UploadFile, HTTPException
from pathlib import Path
from typing import Tuple
import aiofiles
import magic
from dotenv import load_dotenv

load_dotenv()

# Configuration
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10MB default
ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar"
}

async def save_upload_file(
    upload_file: UploadFile,
    subdirectory: str
) -> Tuple[str, str, str, int]:
    """
    Save an uploaded file and return its metadata
    
    Args:
        upload_file: The uploaded file
        subdirectory: Subdirectory within the upload directory
        
    Returns:
        Tuple of (file_name, file_path, file_type, file_size)
    """
    # Create directory if it doesn't exist
    upload_path = UPLOAD_DIR / subdirectory
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Read file content
    content = await upload_file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE/1024/1024}MB"
        )
    
    # Detect file type
    mime = magic.Magic(mime=True)
    file_type = mime.from_buffer(content)
    
    # Check if file type is allowed
    if file_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_type} is not allowed"
        )
    
    # Generate unique filename
    file_extension = ALLOWED_MIME_TYPES[file_type]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_path / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    return (
        upload_file.filename,  # Original filename
        str(file_path),  # Full path
        file_type,  # MIME type
        len(content)  # File size
    )

async def delete_file(file_path: str) -> None:
    """Delete a file from the filesystem"""
    try:
        os.remove(file_path)
    except OSError:
        pass  # Ignore if file doesn't exist 