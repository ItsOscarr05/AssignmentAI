from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.file_completion import FileCompletionService
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

class CompletionRequest(BaseModel):
    file_path: str
    cursor_position: int
    file_content: str
    language: Optional[str] = None

class CompletionResponse(BaseModel):
    completion: str
    confidence: float
    language: str
    metadata: dict
    error: Optional[str] = None

@router.post("/completion", response_model=CompletionResponse)
async def get_completion(
    request: CompletionRequest,
    current_user: User = Depends(get_current_user)
) -> CompletionResponse:
    """
    Get code completion suggestions based on file content and cursor position.
    """
    try:
        completion_service = FileCompletionService()
        result = await completion_service.get_completion(
            file_path=request.file_path,
            cursor_position=request.cursor_position,
            file_content=request.file_content,
            language=request.language
        )
        
        if "error" in result:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )
            
        return CompletionResponse(
            completion=result["completion"],
            confidence=result["confidence"],
            language=result["language"],
            metadata=result["metadata"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) 