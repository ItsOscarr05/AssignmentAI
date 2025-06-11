import os
from fastapi import UploadFile
from app.core.config import settings
import aiofiles
import uuid
from typing import List

UPLOAD_DIR = settings.UPLOAD_DIR

async def upload_file(file: UploadFile) -> str:
    """Upload a file and return its URL"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Ensure upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Save file
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Return URL path
        return f"/uploads/{unique_filename}"
    except Exception as e:
        raise Exception(f"Error uploading file: {str(e)}")

async def delete_file(file_url: str) -> None:
    """Delete a file from the upload directory"""
    try:
        # Extract filename from URL
        filename = os.path.basename(file_url)
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Delete file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        raise Exception(f"Error deleting file: {str(e)}")

async def upload_files(files: List[UploadFile]) -> List[str]:
    """Upload multiple files and return their URLs"""
    return [await upload_file(file) for file in files] 