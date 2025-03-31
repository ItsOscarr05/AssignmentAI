from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api import deps
from app.services.storage_service import StorageService
from app.schemas.file import FileResponse

router = APIRouter()

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    subdirectory: str = None,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_active_user)
):
    """
    Upload a file to the storage.
    """
    try:
        storage_service = StorageService(db)
        file_path = await storage_service.save_file(file, subdirectory)
        return {
            "filename": file.filename,
            "path": file_path,
            "size": storage_service.get_file_size(file_path)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/download/{file_path:path}")
async def download_file(
    file_path: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_active_user)
):
    """
    Download a file from storage.
    """
    try:
        storage_service = StorageService(db)
        file = storage_service.read_file(file_path)
        return file
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download file: {str(e)}"
        )

@router.delete("/{file_path:path}")
async def delete_file(
    file_path: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_active_user)
):
    """
    Delete a file from storage.
    """
    try:
        storage_service = StorageService(db)
        success = storage_service.delete_file(file_path)
        if not success:
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        ) 