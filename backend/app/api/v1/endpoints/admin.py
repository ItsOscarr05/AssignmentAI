from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.core.deps import get_current_active_superuser, get_db
from app.services.health_service import check_postgres_health
from app.crud import get_logs, delete_log

router = APIRouter()

@router.get("/stats", response_model=schemas.AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """
    Get admin dashboard statistics
    """
    return {
        "total_users": crud.user.count(db),
        "total_teachers": crud.user.count_by_role(db, "teacher"),
        "total_students": crud.user.count_by_role(db, "student"),
        "total_assignments": crud.assignment.count(db),
        "total_submissions": crud.submission.count(db),
        "recent_activity": crud.activity.get_recent(db, limit=10)
    }

@router.get("/users", response_model=List[schemas.User])
def get_all_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """
    Get all users (admin only)
    """
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users

@router.put("/users/{user_id}/status", response_model=schemas.User)
def update_user_status(
    user_id: int,
    status: schemas.UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """
    Update user status (admin only)
    """
    user = crud.user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = crud.user.update_status(db, db_obj=user, status=status)
    return user

@router.get("/health")
async def get_system_health(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_superuser)
):
    """
    Get system health status. Only superusers can access this endpoint.
    """
    return {
        "database": check_postgres_health(),
    }

@router.get("/logs", response_model=List[schemas.SystemLog])
def read_logs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = None,
    current_user: dict = Depends(get_current_active_superuser)
):
    """
    Retrieve system logs. Only superusers can access this endpoint.
    """
    logs = get_logs(db, skip=skip, limit=limit, level=level)
    return logs

@router.delete("/logs/{log_id}")
def delete_log_endpoint(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_superuser)
):
    """
    Delete a system log. Only superusers can access this endpoint.
    """
    success = delete_log(db, log_id=log_id)
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted successfully"} 
