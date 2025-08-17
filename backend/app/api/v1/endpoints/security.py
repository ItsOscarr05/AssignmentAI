from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, List
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.security import SecurityAlert, AuditLog
from app.models.session import UserSession
from app.services.security_monitoring import security_monitoring
from app.services.audit_service import audit_service
from app.schemas.security import SecurityAlertCreate, SecurityAlertUpdate
from app.crud.session import session
import json

router = APIRouter()

def _get_audit_logs(db, start_date, end_date, event_type=None):
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

def _get_security_alerts(db, start_date, end_date, severity=None):
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
    
    return _get_security_alerts(db, start_date, end_date, severity)

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
    
    return _get_audit_logs(db, start_date, end_date, event_type)

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
        report["audit_logs"] = _get_audit_logs(db, start_date, end_date)
        report["alerts"] = _get_security_alerts(db, start_date, end_date)
    
    return report

@router.get("/sessions")
async def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active sessions for the current user"""
    active_sessions = session.get_active_sessions_by_user(db, current_user.id)
    
    session_list = []
    for sess in active_sessions:
        # Determine if this is the current session
        is_current = False
        # This would need to be implemented based on your token/session management
        # For now, we'll mark the most recent session as current
        
        session_data = {
            "id": sess.id,
            "device_info": sess.device_info,
            "created_at": sess.created_at.isoformat(),
            "last_accessed": sess.last_accessed.isoformat() if sess.last_accessed else None,
            "expires_at": sess.expires_at.isoformat(),
            "is_current": is_current
        }
        session_list.append(session_data)
    
    return {
        "sessions": session_list,
        "total_count": len(session_list)
    }

@router.get("/sessions/count")
async def get_active_session_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the count of active sessions for the current user"""
    count = session.get_session_count_by_user(db, current_user.id)
    return {"active_sessions": count}

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke a specific session"""
    # Verify the session belongs to the current user
    sess = session.get_session_by_id(db, session_id)
    if not sess or sess.user_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    success = session.invalidate_session(db, session_id)
    if success:
        return {"message": "Session revoked successfully"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to revoke session"
        )

@router.delete("/sessions")
async def revoke_all_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke all sessions except the current one"""
    # This would need to be implemented to identify the current session
    # For now, we'll revoke all sessions
    count = session.invalidate_all_user_sessions(db, current_user.id)
    return {"message": f"Revoked {count} sessions"}

@router.get("/sessions/analytics")
async def get_session_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get session analytics for the current user"""
    analytics = session.get_session_analytics(db, current_user.id)
    return analytics

@router.get("/user-info")
async def get_user_security_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's security information"""
    from app.services.password_service import PasswordService
    from app.services.audit_service import audit_service
    
    password_service = PasswordService()
    
    # Get password strength (this would need the actual password hash)
    # For now, we'll return a placeholder that the frontend can update
    password_strength = "strong"  # This should be calculated from actual password
    
    # Get last password change from user model (handle missing field gracefully)
    last_password_change = None
    if hasattr(current_user, 'last_password_change') and current_user.last_password_change:
        last_password_change = current_user.last_password_change.isoformat()
    
    # Get failed login attempts (handle missing field gracefully)
    failed_login_attempts = 0
    if hasattr(current_user, 'failed_login_attempts') and current_user.failed_login_attempts:
        failed_login_attempts = current_user.failed_login_attempts
    
    # Get last security audit (most recent audit log)
    last_audit = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action.in_(["security_audit", "password_change", "login_attempt"])
    ).order_by(AuditLog.timestamp.desc()).first()
    
    last_security_audit = last_audit.timestamp.isoformat() if last_audit else None
    
    # Clean up expired sessions first
    cleaned_count = session.cleanup_expired_sessions(db)
    print(f"Cleaned up {cleaned_count} expired sessions for user {current_user.id}")
    
    # Clean up sessions that don't meet our 'active' criteria
    inactive_cleaned_count = session.cleanup_inactive_sessions(db, current_user.id)
    print(f"Cleaned up {inactive_cleaned_count} inactive sessions for user {current_user.id}")
    
    # Get active sessions count (now using stricter criteria)
    active_sessions = session.get_session_count_by_user(db, current_user.id)
    print(f"User {current_user.id} has {active_sessions} active sessions")
    
    # Get session diagnostics for debugging
    session_diagnostics = session.get_session_diagnostics(db, current_user.id)
    print(f"Session diagnostics: {session_diagnostics}")
    
    # Get detailed active sessions for debugging
    detailed_sessions = session.get_detailed_active_sessions(db, current_user.id)
    print(f"Detailed active sessions: {detailed_sessions}")
    
    # Calculate security score based on various factors
    security_score = 0  # Start from 0 and add points for enabled features
    
    # Base security (20 points)
    security_score += 20
    
    # Password strength (20 points)
    if password_strength == "strong":
        security_score += 20
    elif password_strength == "medium":
        security_score += 10
    
    # Two-factor authentication (25 points)
    if hasattr(current_user, 'two_factor_enabled') and current_user.two_factor_enabled:
        security_score += 25
    
    # Account verification (15 points)
    if hasattr(current_user, 'is_verified') and current_user.is_verified:
        security_score += 15
    
    # Session management (10 points) - fewer sessions is better
    if active_sessions <= 2:
        security_score += 10
    elif active_sessions <= 5:
        security_score += 5
    
    # Penalties for security issues
    if failed_login_attempts > 0:
        security_score -= min(failed_login_attempts * 5, 20)
    
    # Ensure score is between 0 and 100
    security_score = max(0, min(100, security_score))
    
    return {
        "password_strength": password_strength,
        "last_password_change": last_password_change,
        "last_security_audit": last_security_audit,
        "failed_login_attempts": failed_login_attempts,
        "active_sessions": active_sessions,
        "security_score": max(security_score, 0),
        "is_verified": getattr(current_user, 'is_verified', False),
        "two_factor_enabled": getattr(current_user, 'two_factor_enabled', False),
        "account_locked_until": current_user.account_locked_until.isoformat() if hasattr(current_user, 'account_locked_until') and current_user.account_locked_until else None
    } 

@router.post("/audit")
async def record_security_audit(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a security audit event for the current user"""
    try:
        # Create audit log entry
        audit_log = AuditLog(
            user_id=current_user.id,
            action="security_audit",
            resource_type="user_security",
            resource_id=str(current_user.id),
            timestamp=datetime.utcnow(),
            details={
                "audit_type": "manual_security_audit",
                "security_score": 0,  # Will be calculated by frontend
                "timestamp": datetime.utcnow().isoformat()
            },
            ip_address="127.0.0.1",  # TODO: Get actual IP from request
            user_agent="AssignmentAI Security Audit"
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return {
            "message": "Security audit recorded successfully",
            "audit_id": audit_log.id,
            "timestamp": audit_log.timestamp.isoformat()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record security audit: {str(e)}"
        )
