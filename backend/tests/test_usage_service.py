import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.services.usage_service import UsageService
from app.models.usage import Usage, UsageLimit
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from fastapi import HTTPException
from datetime import datetime, timedelta

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_user():
    user = MagicMock(spec=User)
    user.id = 1
    return user

@pytest.fixture
def usage_service(mock_db):
    return UsageService(mock_db)

@pytest.fixture
def mock_usage():
    usage = MagicMock(spec=Usage)
    usage.id = 1
    usage.user_id = 1
    usage.feature = "ai"
    usage.action = "generate"
    usage.timestamp = datetime.utcnow()
    usage.metadata = {"foo": "bar"}
    return usage

@pytest.fixture
def mock_limit():
    limit = MagicMock(spec=UsageLimit)
    limit.limit_type = "daily"
    limit.limit_value = 5
    limit.feature = "ai"
    limit.plan_id = "free"
    return limit

@pytest.fixture
def mock_subscription():
    sub = MagicMock(spec=Subscription)
    sub.user_id = 1
    sub.status = SubscriptionStatus.ACTIVE
    sub.plan_id = "pro"
    return sub

@pytest.mark.asyncio
async def test_track_usage_success(usage_service, mock_db, mock_user, mock_usage):
    with patch.object(usage_service, '_check_usage_limits', AsyncMock()):
        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()
        mock_db.refresh.side_effect = lambda usage: setattr(usage, 'id', 42)
        # Patch Usage in the correct module
        with patch('app.services.usage_service.Usage', return_value=mock_usage):
            result = await usage_service.track_usage(mock_user, "ai", "generate", {"foo": "bar"})
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()
            assert result == mock_usage

@pytest.mark.asyncio
async def test_track_usage_limit_exceeded(usage_service, mock_user):
    with patch.object(usage_service, '_check_usage_limits', AsyncMock(side_effect=HTTPException(status_code=403, detail="limit exceeded"))):
        with pytest.raises(HTTPException) as exc:
            await usage_service.track_usage(mock_user, "ai", "generate")
        assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_get_usage_all_filters(usage_service, mock_db, mock_user, mock_usage):
    mock_query = MagicMock()
    mock_db.query.return_value.filter.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.order_by.return_value.all.return_value = [mock_usage]
    result = await usage_service.get_usage(mock_user, feature="ai", start_date=datetime.utcnow()-timedelta(days=1), end_date=datetime.utcnow())
    assert result == [mock_usage]

@pytest.mark.asyncio
async def test_get_usage_no_filters(usage_service, mock_db, mock_user, mock_usage):
    mock_query = MagicMock()
    mock_db.query.return_value.filter.return_value = mock_query
    mock_query.order_by.return_value.all.return_value = [mock_usage]
    result = await usage_service.get_usage(mock_user)
    assert result == [mock_usage]

@pytest.mark.asyncio
async def test_get_usage_summary_daily(usage_service, mock_db, mock_user):
    mock_query = MagicMock()
    mock_db.query.return_value.filter.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.group_by.return_value.with_entities.return_value.all.return_value = [("ai", 3)]
    result = await usage_service.get_usage_summary(mock_user, feature="ai", period="daily")
    assert result == {"ai": 3}

@pytest.mark.asyncio
async def test_get_usage_summary_weekly(usage_service, mock_db, mock_user):
    mock_query = MagicMock()
    mock_db.query.return_value.filter.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.group_by.return_value.with_entities.return_value.all.return_value = [("ai", 7)]
    result = await usage_service.get_usage_summary(mock_user, feature="ai", period="weekly")
    assert result == {"ai": 7}

@pytest.mark.asyncio
async def test_get_usage_summary_monthly(usage_service, mock_db, mock_user):
    mock_query = MagicMock()
    mock_db.query.return_value.filter.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.group_by.return_value.with_entities.return_value.all.return_value = [("ai", 30)]
    result = await usage_service.get_usage_summary(mock_user, feature="ai", period="monthly")
    assert result == {"ai": 30}

@pytest.mark.asyncio
async def test_check_usage_limits_free_tier_not_exceeded(usage_service, mock_db, mock_user, mock_limit):
    # No active subscription, free tier
    mock_db.query().filter().first.return_value = None
    mock_db.query().filter().all.return_value = [mock_limit]
    mock_db.query().filter().count.return_value = 2
    await usage_service._check_usage_limits(mock_user, "ai")  # Should not raise

@pytest.mark.asyncio
async def test_check_usage_limits_exceeded(usage_service, mock_db, mock_user, mock_limit):
    mock_db.query().filter().first.return_value = None
    mock_db.query().filter().all.return_value = [mock_limit]
    mock_db.query().filter().count.return_value = 5
    with pytest.raises(HTTPException) as exc:
        await usage_service._check_usage_limits(mock_user, "ai")
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_check_usage_limits_with_subscription(usage_service, mock_db, mock_user, mock_limit, mock_subscription):
    mock_db.query().filter().first.return_value = mock_subscription
    mock_db.query().filter().all.return_value = [mock_limit]
    mock_db.query().filter().count.return_value = 1
    await usage_service._check_usage_limits(mock_user, "ai")  # Should not raise

@pytest.mark.asyncio
async def test_get_usage_limits_free_tier(usage_service, mock_db, mock_user, mock_limit):
    mock_db.query().filter().first.return_value = None
    # Patch .all() at the end of the filter chain
    mock_all = MagicMock(return_value=[mock_limit])
    mock_db.query().filter().filter().all = mock_all
    result = await usage_service.get_usage_limits(mock_user, feature="ai")
    assert result == [mock_limit]

@pytest.mark.asyncio
async def test_get_usage_limits_with_subscription(usage_service, mock_db, mock_user, mock_limit, mock_subscription):
    mock_db.query().filter().first.return_value = mock_subscription
    mock_all = MagicMock(return_value=[mock_limit])
    mock_db.query().filter().filter().all = mock_all
    result = await usage_service.get_usage_limits(mock_user, feature="ai")
    assert result == [mock_limit]

@pytest.mark.asyncio
async def test_get_usage_limits_empty(usage_service, mock_db, mock_user):
    # Patch subscription to None and query.all to return []
    mock_db.query().filter().first.return_value = None
    # Patch the specific filter chain that returns the limits
    mock_all = MagicMock(return_value=[])
    mock_db.query().filter().filter().all = mock_all
    result = await usage_service.get_usage_limits(mock_user, feature="ai")
    assert result == []

@pytest.mark.asyncio
async def test_check_usage_limits_total_limit_type(usage_service, mock_db, mock_user, mock_limit):
    """Test usage limits with 'total' limit type"""
    # Mock subscription to None (free tier)
    mock_db.query().filter().first.return_value = None
    # Mock limit with 'total' type
    mock_limit.limit_type = "total"
    mock_db.query().filter().all.return_value = [mock_limit]
    # Mock usage count
    mock_db.query().filter().count.return_value = 2
    
    # Should not raise exception since usage (2) < limit (5)
    await usage_service._check_usage_limits(mock_user, "ai")

@pytest.mark.asyncio
async def test_check_usage_limits_exceeded_total_limit(usage_service, mock_db, mock_user, mock_limit):
    """Test usage limits exceeded with 'total' limit type"""
    # Mock subscription to None (free tier)
    mock_db.query().filter().first.return_value = None
    # Mock limit with 'total' type
    mock_limit.limit_type = "total"
    mock_limit.limit_value = 5
    mock_db.query().filter().all.return_value = [mock_limit]
    # Mock usage count exceeding limit
    mock_db.query().filter().count.return_value = 6
    
    # Should raise exception since usage (6) >= limit (5)
    with pytest.raises(HTTPException) as exc_info:
        await usage_service._check_usage_limits(mock_user, "ai")
    assert exc_info.value.status_code == 403
    assert "Usage limit exceeded for ai" in exc_info.value.detail 