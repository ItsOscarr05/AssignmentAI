import pytest
from fastapi import status
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate
from unittest.mock import patch
from unittest.mock import MagicMock

def test_get_notifications_success(client, test_user, test_token):
    """Test successful retrieval of notifications"""
    response = client.get(
        "/api/v1/notifications/",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)

def test_get_unread_count_success(client, test_user, test_token):
    """Test successful retrieval of unread count"""
    response = client.get(
        "/api/v1/notifications/unread/count",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "count" in data
    assert isinstance(data["count"], int)

def test_create_notification_success(client, test_user, test_token):
    """Test successful creation of a notification"""
    notification_data = {
        "user_id": test_user.id,
        "title": "New Notification",
        "message": "New message",
        "type": "info"
    }
    
    response = client.post(
        "/api/v1/notifications/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=notification_data
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == notification_data["title"]
    assert data["message"] == notification_data["message"]

def test_create_notification_unauthorized(client, test_user, test_token):
    """Test creating a notification for another user"""
    notification_data = {
        "user_id": 999,  # Different user
        "title": "New Notification",
        "message": "New message",
        "type": "info"
    }
    
    response = client.post(
        "/api/v1/notifications/",
        headers={"Authorization": f"Bearer {test_token}"},
        json=notification_data
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_get_notification_success(client, test_user, test_token, db):
    """Test successful retrieval of a specific notification"""
    # First create a notification
    from app.crud import notification as notification_crud
    from app.schemas.notification import NotificationCreate
    
    notification_create = NotificationCreate(
        user_id=test_user.id,
        title="Test Notification",
        message="Test message",
        type="info"
    )
    notification = notification_crud.create_notification(db, notification_create)
    
    response = client.get(
        f"/api/v1/notifications/{notification.id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Test Notification"
    assert data["message"] == "Test message"

def test_get_notification_not_found(client, test_user, test_token):
    """Test getting a notification that doesn't exist"""
    response = client.get(
        "/api/v1/notifications/999999",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Notification not found"

def test_get_notification_unauthorized(client, test_user, test_token, db):
    """Test getting a notification that belongs to another user"""
    # Create a notification for a different user
    from app.crud import notification as notification_crud
    from app.schemas.notification import NotificationCreate
    
    notification_create = NotificationCreate(
        user_id=999,  # Different user
        title="Other User Notification",
        message="Other user message",
        type="info"
    )
    notification = notification_crud.create_notification(db, notification_create)
    
    response = client.get(
        f"/api/v1/notifications/{notification.id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Notification not found"

def test_update_notification_success(client, test_user, test_token, db):
    """Test successful update of a notification"""
    # First create a notification
    from app.crud import notification as notification_crud
    from app.schemas.notification import NotificationCreate
    
    notification_create = NotificationCreate(
        user_id=test_user.id,
        title="Original Title",
        message="Original message",
        type="info"
    )
    notification = notification_crud.create_notification(db, notification_create)
    
    update_data = {
        "title": "Updated Title",
        "message": "Updated message"
    }
    
    response = client.patch(
        f"/api/v1/notifications/{notification.id}",
        headers={"Authorization": f"Bearer {test_token}"},
        json=update_data
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["message"] == "Updated message"

def test_delete_notification_success(client, test_user, test_token, db):
    """Test successful deletion of a notification"""
    # First create a notification
    from app.crud import notification as notification_crud
    from app.schemas.notification import NotificationCreate
    
    notification_create = NotificationCreate(
        user_id=test_user.id,
        title="To Delete",
        message="Will be deleted",
        type="info"
    )
    notification = notification_crud.create_notification(db, notification_create)
    
    response = client.delete(
        f"/api/v1/notifications/{notification.id}",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["message"] == "Notification deleted successfully"

def test_delete_notification_failed(client, test_user, test_token, db):
    """Test failed deletion of a notification"""
    # First create a notification
    from app.crud import notification as notification_crud
    from app.schemas.notification import NotificationCreate
    
    notification_create = NotificationCreate(
        user_id=test_user.id,
        title="To Delete",
        message="Will be deleted",
        type="info"
    )
    notification = notification_crud.create_notification(db, notification_create)
    
    # Mock the delete function to return False
    with pytest.MonkeyPatch().context() as m:
        m.setattr(notification_crud, 'delete_notification', lambda db, notification_id: False)
        
        response = client.delete(
            f"/api/v1/notifications/{notification.id}",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

def test_mark_all_as_read_success(client, test_user, test_token, db):
    """Test successful marking all notifications as read"""
    # First create some notifications
    from app.crud import notification as notification_crud
    from app.schemas.notification import NotificationCreate
    
    notification_create1 = NotificationCreate(
        user_id=test_user.id,
        title="Notification 1",
        message="Message 1",
        type="info"
    )
    notification_create2 = NotificationCreate(
        user_id=test_user.id,
        title="Notification 2",
        message="Message 2",
        type="info"
    )
    notification_crud.create_notification(db, notification_create1)
    notification_crud.create_notification(db, notification_create2)
    
    response = client.post(
        "/api/v1/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data
    assert "Marked" in data["message"]

def test_archive_read_notifications_success(client, test_user, test_token, db):
    """Test successful archiving of read notifications"""
    # First create some notifications
    from app.crud import notification as notification_crud
    from app.schemas.notification import NotificationCreate
    
    notification_create1 = NotificationCreate(
        user_id=test_user.id,
        title="Notification 1",
        message="Message 1",
        type="info"
    )
    notification_create2 = NotificationCreate(
        user_id=test_user.id,
        title="Notification 2",
        message="Message 2",
        type="info"
    )
    notification_crud.create_notification(db, notification_create1)
    notification_crud.create_notification(db, notification_create2)
    
    response = client.post(
        "/api/v1/notifications/archive-read",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data
    assert "Archived" in data["message"]

def test_cleanup_notifications_admin_success(client, test_user, test_token, db):
    """Test successful cleanup of notifications by admin"""
    response = client.delete(
        "/api/v1/notifications/cleanup?days=30",
        headers={"Authorization": f"Bearer {test_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data
    assert "Cleaned up" in data["message"]

def test_cleanup_notifications_unauthorized(client):
    """Test cleanup notifications endpoint without authentication returns 401"""
    response = client.delete("/api/v1/notifications/cleanup")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_cleanup_notifications_with_custom_days(client, test_user, test_token, db):
    """Test cleanup of notifications with custom days parameter"""
    with patch('app.api.v1.endpoints.notifications.notification_crud.cleanup_expired_notifications', return_value=5):
        response = client.delete("/api/v1/notifications/cleanup?days=60", headers={"Authorization": f"Bearer {test_token}"})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "Cleaned up 5 notifications" in data["message"]



def test_get_notifications_unauthorized(client):
    """Test getting notifications without authentication"""
    response = client.get("/api/v1/notifications/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_notification_unauthorized_no_token(client):
    """Test creating notification without authentication"""
    notification_data = {
        "user_id": 1,
        "title": "New Notification",
        "message": "New message",
        "type": "info"
    }
    
    response = client.post("/api/v1/notifications/", json=notification_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED 