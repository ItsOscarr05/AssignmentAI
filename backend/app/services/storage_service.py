import os
from typing import Optional, BinaryIO
from fastapi import UploadFile
from app.core.config import settings
from app.services.logging_service import LoggingService

class StorageService:
    def __init__(self, db):
        self.db = db
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, subdirectory: Optional[str] = None) -> str:
        """Save an uploaded file to the storage"""
        try:
            # Create subdirectory if specified
            save_dir = os.path.join(self.upload_dir, subdirectory) if subdirectory else self.upload_dir
            os.makedirs(save_dir, exist_ok=True)

            # Generate unique filename
            file_path = os.path.join(save_dir, file.filename)
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            LoggingService.log_info(
                self.db,
                f"File saved successfully: {file.filename}",
                {"path": file_path}
            )
            return file_path
        except Exception as e:
            LoggingService.log_error(
                self.db,
                f"Failed to save file: {file.filename}",
                {"error": str(e)}
            )
            raise

    def read_file(self, file_path: str) -> BinaryIO:
        """Read a file from storage"""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            LoggingService.log_info(
                self.db,
                f"File read successfully: {file_path}"
            )
            return open(file_path, "rb")
        except Exception as e:
            LoggingService.log_error(
                self.db,
                f"Failed to read file: {file_path}",
                {"error": str(e)}
            )
            raise

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from storage"""
        try:
            if not os.path.exists(file_path):
                return False

            os.remove(file_path)
            LoggingService.log_info(
                self.db,
                f"File deleted successfully: {file_path}"
            )
            return True
        except Exception as e:
            LoggingService.log_error(
                self.db,
                f"Failed to delete file: {file_path}",
                {"error": str(e)}
            )
            return False

    def get_file_size(self, file_path: str) -> int:
        """Get the size of a file in bytes"""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            size = os.path.getsize(file_path)
            LoggingService.log_info(
                self.db,
                f"File size retrieved: {file_path}",
                {"size": size}
            )
            return size
        except Exception as e:
            LoggingService.log_error(
                self.db,
                f"Failed to get file size: {file_path}",
                {"error": str(e)}
            )
            raise 