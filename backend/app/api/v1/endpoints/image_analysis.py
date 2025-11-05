from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.core.feature_access import has_feature_access, get_user_plan
from app.services.image_analysis_service import ImageAnalysisService
from app.models.user import User
import logging
import base64

logger = logging.getLogger(__name__)
router = APIRouter()

# Create service instance
image_analysis_service = ImageAnalysisService()

# Request models
class ImageAnalysisRequest(BaseModel):
    image_data: str
    analysis_type: Optional[str] = None
    prompt: Optional[str] = None

class ImageTypeDetectionRequest(BaseModel):
    image_data: str
    prompt: Optional[str] = None

class TextExtractionRequest(BaseModel):
    image_data: str
    use_vision_api: Optional[bool] = False
    prompt: Optional[str] = None

class MathProblemRequest(BaseModel):
    image_data: str

class DocumentAnalysisRequest(BaseModel):
    image_data: str

class ImageDescriptionRequest(BaseModel):
    image_data: str

class ObjectDetectionRequest(BaseModel):
    image_data: str

class BatchAnalysisRequest(BaseModel):
    images: List[str]
    analysis_type: Optional[str] = None
    prompt: Optional[str] = None

@router.post("/analyze")
async def analyze_image(
    request: ImageAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze an image and provide an answer to a question or problem.
    Requires Pro or Max plan.
    """
    if not has_feature_access(current_user, "image_analysis", db):
        plan = get_user_plan(current_user, db)
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Image analysis not available in your plan",
                "feature": "image_analysis",
                "current_plan": plan,
                "upgrade_message": "Upgrade to Pro plan to access image analysis",
                "upgrade_url": "/dashboard/price-plan"
            }
        )
    try:
        # Decode base64 image data
        try:
            image_bytes = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Analyze image
        result = await image_analysis_service.analyze_image_and_answer(
            image_data=image_bytes,
            question=request.prompt,
            context=None
        )
        
        return {
            "success": True,
            "analysis": result,
            "message": "Image analyzed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze image: {str(e)}"
        )

@router.post("/solve-math")
async def solve_math_problem(
    request: MathProblemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Solve a math problem from an image.
    """
    try:
        # Decode base64 image data
        try:
            image_bytes = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Solve math problem
        result = await image_analysis_service.solve_math_problem(image_bytes)
        
        return {
            "success": True,
            "solution": result,
            "message": "Math problem solved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error solving math problem: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to solve math problem: {str(e)}"
        )

@router.post("/extract-text")
async def extract_text_document(
    request: TextExtractionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extract and analyze text from a document image.
    """
    try:
        # Decode base64 image data
        try:
            image_bytes = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Extract text document
        result = await image_analysis_service.extract_text_document(image_bytes)
        
        return {
            "success": True,
            "document": result,
            "message": "Text document extracted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error extracting text document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract text document: {str(e)}"
        )

@router.post("/detect-type")
async def detect_image_type(
    request: ImageTypeDetectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Detect the type of content in an image.
    """
    try:
        # Decode base64 image data
        try:
            image_bytes = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Detect image type
        image_type = await image_analysis_service.detect_image_type(image_bytes)
        
        return {
            "success": True,
            "image_type": image_type,
            "message": "Image type detected successfully"
        }
        
    except Exception as e:
        logger.error(f"Error detecting image type: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to detect image type: {str(e)}"
        )

@router.get("/types")
async def get_analysis_types():
    """
    Get list of available analysis types.
    """
    return {
        "types": [
            "text_extraction",
            "math_solving", 
            "document_analysis",
            "object_detection",
            "image_description",
            "image_type_detection"
        ]
    }

@router.get("/formats")
async def get_supported_formats():
    """
    Get list of supported image formats.
    """
    return {
        "formats": image_analysis_service.supported_formats,
        "content_types": [
            "image/jpeg",
            "image/png", 
            "image/bmp",
            "image/tiff",
            "image/gif"
        ]
    }

@router.get("/supported-formats")
async def get_supported_formats_legacy():
    """
    Get list of supported image formats (legacy endpoint).
    """
    return {
        "formats": image_analysis_service.supported_formats,
        "content_types": [
            "image/jpeg",
            "image/png", 
            "image/bmp",
            "image/tiff",
            "image/gif"
        ]
    }

@router.get("/content-types")
async def get_content_types():
    """
    Get list of supported content types for analysis.
    """
    return {
        "content_types": [
            "math_problem",
            "text_document", 
            "diagram",
            "handwritten_notes",
            "screenshot",
            "photo",
            "other"
        ],
        "descriptions": {
            "math_problem": "Mathematical equations, problems, calculations",
            "text_document": "Documents, articles, essays",
            "diagram": "Charts, graphs, diagrams, flowcharts",
            "handwritten_notes": "Handwritten text, notes",
            "screenshot": "Computer screenshots, app interfaces",
            "photo": "General photographs",
            "other": "Any other type of content"
        }
    }

# Additional endpoints that tests expect
@router.post("/analyze-document")
async def analyze_document(
    request: DocumentAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze a document image.
    """
    try:
        # Decode base64 image data
        try:
            image_bytes = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Analyze document
        result = await image_analysis_service.analyze_image_and_answer(
            image_data=image_bytes,
            question="Analyze this document",
            context=None
        )
        
        return {
            "success": True,
            "document": result,
            "message": "Document analyzed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze document: {str(e)}"
        )

@router.post("/describe")
async def describe_image(
    request: ImageDescriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Describe an image.
    """
    try:
        # Decode base64 image data
        try:
            image_bytes = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Describe image
        result = await image_analysis_service.analyze_image_and_answer(
            image_data=image_bytes,
            question="Describe this image in detail",
            context=None
        )
        
        return {
            "success": True,
            "description": result,
            "message": "Image described successfully"
        }
        
    except Exception as e:
        logger.error(f"Error describing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to describe image: {str(e)}"
        )

@router.post("/detect-objects")
async def detect_objects(
    request: ObjectDetectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Detect objects in an image.
    """
    try:
        # Decode base64 image data
        try:
            image_bytes = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
        
        # Detect objects
        result = await image_analysis_service.analyze_image_and_answer(
            image_data=image_bytes,
            question="What objects do you see in this image?",
            context=None
        )
        
        return {
            "success": True,
            "objects": result,
            "message": "Objects detected successfully"
        }
        
    except Exception as e:
        logger.error(f"Error detecting objects: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to detect objects: {str(e)}"
        )

@router.post("/upload")
async def upload_and_analyze(
    image: UploadFile = File(...),
    analysis_type: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and analyze an image.
    """
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Analyze image
        result = await image_analysis_service.analyze_image_and_answer(
            image_data=image_data,
            question=prompt,
            context=None
        )
        
        return {
            "success": True,
            "analysis": result,
            "message": "Image uploaded and analyzed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error uploading and analyzing image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload and analyze image: {str(e)}"
        )

@router.post("/batch")
async def batch_analysis(
    request: BatchAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze multiple images in batch.
    """
    try:
        results = []
        
        for i, image_data in enumerate(request.images):
            try:
                # Decode base64 image data
                try:
                    image_bytes = base64.b64decode(image_data)
                except Exception:
                    results.append({
                        "index": i,
                        "error": "Invalid base64 image data"
                    })
                    continue
                
                # Analyze image
                result = await image_analysis_service.analyze_image_and_answer(
                    image_data=image_bytes,
                    question=request.prompt,
                    context=None
                )
                
                results.append({
                    "index": i,
                    "success": True,
                    "analysis": result
                })
                
            except Exception as e:
                results.append({
                    "index": i,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "results": results,
            "message": "Batch analysis completed"
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform batch analysis: {str(e)}"
        ) 