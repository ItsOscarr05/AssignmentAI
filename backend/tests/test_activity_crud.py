import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.crud import activity as activity_crud
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityFilter
from tests.conftest import TestingSessionLocal

class TestActivityCRUD:
    """Test cases for activity CRUD operations"""
    
    def test_create_activity_success(self, db: Session, test_user: User):
        """Test creating an activity successfully"""
        activity_data = ActivityCreate(
            user_id=test_user.id,
            action="test_action",
            resource_type="test_resource",
            resource_id="123"
        )
        
        activity = activity_crud.create_activity(db, activity_data)
        
        assert activity.user_id == test_user.id
        assert activity.action == "test_action"
        assert activity.resource_type == "test_resource"
        assert activity.resource_id == "123"
        assert activity.created_at is not None
    
    def test_get_activities_no_filters(self, db: Session, test_user: User):
        """Test getting activities without filters"""
        # Create test activities
        activity1 = Activity()
        activity1.user_id = test_user.id
        activity1.action = "action1"
        activity1.resource_type = "resource1"
        activity1.resource_id = "123"
        
        activity2 = Activity()
        activity2.user_id = test_user.id
        activity2.action = "action2"
        activity2.resource_type = "resource2"
        activity2.resource_id = "456"
        
        db.add_all([activity1, activity2])
        db.commit()
        
        filter_params = ActivityFilter()
        activities = activity_crud.get_activities(db, filter_params)
        
        assert len(activities) >= 2
    
    def test_get_activities_with_user_filter(self, db: Session, test_user: User):
        """Test getting activities with user filter"""
        # Create test activity
        activity = Activity()
        activity.user_id = test_user.id
        activity.action = "test_action"
        activity.resource_type = "test_resource"
        activity.resource_id = "123"
        db.add(activity)
        db.commit()
        
        filter_params = ActivityFilter(user_id=test_user.id)
        activities = activity_crud.get_activities(db, filter_params)
        
        assert len(activities) >= 1
        assert activities[0].user_id == test_user.id
    
    def test_get_activities_with_action_filter(self, db: Session, test_user: User):
        """Test getting activities with action filter"""
        # Create test activity
        activity = Activity()
        activity.user_id = test_user.id
        activity.action = "specific_action"
        activity.resource_type = "test_resource"
        activity.resource_id = "123"
        db.add(activity)
        db.commit()
        
        filter_params = ActivityFilter(action="specific_action")
        activities = activity_crud.get_activities(db, filter_params)
        
        assert len(activities) >= 1
        assert activities[0].action == "specific_action"
    
    def test_get_activities_with_resource_type_filter(self, db: Session, test_user: User):
        """Test getting activities with resource type filter"""
        # Create test activity
        activity = Activity()
        activity.user_id = test_user.id
        activity.action = "test_action"
        activity.resource_type = "specific_resource"
        activity.resource_id = "123"
        db.add(activity)
        db.commit()
        
        filter_params = ActivityFilter(resource_type="specific_resource")
        activities = activity_crud.get_activities(db, filter_params)
        
        assert len(activities) >= 1
        assert activities[0].resource_type == "specific_resource"
    
    def test_get_activities_with_resource_id_filter(self, db: Session, test_user: User):
        """Test getting activities with resource ID filter"""
        # Create test activity
        activity = Activity()
        activity.user_id = test_user.id
        activity.action = "test_action"
        activity.resource_type = "test_resource"
        activity.resource_id = "specific_id"
        db.add(activity)
        db.commit()
        
        filter_params = ActivityFilter(resource_id="specific_id")
        activities = activity_crud.get_activities(db, filter_params)
        
        assert len(activities) >= 1
        assert activities[0].resource_id == "specific_id"
    
    def test_get_activities_with_date_filters(self, db: Session, test_user: User):
        """Test getting activities with date filters"""
        # Create test activity
        activity = Activity()
        activity.user_id = test_user.id
        activity.action = "test_action"
        activity.resource_type = "test_resource"
        activity.resource_id = "123"
        db.add(activity)
        db.commit()
        
        start_date = datetime.now() - timedelta(days=1)
        end_date = datetime.now() + timedelta(days=1)
        
        filter_params = ActivityFilter(
            start_date=start_date,
            end_date=end_date
        )
        activities = activity_crud.get_activities(db, filter_params)
        
        assert len(activities) >= 1
    
    def test_get_activities_with_pagination(self, db: Session, test_user: User):
        """Test getting activities with pagination"""
        # Create multiple test activities
        for i in range(5):
            activity = Activity()
            activity.user_id = test_user.id
            activity.action = f"action_{i}"
            activity.resource_type = "test_resource"
            activity.resource_id = str(i)
            db.add(activity)
        db.commit()
        
        filter_params = ActivityFilter()
        activities = activity_crud.get_activities(db, filter_params, skip=0, limit=3)
        
        assert len(activities) <= 3
    
    def test_get_user_activities_success(self, db: Session, test_user: User):
        """Test getting activities for a specific user"""
        # Create test activity
        activity = Activity()
        activity.user_id = test_user.id
        activity.action = "test_action"
        activity.resource_type = "test_resource"
        activity.resource_id = "123"
        db.add(activity)
        db.commit()
        
        activities = activity_crud.get_user_activities(db, test_user.id)
        
        assert len(activities) >= 1
        assert activities[0].user_id == test_user.id
    
    def test_get_user_activities_with_pagination(self, db: Session, test_user: User):
        """Test getting user activities with pagination"""
        # Create multiple test activities
        for i in range(5):
            activity = Activity()
            activity.user_id = test_user.id
            activity.action = f"action_{i}"
            activity.resource_type = "test_resource"
            activity.resource_id = str(i)
            db.add(activity)
        db.commit()
        
        activities = activity_crud.get_user_activities(db, test_user.id, skip=0, limit=3)
        
        assert len(activities) <= 3
    
    def test_get_activity_stats_success(self, db: Session, test_user: User):
        """Test getting activity statistics"""
        # Create test activities
        for i in range(3):
            activity = Activity()
            activity.user_id = test_user.id
            activity.action = "test_action"
            activity.resource_type = "test_resource"
            activity.resource_id = str(i)
            db.add(activity)
        db.commit()
        
        stats = activity_crud.get_activity_stats(db, test_user.id)
        
        assert stats is not None
        assert "total_activities" in stats
        assert "actions" in stats
        assert "resource_types" in stats
    
    def test_get_activity_stats_with_dates(self, db: Session, test_user: User):
        """Test getting activity statistics with date range"""
        # Create test activities
        for i in range(3):
            activity = Activity()
            activity.user_id = test_user.id
            activity.action = "test_action"
            activity.resource_type = "test_resource"
            activity.resource_id = str(i)
            db.add(activity)
        db.commit()
        
        start_date = datetime.now() - timedelta(days=1)
        end_date = datetime.now() + timedelta(days=1)
        
        stats = activity_crud.get_activity_stats(db, test_user.id, start_date, end_date)
        
        assert stats is not None
        assert "total_activities" in stats
    
    def test_get_activity_stats_empty(self, db):
        """Test getting activity statistics for user with no activities"""
        # Use a non-existent integer user ID
        stats = activity_crud.get_activity_stats(db, 99999)
        
        assert stats is not None
        assert stats["total_activities"] == 0
    
    def test_delete_old_activities_success(self, db: Session, test_user: User):
        """Test deleting old activities"""
        # Create old activity (more than 30 days ago)
        old_activity = Activity()
        old_activity.user_id = test_user.id
        old_activity.action = "old_action"
        old_activity.resource_type = "old_resource"
        old_activity.resource_id = "old_id"
        old_activity.created_at = datetime.now() - timedelta(days=35)
        db.add(old_activity)
        
        # Create recent activity
        recent_activity = Activity()
        recent_activity.user_id = test_user.id
        recent_activity.action = "recent_action"
        recent_activity.resource_type = "recent_resource"
        recent_activity.resource_id = "recent_id"
        db.add(recent_activity)
        db.commit()
        
        deleted_count = activity_crud.delete_old_activities(db, days=30)
        
        assert deleted_count >= 1
        
        # Verify old activity is deleted
        remaining_activities = db.query(Activity).filter(Activity.user_id == test_user.id).all()
        assert len(remaining_activities) >= 1
        assert all(activity.action != "old_action" for activity in remaining_activities)
    
    def test_delete_old_activities_none_to_delete(self, db: Session, test_user: User):
        """Test deleting old activities when none exist"""
        # Create only recent activities
        for i in range(3):
            activity = Activity()
            activity.user_id = test_user.id
            activity.action = f"recent_action_{i}"
            activity.resource_type = "recent_resource"
            activity.resource_id = str(i)
            db.add(activity)
        db.commit()
        
        deleted_count = activity_crud.delete_old_activities(db, days=30)
        
        assert deleted_count == 0
        
        # Verify all activities still exist
        remaining_activities = db.query(Activity).filter(Activity.user_id == test_user.id).all()
        assert len(remaining_activities) >= 3 