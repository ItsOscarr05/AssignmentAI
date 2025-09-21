from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.assignment import Assignment
from app.models.file import File
from app.models.subscription import Subscription
from app.models.activity import Activity
from app.crud import file_upload as file_upload_crud
from datetime import datetime, timedelta
from app.core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "message": "Dashboard API is working"}

@router.get("/test")
async def test_dashboard_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Test endpoint to check if models are working"""
    try:
        print(f"Testing models for user: {current_user.id}")
        
        # Test Assignment model
        assignment_count = db.query(Assignment).count()
        print(f"Total assignments in DB: {assignment_count}")
        
        # Test File model
        file_count = db.query(File).count()
        print(f"Total files in DB: {file_count}")
        
        # Test Activity model
        activity_count = db.query(Activity).count()
        print(f"Total activities in DB: {activity_count}")
        
        # Test Subscription model
        subscription_count = db.query(Subscription).count()
        print(f"Total subscriptions in DB: {subscription_count}")
        
        return {
            "message": "Models test successful",
            "assignment_count": assignment_count,
            "file_count": file_count,
            "activity_count": activity_count,
            "subscription_count": subscription_count
        }
    except Exception as e:
        print(f"Models test error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for the current user"""
    try:
        print(f"Getting dashboard stats for user: {current_user.id}")
        # Get assignment statistics
        try:
            total_assignments = db.query(Assignment).filter(
                Assignment.created_by_id == current_user.id
            ).count()
            print(f"Total assignments: {total_assignments}")
        except Exception as e:
            print(f"Error getting total assignments: {e}")
            total_assignments = 0
        
        try:
            completed_assignments = db.query(Assignment).filter(
                Assignment.created_by_id == current_user.id,
                Assignment.status == "published"
            ).count()
            print(f"Completed assignments: {completed_assignments}")
        except Exception as e:
            print(f"Error getting completed assignments: {e}")
            completed_assignments = 0
        
        try:
            pending_assignments = db.query(Assignment).filter(
                Assignment.created_by_id == current_user.id,
                Assignment.status.in_(["draft", "archived"])
            ).count()
            print(f"Pending assignments: {pending_assignments}")
        except Exception as e:
            print(f"Error getting pending assignments: {e}")
            pending_assignments = 0
        
        # Get file statistics - temporarily disabled due to missing user_id field
        total_files = 0
        storage_used = 0
        
        # Get storage limit based on subscription
        try:
            subscription = db.query(Subscription).filter(
                Subscription.user_id == current_user.id,
                Subscription.status == "active"
            ).first()
            print(f"Subscription found: {subscription is not None}")
        except Exception as e:
            print(f"Error getting subscription: {e}")
            subscription = None
        
        storage_limit = get_storage_limit(subscription)
        
        # Calculate monthly usage
        try:
            start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_assignments = db.query(Assignment).filter(
                Assignment.created_by_id == current_user.id,
                Assignment.created_at >= start_of_month
            ).count()
            print(f"Monthly assignments: {monthly_assignments}")
        except Exception as e:
            print(f"Error getting monthly assignments: {e}")
            monthly_assignments = 0
        
        monthly_limit = get_monthly_limit(subscription)
        
        print(f"Dashboard stats calculated: assignments={total_assignments}, completed={completed_assignments}, pending={pending_assignments}, files={total_files}, storage={storage_used}, monthly={monthly_assignments}")
        
        # Return basic data for now to get the endpoint working
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
        print(f"Dashboard stats error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activity")
async def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10
):
    """Get recent activity for the current user"""
    try:
        # Get recent activities - temporarily disabled due to missing user_id field
        # activities = db.query(Activity).filter(
        #     Activity.user_id == current_user.id
        # ).order_by(Activity.created_at.desc()).limit(limit).all()
        
        # activity_list = []
        # for activity in activities:
        #     activity_data = {
        #         "id": str(activity.id),
        #         "type": activity.type,
        #         "title": get_activity_title(activity),
        #         "description": get_activity_description(activity),
        #         "timestamp": activity.created_at.isoformat(),
        #     }
        #     activity_list.append(activity_data)
        
        # return activity_list
        return []
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
            Assignment.created_by_id == current_user.id
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
    """Get recent files for the current user - temporarily disabled due to missing user_id field"""
    # try:
    #     files = db.query(File).filter(
    #         File.user_id == current_user.id
    #     ).order_by(File.created_at.desc()).limit(limit).all()
    #     
    #     file_list = []
    #     for file in files:
    #         file_data = {
    #         "id": str(file.id),
    #         "name": file.name,
    #         "size": file.size,
    #         "type": file.type,
    #         "created_at": file.created_at.isoformat(),
    #     }
    #         file_list.append(file_data)
    #     
    #     return file_list
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=str(e))
    return []

@router.get("/file-uploads/recent")
async def get_recent_file_uploads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5
):
    """Get recent file uploads for the current user"""
    try:
        file_uploads = file_upload_crud.get_recent_file_uploads(db, current_user.id, limit)
        
        file_list = []
        for file_upload in file_uploads:
            file_data = {
                "id": str(file_upload.id),
                "filename": file_upload.filename,
                "original_filename": file_upload.original_filename,
                "file_size": file_upload.file_size,
                "file_type": file_upload.file_type,
                "is_link": file_upload.is_link,
                "link_url": file_upload.link_url,
                "link_title": file_upload.link_title,
                "assignment_id": file_upload.assignment_id,
                "created_at": file_upload.created_at.isoformat(),
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
            Assignment.created_by_id == current_user.id,
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
            if assignment.status == "published":
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
    try:
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
    except Exception as e:
        print(f"Error in get_storage_limit: {e}")
        return 100 * 1024 * 1024  # Default to 100MB

def get_monthly_limit(subscription: Subscription) -> int:
    """Get monthly assignment limit based on subscription plan"""
    try:
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
    except Exception as e:
        print(f"Error in get_monthly_limit: {e}")
        return 5  # Default to 5 assignments

def get_activity_title(activity: Activity) -> str:
    """Get activity title based on type"""
    try:
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
    except Exception as e:
        print(f"Error in get_activity_title: {e}")
        return "Activity"

def get_activity_description(activity: Activity) -> str:
    """Get activity description based on type and metadata"""
    try:
        metadata = getattr(activity, 'activity_metadata', {}) or {}
        
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
    except Exception as e:
        print(f"Error in get_activity_description: {e}")
        return "Activity occurred" 
