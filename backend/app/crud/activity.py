from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityFilter

def create_activity(db: Session, activity: ActivityCreate) -> Activity:
    """Create a new activity record"""
    db_activity = Activity(**activity.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def get_activities(
    db: Session,
    filter_params: ActivityFilter,
    skip: int = 0,
    limit: int = 100
) -> List[Activity]:
    """Get activities with filtering"""
    query = db.query(Activity)

    # Apply filters
    if filter_params.user_id:
        query = query.filter(Activity.user_id == filter_params.user_id)
    if filter_params.action:
        query = query.filter(Activity.action == filter_params.action)
    if filter_params.resource_type:
        query = query.filter(Activity.resource_type == filter_params.resource_type)
    if filter_params.resource_id:
        query = query.filter(Activity.resource_id == filter_params.resource_id)
    if filter_params.start_date:
        query = query.filter(Activity.created_at >= filter_params.start_date)
    if filter_params.end_date:
        query = query.filter(Activity.created_at <= filter_params.end_date)

    # Order by creation date (newest first)
    query = query.order_by(Activity.created_at.desc())

    return query.offset(skip).limit(limit).all()

def get_user_activities(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Activity]:
    """Get activities for a specific user"""
    return (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_activity_stats(
    db: Session,
    user_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> dict:
    """Get activity statistics for a user"""
    query = db.query(Activity).filter(Activity.user_id == user_id)

    if start_date:
        query = query.filter(Activity.created_at >= start_date)
    if end_date:
        query = query.filter(Activity.created_at <= end_date)

    activities = query.all()

    # Calculate statistics
    stats = {
        "total_activities": len(activities),
        "actions": {},
        "resource_types": {},
        "daily_activity": {},
    }

    for activity in activities:
        # Count actions
        stats["actions"][activity.action] = stats["actions"].get(activity.action, 0) + 1

        # Count resource types
        if activity.resource_type:
            stats["resource_types"][activity.resource_type] = (
                stats["resource_types"].get(activity.resource_type, 0) + 1
            )

        # Count daily activity
        date_str = activity.created_at.strftime("%Y-%m-%d")
        stats["daily_activity"][date_str] = stats["daily_activity"].get(date_str, 0) + 1

    return stats

def delete_old_activities(db: Session, days: int = 90) -> int:
    """Delete activities older than specified days"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    result = db.query(Activity).filter(Activity.created_at < cutoff_date).delete()
    db.commit()
    return result 