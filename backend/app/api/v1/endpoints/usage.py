from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from app.core.deps import get_current_user, get_db
from app.services.usage_service import UsageService
from app.models.user import User
from pydantic import BaseModel, ConfigDict, Field, AliasChoices

router = APIRouter()

class UsageCreate(BaseModel):
    feature: str
    action: str
    tokens_used: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class UsageResponse(BaseModel):
    id: int
    user_id: int
    feature: str
    action: str
    timestamp: datetime
    tokens_used: int = 0
    requests_made: int = 0
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("usage_metadata", "metadata"),
        serialization_alias="metadata",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


def _safe_int(value: Any, default: int) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    return default


def _safe_metadata(value: Any) -> Optional[Dict[str, Any]]:
    if isinstance(value, dict):
        return value
    return None


def _serialize_usage(record: Any) -> UsageResponse:
    if isinstance(record, UsageResponse):
        return record

    data = {
        "id": getattr(record, "id", 0),
        "user_id": getattr(record, "user_id", 0),
        "feature": getattr(record, "feature", ""),
        "action": getattr(record, "action", ""),
        "timestamp": getattr(record, "timestamp", datetime.utcnow()),
        "tokens_used": _safe_int(getattr(record, "tokens_used", 0), 0),
        "requests_made": _safe_int(getattr(record, "requests_made", 1), 1),
        "metadata": _safe_metadata(
            getattr(record, "usage_metadata", None) or getattr(record, "metadata", None)
        ),
    }
    return UsageResponse.model_validate(data)

class UsageSummaryResponse(BaseModel):
    feature: str
    count: int

@router.post("/track", response_model=UsageResponse)
async def track_usage(
    usage: UsageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track a usage event"""
    usage_service = UsageService(db)
    service_kwargs = {
        "user": current_user,
        "feature": usage.feature,
        "action": usage.action,
        "metadata": usage.metadata,
    }
    if usage.tokens_used is not None:
        service_kwargs["tokens_used"] = usage.tokens_used

    usage_record = await usage_service.track_usage(**service_kwargs)
    return _serialize_usage(usage_record)

@router.get("/history", response_model=List[UsageResponse])
async def get_usage_history(
    feature: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage history for the current user"""
    usage_service = UsageService(db)
    usage_records = await usage_service.get_usage(
        user=current_user,
        feature=feature,
        start_date=start_date,
        end_date=end_date
    )
    return [_serialize_usage(record) for record in usage_records]

@router.get("/summary", response_model=Dict[str, int])
async def get_usage_summary(
    feature: Optional[str] = None,
    period: str = 'daily',
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage summary for the current user"""
    usage_service = UsageService(db)
    return await usage_service.get_usage_summary(
        user=current_user,
        feature=feature,
        period=period
    )

@router.get("/tokens", response_model=Dict[str, Any])
async def get_token_usage_summary(
    period: str = 'monthly',
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get token usage summary for the current user"""
    usage_service = UsageService(db)
    return await usage_service.get_token_usage_summary(
        user=current_user,
        period=period
    )

@router.get("/limits")
async def get_usage_limits(
    feature: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage limits for the current user's plan"""
    usage_service = UsageService(db)
    return await usage_service.get_usage_limits(
        user=current_user,
        feature=feature
    ) 
