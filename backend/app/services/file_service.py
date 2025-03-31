import os
from fastapi import UploadFile
from datetime import datetime
from typing import Optional
import aiofiles
from app.core.config import settings

class FileService:
    UPLOAD_DIR = "uploads"
    
    @classmethod
    async def save_file(cls, file: UploadFile, user_id: int, file_type: str) -> Optional[str]:
        """
        Save an uploaded file and return its path
        """
        try:
            # Create uploads directory if it doesn't exist
            os.makedirs(cls.UPLOAD_DIR, exist_ok=True)
            
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{user_id}_{timestamp}_{file.filename}"
            filepath = os.path.join(cls.UPLOAD_DIR, filename)
            
            # Save file
            async with aiofiles.open(filepath, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            
            return filepath
        except Exception as e:
            print(f"Error saving file: {str(e)}")
            return None
    
    @classmethod
    def delete_file(cls, filepath: str) -> bool:
        """
        Delete a file from the filesystem
        """
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False
    
    @classmethod
    def get_file_url(cls, filepath: str) -> str:
        """
        Get the URL for a file
        """
        if not filepath:
            return ""
        return f"{settings.BACKEND_URL}/{filepath}" 