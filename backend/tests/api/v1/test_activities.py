import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from app.main import app
from app.models.user import User
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate
from tests.conftest import TestingSessionLocal
from app.auth import get_current_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_get_current_user(test_user):
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.clear()

class TestActivitiesEndpoints:
    """Test cases for activities endpoints"""
    
    def test_get_activities_success(self, db: Session, test_user: User):
        """Test getting activities successfully"""
        # Create test activity
        activity_data = ActivityCreate(
            user_id=test_user.id,
            action="test_action",
            resource_type="test_resource",
            resource_id="123"
        )
        activity = Activity(**activity_data.model_dump())
        db.add(activity)
        db.commit()
        
        response = client.get("/api/v1/activities/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["action"] == "test_action"
    
    def test_get_activities_with_filtering(self, db: Session, test_user: User):
        """Test getting activities with filtering"""
        response = client.get("/api/v1/activities/?action=test_action&resource_type=test_resource")
        
        assert response.status_code == 200
    
    def test_get_activities_unauthorized(self, db: Session):
        """Test getting activities without authentication"""
        from app.main import app
        app.dependency_overrides.clear()
        response = client.get("/api/v1/activities/")
        assert response.status_code == 401
    
    def test_get_activity_stats_success(self, db: Session, test_user: User):
        """Test getting activity statistics"""
        response = client.get("/api/v1/activities/stats")
        
        assert response.status_code == 200
    
    def test_get_activity_stats_with_dates(self, db: Session, test_user: User):
        """Test getting activity statistics with date range"""
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")
        
        response = client.get(f"/api/v1/activities/stats?start_date={start_date}&end_date={end_date}")
        
        assert response.status_code == 200
    
    def test_get_user_activities_success(self, db: Session, test_user: User):
        """Test getting activities for a specific user"""
        response = client.get(f"/api/v1/activities/user/{test_user.id}")
        
        assert response.status_code == 200
    
    def test_get_user_activities_unauthorized(self, db: Session, test_user: User):
        """Test getting activities for another user (should be forbidden)"""
        # Create another user
        from app.models.user import User
        from datetime import datetime
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        other_user = User(
            email=f"otheruser-{unique_id}@example.com",
            hashed_password="fakehash",
            name="Other User",
            is_active=True,
            is_verified=True,
            is_superuser=False,
            updated_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)
        # Ensure test_user is not admin
        test_user.is_superuser = False
        db.commit()
        response = client.get(f"/api/v1/activities/user/{other_user.id}")
        assert response.status_code == 403
    
    def test_get_user_activities_admin_access(self, db: Session, test_user: User):
        """Test admin accessing other user's activities"""
        # Make user admin
        test_user.is_superuser = True
        db.commit()
        # Create another user
        from app.models.user import User
        from datetime import datetime
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        other_user = User(
            email=f"otheruser2-{unique_id}@example.com",
            hashed_password="fakehash",
            name="Other User2",
            is_active=True,
            is_verified=True,
            is_superuser=False,
            updated_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)
        response = client.get(f"/api/v1/activities/user/{other_user.id}")
        assert response.status_code == 200
    
    def test_cleanup_old_activities_success(self, db: Session, test_user: User):
        """Test cleaning up old activities as admin"""
        # Make user admin
        test_user.is_superuser = True
        db.commit()
        
        response = client.delete("/api/v1/activities/cleanup?days=90")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_cleanup_old_activities_unauthorized(self, db: Session, test_user: User):
        """Test cleaning up old activities without admin privileges"""
        # Ensure user is not admin
        test_user.is_superuser = False
        db.commit()
        response = client.delete("/api/v1/activities/cleanup?days=90")
        assert response.status_code == 403
    
    def test_cleanup_old_activities_invalid_days(self, db: Session, test_user: User):
        """Test cleaning up old activities with invalid days parameter"""
        # Make user admin
        test_user.is_superuser = True
        db.commit()
        
        response = client.delete("/api/v1/activities/cleanup?days=0")
        
        assert response.status_code == 422
    
    def test_get_activities_pagination(self, db: Session, test_user: User):
        """Test getting activities with pagination"""
        response = client.get("/api/v1/activities/?skip=0&limit=10")
        
        assert response.status_code == 200
    
    def test_get_activities_invalid_pagination(self, db: Session, test_user: User):
        """Test getting activities with invalid pagination parameters"""
        response = client.get("/api/v1/activities/?skip=-1&limit=0")
        
        assert response.status_code == 422 
    
    def test_get_activities_non_superuser_filtering(self, db: Session, test_user: User):
        """Test that non-superuser users can only see their own activities"""
        # Ensure test_user is not a superuser
        test_user.is_superuser = False
        db.commit()
        
        # Create activities for different users
        from app.models.activity import Activity
        from app.schemas.activity import ActivityCreate
        
        # Activity for test_user
        activity_data = ActivityCreate(
            user_id=test_user.id,
            action="test_action",
            resource_type="test_resource",
            resource_id="123"
        )
        user_activity = Activity(**activity_data.model_dump())
        db.add(user_activity)
        
        # Create another user and activity
        from datetime import datetime
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        other_user = User(
            email=f"otheruser-{unique_id}@example.com",
            hashed_password="fakehash",
            name="Other User",
            is_active=True,
            is_verified=True,
            is_superuser=False,
            updated_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)
        
        # Activity for other_user
        other_activity_data = ActivityCreate(
            user_id=other_user.id,
            action="other_action",
            resource_type="other_resource",
            resource_id="456"
        )
        other_activity = Activity(**other_activity_data.model_dump())
        db.add(other_activity)
        db.commit()
        
        # Test that non-superuser only sees their own activities
        response = client.get("/api/v1/activities/")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only see activities for test_user
        for activity in data:
            assert activity["user_id"] == test_user.id
            assert activity["action"] == "test_action"
        
        # Should not see activities for other_user
        other_user_activities = [a for a in data if a["user_id"] == other_user.id]
        assert len(other_user_activities) == 0 