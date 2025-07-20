from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.services import diagram_service
from app.models.user import User
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def check_diagram_service():
    """Check if diagram service is available."""
    if diagram_service is None:
        raise HTTPException(
            status_code=503,
            detail="Diagram service is not available. Please install matplotlib, seaborn, pandas, and numpy."
        )

@router.post("/generate")
async def generate_diagram(
    description: str = Form(...),
    diagram_type: str = Form("auto"),
    style: str = Form("modern"),
    data: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a diagram based on description and parameters.
    """
    check_diagram_service()
    
    try:
        # Parse data if provided
        parsed_data = None
        if data:
            import json
            try:
                parsed_data = json.loads(data)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid data format")
        
        # Generate diagram
        result = await diagram_service.generate_diagram(
            description=description,
            diagram_type=diagram_type,
            data=parsed_data,
            style=style
        )
        
        return {
            "success": True,
            "diagram": result,
            "message": "Diagram generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating diagram: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate diagram: {str(e)}"
        )

@router.get("/types")
async def get_diagram_types():
    """
    Get list of supported diagram types.
    """
    check_diagram_service()
    
    return {
        "types": diagram_service.supported_types,
        "descriptions": {
            "bar_chart": "Bar chart for comparing categories",
            "line_chart": "Line chart for showing trends over time",
            "pie_chart": "Pie chart for showing proportions",
            "scatter_plot": "Scatter plot for showing correlations",
            "flowchart": "Flowchart for showing processes",
            "mind_map": "Mind map for organizing ideas",
            "venn_diagram": "Venn diagram for showing relationships",
            "process_diagram": "Process diagram for workflows",
            "org_chart": "Organizational chart for hierarchies",
            "timeline": "Timeline for showing events",
            "comparison_table": "Comparison table for comparing options",
            "infographic": "Infographic for comprehensive information display"
        }
    }

@router.get("/styles")
async def get_diagram_styles():
    """
    Get list of available diagram styles.
    """
    check_diagram_service()
    
    return {
        "styles": ["modern", "classic", "minimal", "colorful"],
        "descriptions": {
            "modern": "Clean, contemporary design with modern colors",
            "classic": "Traditional design with professional appearance",
            "minimal": "Simple, clean design with minimal elements",
            "colorful": "Vibrant design with bright colors and patterns"
        }
    }

@router.post("/detect-type")
async def detect_diagram_type(
    description: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Detect the most appropriate diagram type for a description.
    """
    check_diagram_service()
    
    try:
        diagram_type = await diagram_service._detect_diagram_type(description)
        
        return {
            "detected_type": diagram_type,
            "description": description,
            "confidence": "high"  # Could be enhanced with confidence scoring
        }
        
    except Exception as e:
        logger.error(f"Error detecting diagram type: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to detect diagram type: {str(e)}"
        )

@router.post("/preview")
async def preview_diagram(
    description: str = Form(...),
    diagram_type: str = Form("auto"),
    style: str = Form("modern"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a preview of a diagram without saving.
    """
    check_diagram_service()
    
    try:
        # Generate diagram
        result = await diagram_service.generate_diagram(
            description=description,
            diagram_type=diagram_type,
            style=style
        )
        
        return {
            "success": True,
            "preview": result,
            "message": "Diagram preview generated"
        }
        
    except Exception as e:
        logger.error(f"Error generating diagram preview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate diagram preview: {str(e)}"
        ) 