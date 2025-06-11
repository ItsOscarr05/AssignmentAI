from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.api import deps
from app.services.usage_service import UsageService
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class UsageCreate(BaseModel):
    feature: str
    action: str
    metadata: Optional[Dict[str, Any]] = None

class UsageResponse(BaseModel):
    id: int
    user_id: int
    feature: str
    action: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]]

    class Config:
        orm_mode = True

class UsageSummaryResponse(BaseModel):
    feature: str
    count: int

@router.post("/track", response_model=UsageResponse)
async def track_usage(
    usage: UsageCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Track a usage event"""
    usage_service = UsageService(db)
    return await usage_service.track_usage(
        user=current_user,
        feature=usage.feature,
        action=usage.action,
        metadata=usage.metadata
    )

@router.get("/history", response_model=List[UsageResponse])
async def get_usage_history(
    feature: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get usage history for the current user"""
    usage_service = UsageService(db)
    return await usage_service.get_usage(
        user=current_user,
        feature=feature,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/summary", response_model=Dict[str, int])
async def get_usage_summary(
    feature: Optional[str] = None,
    period: str = 'daily',
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get usage summary for the current user"""
    usage_service = UsageService(db)
    return await usage_service.get_usage_summary(
        user=current_user,
        feature=feature,
        period=period
    )

@router.get("/limits")
async def get_usage_limits(
    feature: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get usage limits for the current user's plan"""
    usage_service = UsageService(db)
    return await usage_service.get_usage_limits(
        user=current_user,
        feature=feature
    ) 