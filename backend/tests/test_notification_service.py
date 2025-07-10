import pytest
import asyncio
from unittest.mock import patch, MagicMock
from app.services.notification import NotificationService, NotificationType

@pytest.fixture
def notification_service():
    return NotificationService()

@pytest.mark.asyncio
async def test_send_notification_success(notification_service):
    """Test successful notification sending"""
    with patch.object(notification_service, 'logger') as mock_logger:
        result = await notification_service.send_notification(
            user_id=1,
            notification_type=NotificationType.EMAIL,
            title="Test Title",
            message="Test Message",
            data={"key": "value"}
        )
        
        assert result is True
        mock_logger.info.assert_called_once()

@pytest.mark.asyncio
async def test_send_notification_error(notification_service):
    """Test notification sending with error"""
    with patch.object(notification_service, 'logger') as mock_logger:
        mock_logger.info.side_effect = Exception("Logging error")
        
        result = await notification_service.send_notification(
            user_id=1,
            notification_type=NotificationType.EMAIL,
            title="Test Title",
            message="Test Message"
        )
        
        assert result is False
        mock_logger.error.assert_called_once()

@pytest.mark.asyncio
async def test_send_email_notification(notification_service):
    """Test email notification sending"""
    with patch.object(notification_service, 'send_notification') as mock_send:
        mock_send.return_value = True
        
        result = await notification_service.send_email_notification(
            user_id=1,
            subject="Test Subject",
            body="Test Body",
            template="email_template"
        )
        
        assert result is True
        mock_send.assert_called_once_with(
            user_id=1,
            notification_type=NotificationType.EMAIL,
            title="Test Subject",
            message="Test Body",
            data={"template": "email_template"}
        )

@pytest.mark.asyncio
async def test_send_push_notification(notification_service):
    """Test push notification sending"""
    with patch.object(notification_service, 'send_notification') as mock_send:
        mock_send.return_value = True
        
        result = await notification_service.send_push_notification(
            user_id=1,
            title="Push Title",
            body="Push Body",
            data={"action": "open_app"}
        )
        
        assert result is True
        mock_send.assert_called_once_with(
            user_id=1,
            notification_type=NotificationType.PUSH,
            title="Push Title",
            message="Push Body",
            data={"action": "open_app"}
        )

@pytest.mark.asyncio
async def test_send_in_app_notification(notification_service):
    """Test in-app notification sending"""
    with patch.object(notification_service, 'send_notification') as mock_send:
        mock_send.return_value = True
        
        result = await notification_service.send_in_app_notification(
            user_id=1,
            title="In-App Title",
            message="In-App Message",
            data={"type": "alert"}
        )
        
        assert result is True
        mock_send.assert_called_once_with(
            user_id=1,
            notification_type=NotificationType.IN_APP,
            title="In-App Title",
            message="In-App Message",
            data={"type": "alert"}
        )

@pytest.mark.asyncio
async def test_send_notification_all_types(notification_service):
    """Test sending notifications of all types"""
    notification_types = [
        NotificationType.EMAIL,
        NotificationType.PUSH,
        NotificationType.IN_APP,
        NotificationType.SMS
    ]
    
    for notification_type in notification_types:
        with patch.object(notification_service, 'logger') as mock_logger:
            result = await notification_service.send_notification(
                user_id=1,
                notification_type=notification_type,
                title=f"Test {notification_type.value}",
                message=f"Message for {notification_type.value}"
            )
            
            assert result is True
            mock_logger.info.assert_called_once()

@pytest.mark.asyncio
async def test_send_notification_with_data(notification_service):
    """Test sending notification with additional data"""
    test_data = {
        "action": "open_assignment",
        "assignment_id": 123,
        "priority": "high"
    }
    
    with patch.object(notification_service, 'logger') as mock_logger:
        result = await notification_service.send_notification(
            user_id=1,
            notification_type=NotificationType.IN_APP,
            title="Assignment Update",
            message="Your assignment has been graded",
            data=test_data
        )
        
        assert result is True
        mock_logger.info.assert_called_once()

@pytest.mark.asyncio
async def test_send_notification_without_data(notification_service):
    """Test sending notification without additional data"""
    with patch.object(notification_service, 'logger') as mock_logger:
        result = await notification_service.send_notification(
            user_id=1,
            notification_type=NotificationType.EMAIL,
            title="Simple Notification",
            message="This is a simple message"
        )
        
        assert result is True
        mock_logger.info.assert_called_once()

def test_notification_type_enum():
    """Test NotificationType enum values"""
    assert NotificationType.EMAIL.value == "email"
    assert NotificationType.PUSH.value == "push"
    assert NotificationType.IN_APP.value == "in_app"
    assert NotificationType.SMS.value == "sms"

def test_notification_service_initialization():
    """Test NotificationService initialization"""
    service = NotificationService()
    assert service.logger is not None
    assert hasattr(service, 'send_notification')
    assert hasattr(service, 'send_email_notification')
    assert hasattr(service, 'send_push_notification')
    assert hasattr(service, 'send_in_app_notification') 