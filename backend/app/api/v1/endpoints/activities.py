from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.activity import Activity, ActivityFilter, ActivityResponse
from app.crud import activity as activity_crud

router = APIRouter()

@router.get("/", response_model=List[Activity])
async def get_activities(
    filter_params: ActivityFilter = Depends(),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activities with filtering"""
    # Only allow users to view their own activities unless they're admin
    if not current_user.role == "admin":
        filter_params.user_id = current_user.id
    
    return activity_crud.get_activities(db, filter_params, skip, limit)

@router.get("/stats")
async def get_activity_stats(
    start_date: str = None,
    end_date: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity statistics"""
    return activity_crud.get_activity_stats(
        db,
        current_user.id,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/user/{user_id}", response_model=List[Activity])
async def get_user_activities(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activities for a specific user"""
    # Only allow users to view their own activities unless they're admin
    if not current_user.role == "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other users' activities"
        )
    
    return activity_crud.get_user_activities(db, user_id, skip, limit)

@router.delete("/cleanup")
async def cleanup_old_activities(
    days: int = Query(90, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete activities older than specified days"""
    # Only allow admins to clean up activities
    if not current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Not authorized to clean up activities"
        )
    
    deleted_count = activity_crud.delete_old_activities(db, days)
    return {"message": f"Deleted {deleted_count} old activities"} 
