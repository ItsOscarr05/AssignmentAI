from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import get_logs, get_log, delete_log
from app.schemas.log import SystemLog

router = APIRouter()

@router.get("/", response_model=List[SystemLog])
def read_logs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    level: Optional[str] = None,
    current_user: dict = Depends(deps.get_current_active_superuser)
):
    """
    Retrieve logs. Only superusers can access this endpoint.
    """
    logs = get_logs(db, skip=skip, limit=limit, level=level)
    return logs

@router.get("/{log_id}", response_model=SystemLog)
def read_log(
    log_id: int,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_active_superuser)
):
    """
    Get a specific log by ID. Only superusers can access this endpoint.
    """
    log = get_log(db, log_id=log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@router.delete("/{log_id}")
def delete_log_endpoint(
    log_id: int,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_active_superuser)
):
    """
    Delete a log. Only superusers can access this endpoint.
    """
    success = delete_log(db, log_id=log_id)
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted successfully"} 