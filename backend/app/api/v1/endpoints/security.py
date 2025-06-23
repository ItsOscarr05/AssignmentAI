from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, List
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.security_monitoring import security_monitoring
from app.services.audit_service import audit_service
import json

router = APIRouter()

@router.get("/metrics")
async def get_security_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current security metrics"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view security metrics"
        )
    
    # Get metrics from the last 24 hours
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=1)
    
    metrics = security_monitoring.generate_security_report(start_date, end_date)
    return metrics

@router.get("/alerts")
async def get_security_alerts(
    severity: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get security alerts with optional filtering"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view security alerts"
        )
    
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)
    if not end_date:
        end_date = datetime.utcnow()
    
    alerts = []
    with open(security_monitoring.alert_log_file, "r") as f:
        for line in f:
            alert = json.loads(line)
            alert_time = datetime.fromisoformat(alert["timestamp"])
            if start_date <= alert_time <= end_date:
                if not severity or alert["severity"] == severity:
                    alerts.append(alert)
    
    return alerts

@router.get("/audit-logs")
async def get_audit_logs(
    event_type: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit logs with optional filtering"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view audit logs"
        )
    
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=7)
    if not end_date:
        end_date = datetime.utcnow()
    
    logs = []
    with open(audit_service.log_file, "r") as f:
        for line in f:
            log = json.loads(line)
            log_time = datetime.fromisoformat(log["timestamp"])
            if start_date <= log_time <= end_date:
                if not event_type or log["event_type"] == event_type:
                    logs.append(log)
    
    return logs

@router.post("/generate-report")
async def generate_security_report(
    start_date: datetime,
    end_date: datetime,
    report_type: str = "full",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a comprehensive security report"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to generate security reports"
        )
    
    report = security_monitoring.generate_security_report(start_date, end_date)
    
    # Add additional data based on report type
    if report_type == "full":
        report["audit_logs"] = await get_audit_logs(start_date=start_date, end_date=end_date)
        report["alerts"] = await get_security_alerts(start_date=start_date, end_date=end_date)
    
    return report 
