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
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics for the current user."""
    try:
        total_assignments = db.query(Assignment).filter(
            Assignment.created_by_id == current_user.id
        ).count()

        completed_assignments = db.query(Assignment).filter(
            Assignment.created_by_id == current_user.id,
            Assignment.status.in_(["completed", "published"]),
        ).count()

        pending_assignments = db.query(Assignment).filter(
            Assignment.created_by_id == current_user.id,
            Assignment.status.in_(["draft", "pending", "archived"]),
        ).count()

        file_query = db.query(File)
        file_user_field = getattr(File, "user_id", None)
        if file_user_field is not None:
            file_query = file_query.filter(file_user_field == current_user.id)
        else:
            file_query = file_query.filter(True)

        total_files = file_query.count()
        files = file_query.all()
        storage_used = 0
        for file in files:
            size_value = getattr(file, "size", None)
            if size_value is None:
                size_value = getattr(file, "file_size", None)
            storage_used += (size_value or 0)

        subscription = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == current_user.id,
                Subscription.status == "active",
            )
            .first()
        )
        storage_limit = get_storage_limit(subscription)

        start_of_month = datetime.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        monthly_assignments = db.query(Assignment).filter(
            Assignment.created_by_id == current_user.id,
            Assignment.created_at >= start_of_month,
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
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

@router.get("/activity")
async def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10,
):
    """Get recent activity for the current user."""
    try:
        activities = (
            db.query(Activity)
            .filter(Activity.user_id == current_user.id)
            .order_by(Activity.created_at.desc())
            .limit(limit)
            .all()
        )

        activity_list = []
        for activity in activities:
            activity_list.append(
                {
                    "id": str(getattr(activity, "id", "")),
                    "type": getattr(activity, "type", ""),
                    "title": get_activity_title(activity),
                    "description": get_activity_description(activity),
                    "timestamp": getattr(
                        activity, "created_at", datetime.utcnow()
                    ).isoformat(),
                }
            )

        return activity_list
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

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
    limit: int = 5,
):
    """Get recent files for the current user."""
    try:
        file_user_field = getattr(File, "user_id", None)
        order_field = getattr(
            File, "created_at", getattr(File, "uploaded_at", None)
        )

        file_query = db.query(File)
        if file_user_field is not None:
            file_query = file_query.filter(file_user_field == current_user.id)
        else:
            file_query = file_query.filter(True)

        if order_field is not None:
            file_query = file_query.order_by(order_field.desc())
        else:
            file_query = file_query.order_by()

        files = file_query.limit(limit).all()

        file_list = []
        for file in files:
            file_list.append(
                {
                    "id": str(getattr(file, "id", "")),
                    "name": getattr(file, "name", getattr(file, "filename", "")),
                    "size": (
                        getattr(file, "size", getattr(file, "file_size", 0)) or 0
                    ),
                    "type": getattr(file, "type", getattr(file, "mime_type", "")),
                    "created_at": getattr(
                        file,
                        "created_at",
                        getattr(file, "uploaded_at", datetime.utcnow()),
                    ).isoformat(),
                }
            )

        return file_list
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

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
            status_value = (getattr(assignment, "status", "") or "").lower()
            if status_value in {"completed", "published", "submitted", "graded"}:
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

        plan_id = (getattr(subscription, "plan_id", "") or "").lower()
        plan_aliases = [
            (100 * 1024 * 1024, [settings.STRIPE_PRICE_FREE, "price_free", "free"]),
            (1 * 1024 * 1024 * 1024, [settings.STRIPE_PRICE_PLUS, "price_plus", "plus"]),
            (5 * 1024 * 1024 * 1024, [settings.STRIPE_PRICE_PRO, "price_pro", "pro"]),
            (10 * 1024 * 1024 * 1024, [settings.STRIPE_PRICE_MAX, "price_max", "max"]),
        ]

        for limit, candidates in plan_aliases:
            for candidate in candidates:
                if candidate and plan_id == candidate.lower():
                    return limit

        return 100 * 1024 * 1024  # Default to 100MB
    except Exception as e:
        print(f"Error in get_storage_limit: {e}")
        return 100 * 1024 * 1024  # Default to 100MB

def get_monthly_limit(subscription: Subscription) -> int:
    """Get monthly assignment limit based on subscription plan"""
    try:
        if not subscription:
            return 5  # 5 assignments for free users

        plan_id = (getattr(subscription, "plan_id", "") or "").lower()
        plan_aliases = [
            (5, [settings.STRIPE_PRICE_FREE, "price_free", "free"]),
            (25, [settings.STRIPE_PRICE_PLUS, "price_plus", "plus"]),
            (100, [settings.STRIPE_PRICE_PRO, "price_pro", "pro"]),
            (-1, [settings.STRIPE_PRICE_MAX, "price_max", "max"]),
        ]

        for limit, candidates in plan_aliases:
            for candidate in candidates:
                if candidate and plan_id == candidate.lower():
                    return limit

        return 5
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
        raw_metadata = getattr(activity, "metadata", None)
        if raw_metadata is None:
            raw_metadata = getattr(activity, "activity_metadata", None)

        metadata = raw_metadata if isinstance(raw_metadata, dict) else {}

        activity_type = getattr(activity, "type", "")

        if activity_type == "assignment_created":
            title = metadata.get("title", "Assignment")
            return f"Created assignment: {title}"
        elif activity_type == "assignment_completed":
            title = metadata.get("title", "Assignment")
            return f"Completed assignment: {title}"
        elif activity_type == "file_uploaded":
            filename = metadata.get("filename", "File")
            return f"Uploaded file: {filename}"
        elif activity_type == "subscription_updated":
            plan = metadata.get("plan", "Plan")
            return f"Updated to {plan} plan"
        else:
            return "Activity occurred"
    except Exception as e:
        print(f"Error in get_activity_description: {e}")
        return "Activity occurred" 
