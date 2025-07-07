from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, List
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.security import SecurityAlert, AuditLog
from app.services.security_monitoring import security_monitoring
from app.services.audit_service import audit_service
from app.schemas.security import SecurityAlertCreate, SecurityAlertUpdate
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
    
    # Query alerts from database
    query = db.query(SecurityAlert).filter(
        SecurityAlert.timestamp >= start_date,
        SecurityAlert.timestamp <= end_date
    )
    
    if severity:
        query = query.filter(SecurityAlert.severity == severity)
    
    alerts = query.all()
    
    return [
        {
            "id": alert.id,
            "alert_type": alert.alert_type,
            "description": alert.description,
            "severity": alert.severity,
            "timestamp": alert.timestamp.isoformat(),
            "alert_metadata": alert.alert_metadata,
            "resolved": alert.resolved,
            "resolution_notes": alert.resolution_notes
        }
        for alert in alerts
    ]

@router.post("/alerts", status_code=201)
async def create_security_alert(
    alert_data: SecurityAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new security alert"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create security alerts"
        )
    
    alert = SecurityAlert(
        user_id=current_user.id,
        alert_type=alert_data.alert_type,
        description=alert_data.description,
        severity=alert_data.severity,
        alert_metadata=alert_data.alert_metadata,
        timestamp=datetime.utcnow()
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {
        "id": alert.id,
        "alert_type": alert.alert_type,
        "description": alert.description,
        "severity": alert.severity,
        "timestamp": alert.timestamp.isoformat(),
        "alert_metadata": alert.alert_metadata,
        "resolved": alert.resolved,
        "resolution_notes": alert.resolution_notes
    }

@router.patch("/alerts/{alert_id}")
async def update_security_alert(
    alert_id: int,
    alert_update: SecurityAlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a security alert"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update security alerts"
        )
    
    alert = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Security alert not found"
        )
    
    if alert_update.resolved is not None:
        alert.resolved = alert_update.resolved
    if alert_update.resolution_notes is not None:
        alert.resolution_notes = alert_update.resolution_notes
    
    db.commit()
    db.refresh(alert)
    
    return {
        "id": alert.id,
        "alert_type": alert.alert_type,
        "description": alert.description,
        "severity": alert.severity,
        "timestamp": alert.timestamp.isoformat(),
        "alert_metadata": alert.alert_metadata,
        "resolved": alert.resolved,
        "resolution_notes": alert.resolution_notes
    }

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
    
    # Query logs from database
    query = db.query(AuditLog).filter(
        AuditLog.timestamp >= start_date,
        AuditLog.timestamp <= end_date
    )
    
    if event_type:
        query = query.filter(AuditLog.action == event_type)
    
    logs = query.all()
    
    return [
        {
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "timestamp": log.timestamp.isoformat(),
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent
        }
        for log in logs
    ]

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
