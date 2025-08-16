from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.assignment import Assignment
from app.models.file import File
from app.models.subscription import Subscription
from app.models.activity import Activity
from datetime import datetime, timedelta
from app.core.config import settings

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for the current user"""
    try:
        # Get assignment statistics
        total_assignments = db.query(Assignment).filter(
            Assignment.user_id == current_user.id
        ).count()
        
        completed_assignments = db.query(Assignment).filter(
            Assignment.user_id == current_user.id,
            Assignment.status == "completed"
        ).count()
        
        pending_assignments = db.query(Assignment).filter(
            Assignment.user_id == current_user.id,
            Assignment.status.in_(["pending", "processing"])
        ).count()
        
        # Get file statistics
        total_files = db.query(File).filter(
            File.user_id == current_user.id
        ).count()
        
        # Calculate storage usage
        files = db.query(File).filter(File.user_id == current_user.id).all()
        storage_used = sum(file.size for file in files)
        
        # Get storage limit based on subscription
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).first()
        
        storage_limit = get_storage_limit(subscription)
        
        # Calculate monthly usage
        start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_assignments = db.query(Assignment).filter(
            Assignment.user_id == current_user.id,
            Assignment.created_at >= start_of_month
        ).count()
        
        monthly_limit = get_monthly_limit(subscription)
        
        return {
            "totalAssignments": total_assignments,
            "completedAssignments": completed_assignments,
            "pendingAssignments": pending_assignments,
            "totalFiles": total_files,
            "storageUsed": storage_used,
            "storageLimit": storage_limit,
            "monthlyUsage": monthly_assignments,
            "monthlyLimit": monthly_limit,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activity")
async def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10
):
    """Get recent activity for the current user"""
    try:
        # Get recent activities
        activities = db.query(Activity).filter(
            Activity.user_id == current_user.id
        ).order_by(Activity.created_at.desc()).limit(limit).all()
        
        activity_list = []
        for activity in activities:
            activity_data = {
                "id": str(activity.id),
                "type": activity.type,
                "title": get_activity_title(activity),
                "description": get_activity_description(activity),
                "timestamp": activity.created_at.isoformat(),
            }
            activity_list.append(activity_data)
        
        return activity_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assignments/recent")
async def get_recent_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5
):
    """Get recent assignments for the current user"""
    try:
        assignments = db.query(Assignment).filter(
            Assignment.user_id == current_user.id
        ).order_by(Assignment.created_at.desc()).limit(limit).all()
        
        assignment_list = []
        for assignment in assignments:
            assignment_data = {
                "id": str(assignment.id),
                "title": assignment.title,
                "status": assignment.status,
                "created_at": assignment.created_at.isoformat(),
                "updated_at": assignment.updated_at.isoformat(),
            }
            assignment_list.append(assignment_data)
        
        return assignment_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/recent")
async def get_recent_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5
):
    """Get recent files for the current user"""
    try:
        files = db.query(File).filter(
            File.user_id == current_user.id
        ).order_by(File.created_at.desc()).limit(limit).all()
        
        file_list = []
        for file in files:
            file_data = {
                "id": str(file.id),
                "name": file.name,
                "size": file.size,
                "type": file.type,
                "created_at": file.created_at.isoformat(),
            }
            file_list.append(file_data)
        
        return file_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage/analytics")
async def get_usage_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    period: str = "month"  # week, month, year
):
    """Get usage analytics for the current user"""
    try:
        # Calculate date range based on period
        end_date = datetime.now()
        if period == "week":
            start_date = end_date - timedelta(days=7)
        elif period == "month":
            start_date = end_date - timedelta(days=30)
        elif period == "year":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get assignments in date range
        assignments = db.query(Assignment).filter(
            Assignment.user_id == current_user.id,
            Assignment.created_at >= start_date,
            Assignment.created_at <= end_date
        ).all()
        
        # Group by date
        daily_stats = {}
        for assignment in assignments:
            date_key = assignment.created_at.strftime("%Y-%m-%d")
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    "date": date_key,
                    "assignments": 0,
                    "completed": 0,
                    "pending": 0,
                }
            daily_stats[date_key]["assignments"] += 1
            if assignment.status == "completed":
                daily_stats[date_key]["completed"] += 1
            else:
                daily_stats[date_key]["pending"] += 1
        
        # Convert to list and sort by date
        analytics_data = list(daily_stats.values())
        analytics_data.sort(key=lambda x: x["date"])
        
        return {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_assignments": len(assignments),
            "daily_stats": analytics_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_storage_limit(subscription: Subscription) -> int:
    """Get storage limit based on subscription plan"""
    if not subscription:
        return 100 * 1024 * 1024  # 100MB for free users
    
    # Storage limits by plan
    storage_limits = {
        settings.STRIPE_PRICE_FREE: 100 * 1024 * 1024,  # 100MB
        settings.STRIPE_PRICE_PLUS: 1 * 1024 * 1024 * 1024,  # 1GB
        settings.STRIPE_PRICE_PRO: 5 * 1024 * 1024 * 1024,  # 5GB
        settings.STRIPE_PRICE_MAX: 10 * 1024 * 1024 * 1024,  # 10GB
    }
    
    return storage_limits.get(subscription.plan_id, 100 * 1024 * 1024)

def get_monthly_limit(subscription: Subscription) -> int:
    """Get monthly assignment limit based on subscription plan"""
    if not subscription:
        return 5  # 5 assignments for free users
    
    # Assignment limits by plan
    assignment_limits = {
        settings.STRIPE_PRICE_FREE: 5,
        settings.STRIPE_PRICE_PLUS: 25,
        settings.STRIPE_PRICE_PRO: 100,
        settings.STRIPE_PRICE_MAX: -1,  # Unlimited
    }
    
    return assignment_limits.get(subscription.plan_id, 5)

def get_activity_title(activity: Activity) -> str:
    """Get activity title based on type"""
    if activity.type == "assignment_created":
        return "New Assignment Created"
    elif activity.type == "assignment_completed":
        return "Assignment Completed"
    elif activity.type == "file_uploaded":
        return "File Uploaded"
    elif activity.type == "subscription_updated":
        return "Subscription Updated"
    else:
        return "Activity"

def get_activity_description(activity: Activity) -> str:
    """Get activity description based on type and metadata"""
    metadata = activity.metadata or {}
    
    if activity.type == "assignment_created":
        title = metadata.get("title", "Assignment")
        return f"Created assignment: {title}"
    elif activity.type == "assignment_completed":
        title = metadata.get("title", "Assignment")
        return f"Completed assignment: {title}"
    elif activity.type == "file_uploaded":
        filename = metadata.get("filename", "File")
        return f"Uploaded file: {filename}"
    elif activity.type == "subscription_updated":
        plan = metadata.get("plan", "Plan")
        return f"Updated to {plan} plan"
    else:
        return "Activity occurred" 
