import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException
from app.services.payment_service import PaymentService
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
import stripe

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def mock_user():
    user = Mock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.first_name = "Test"
    user.last_name = "User"
    user.stripe_customer_id = None
    return user

@pytest.fixture
def payment_service(mock_db):
    return PaymentService(mock_db)

@pytest.fixture
def sample_subscription():
    sub = Mock(spec=Subscription)
    sub.id = 1
    sub.user_id = 1
    sub.stripe_subscription_id = "sub_123"
    sub.status = SubscriptionStatus.ACTIVE
    sub.plan_id = "price_plus"
    sub.ai_model = "gpt-4"
    sub.token_limit = 10000
    return sub

@pytest.mark.asyncio
async def test_create_customer_success(payment_service, mock_user):
    with patch("stripe.Customer.create", return_value=MagicMock(id="cus_123")) as mock_create:
        customer_id = await payment_service.create_customer(mock_user)
        assert customer_id == "cus_123"
        mock_create.assert_called_once()

@pytest.mark.asyncio
async def test_create_customer_stripe_error(payment_service, mock_user):
    with patch("stripe.Customer.create", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.create_customer(mock_user)

@pytest.mark.asyncio
async def test_create_subscription_success(payment_service, mock_user):
    mock_user.stripe_customer_id = None
    with patch("stripe.Customer.create", return_value=MagicMock(id="cus_123")), \
         patch("stripe.PaymentMethod.attach"), \
         patch("stripe.Customer.modify"), \
         patch("stripe.Subscription.create", return_value=MagicMock(id="sub_123", status="active")), \
         patch.object(payment_service.db, "add"), \
         patch.object(payment_service.db, "commit"), \
         patch.object(payment_service.db, "refresh"):
        result = await payment_service.create_subscription(mock_user, "price_plus", "pm_123")
        assert result.id == "sub_123"

@pytest.mark.asyncio
async def test_create_subscription_stripe_error(payment_service, mock_user):
    with patch("stripe.Customer.create", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.create_subscription(mock_user, "price_plus", "pm_123")

@pytest.mark.asyncio
async def test_cancel_subscription_success(payment_service, mock_user, sample_subscription):
    payment_service.db.query.return_value.filter.return_value.first.return_value = sample_subscription
    with patch("stripe.Subscription.modify", return_value=MagicMock()), \
         patch.object(payment_service.db, "commit"):
        result = await payment_service.cancel_subscription(mock_user)
        assert "will be canceled" in result["message"]

@pytest.mark.asyncio
async def test_cancel_subscription_not_found(payment_service, mock_user):
    payment_service.db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        await payment_service.cancel_subscription(mock_user)
    assert exc_info.value.status_code == 404

@pytest.mark.asyncio
async def test_cancel_subscription_stripe_error(payment_service, mock_user, sample_subscription):
    payment_service.db.query.return_value.filter.return_value.first.return_value = sample_subscription
    with patch("stripe.Subscription.modify", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.cancel_subscription(mock_user)

@pytest.mark.asyncio
async def test_get_current_plan_free(payment_service, mock_user):
    payment_service.db.query.return_value.filter.return_value.first.return_value = None
    plan = await payment_service.get_current_plan(mock_user)
    assert plan["id"] == "free"

@pytest.mark.asyncio
async def test_get_current_plan_paid(payment_service, mock_user, sample_subscription):
    payment_service.db.query.return_value.filter.return_value.first.return_value = sample_subscription
    plan = await payment_service.get_current_plan(mock_user)
    assert plan["id"] == "plus"

@pytest.mark.asyncio
async def test_get_current_subscription_success(payment_service, mock_user, sample_subscription):
    payment_service.db.query.return_value.filter.return_value.first.return_value = sample_subscription
    with patch("stripe.Subscription.retrieve", return_value=MagicMock(current_period_end=123, cancel_at_period_end=False)):
        result = await payment_service.get_current_subscription(mock_user)
        assert result["id"] == sample_subscription.id
        assert result["plan_id"] == sample_subscription.plan_id

@pytest.mark.asyncio
async def test_get_current_subscription_not_found(payment_service, mock_user):
    payment_service.db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException):
        await payment_service.get_current_subscription(mock_user)

@pytest.mark.asyncio
async def test_create_payment_method_success(payment_service, mock_user):
    mock_user.stripe_customer_id = "cus_123"
    mock_pm = MagicMock()
    mock_pm.id = "pm_123"
    mock_pm.type = "card"
    mock_pm.card.brand = "visa"
    mock_pm.card.last4 = "4242"
    mock_pm.card.exp_month = 12
    mock_pm.card.exp_year = 2030
    with patch("stripe.PaymentMethod.create", return_value=mock_pm), \
         patch.object(mock_pm, "attach"):
        data = {
            "card_number": "4242424242424242",
            "expiry_date": "12/30",
            "cvc": "123",
            "name": "Test User"
        }
        result = await payment_service.create_payment_method(mock_user, data)
        assert result["id"] == "pm_123"
        assert result["card"]["brand"] == "visa"

@pytest.mark.asyncio
async def test_create_payment_method_stripe_error(payment_service, mock_user):
    data = {
        "card_number": "4242424242424242",
        "expiry_date": "12/30",
        "cvc": "123",
        "name": "Test User"
    }
    with patch("stripe.PaymentMethod.create", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.create_payment_method(mock_user, data)

@pytest.mark.asyncio
async def test_get_payment_methods_success(payment_service, mock_user):
    mock_user.stripe_customer_id = "cus_123"
    mock_pm = MagicMock()
    mock_pm.id = "pm_123"
    mock_pm.type = "card"
    mock_pm.card.brand = "visa"
    mock_pm.card.last4 = "4242"
    mock_pm.card.exp_month = 12
    mock_pm.card.exp_year = 2030
    mock_list = MagicMock()
    mock_list.data = [mock_pm]
    with patch("stripe.PaymentMethod.list", return_value=mock_list):
        result = await payment_service.get_payment_methods(mock_user)
        assert result[0]["id"] == "pm_123"

@pytest.mark.asyncio
async def test_get_payment_methods_no_customer(payment_service, mock_user):
    mock_user.stripe_customer_id = None
    result = await payment_service.get_payment_methods(mock_user)
    assert result == []

@pytest.mark.asyncio
async def test_get_payment_methods_stripe_error(payment_service, mock_user):
    mock_user.stripe_customer_id = "cus_123"
    with patch("stripe.PaymentMethod.list", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.get_payment_methods(mock_user)

@pytest.mark.asyncio
async def test_update_payment_method_success(payment_service, mock_user):
    mock_pm = MagicMock()
    mock_pm.id = "pm_123"
    mock_pm.type = "card"
    mock_pm.card.brand = "visa"
    mock_pm.card.last4 = "4242"
    mock_pm.card.exp_month = 12
    mock_pm.card.exp_year = 2030
    with patch("stripe.PaymentMethod.modify", return_value=mock_pm):
        data = {"name": "Test User"}
        result = await payment_service.update_payment_method(mock_user, "pm_123", data)
        assert result["id"] == "pm_123"

@pytest.mark.asyncio
async def test_update_payment_method_stripe_error(payment_service, mock_user):
    data = {"name": "Test User"}
    with patch("stripe.PaymentMethod.modify", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.update_payment_method(mock_user, "pm_123", data)

@pytest.mark.asyncio
async def test_delete_payment_method_success(payment_service, mock_user):
    with patch("stripe.PaymentMethod.detach", return_value=MagicMock()):
        result = await payment_service.delete_payment_method(mock_user, "pm_123")
        assert result["message"] == "Payment method deleted successfully"

@pytest.mark.asyncio
async def test_delete_payment_method_stripe_error(payment_service, mock_user):
    with patch("stripe.PaymentMethod.detach", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.delete_payment_method(mock_user, "pm_123")

@pytest.mark.asyncio
async def test_get_invoices_success(payment_service, mock_user):
    mock_user.stripe_customer_id = "cus_123"
    mock_invoice = MagicMock()
    mock_invoice.id = "inv_123"
    mock_invoice.amount_paid = 1000
    mock_invoice.currency = "usd"
    mock_invoice.status = "paid"
    mock_invoice.created = 1234567890
    mock_invoice.period_start = 1234567890
    mock_invoice.period_end = 1234567890
    mock_invoice.invoice_pdf = "https://example.com/invoice.pdf"
    mock_invoice.hosted_invoice_url = "https://example.com/invoice"
    mock_list = MagicMock()
    mock_list.data = [mock_invoice]
    with patch("stripe.Invoice.list", return_value=mock_list):
        result = await payment_service.get_invoices(mock_user)
        assert result[0]["id"] == "inv_123"

@pytest.mark.asyncio
async def test_get_invoices_no_customer(payment_service, mock_user):
    mock_user.stripe_customer_id = None
    result = await payment_service.get_invoices(mock_user)
    assert result == []

@pytest.mark.asyncio
async def test_get_invoices_stripe_error(payment_service, mock_user):
    mock_user.stripe_customer_id = "cus_123"
    with patch("stripe.Invoice.list", side_effect=stripe.error.StripeError("Stripe error")):
        with pytest.raises(HTTPException):
            await payment_service.get_invoices(mock_user)

@pytest.mark.asyncio
async def test_handle_webhook_success(payment_service):
    mock_event = {"type": "invoice.payment_succeeded", "data": {"object": {"subscription": "sub_123"}}}
    with patch("stripe.Webhook.construct_event", return_value=mock_event), \
         patch.object(payment_service.db, "query"), \
         patch.object(payment_service.db, "commit"):
        result = await payment_service.handle_webhook(b"{}", "sig")
        assert result["status"] == "success"

@pytest.mark.asyncio
async def test_handle_webhook_invalid_payload(payment_service):
    with patch("stripe.Webhook.construct_event", side_effect=ValueError("Invalid payload")):
        with pytest.raises(HTTPException):
            await payment_service.handle_webhook(b"{}", "sig")

@pytest.mark.asyncio
async def test_handle_webhook_invalid_signature(payment_service):
    with patch("stripe.Webhook.construct_event", side_effect=stripe.error.SignatureVerificationError("bad sig", "sig_header")):
        with pytest.raises(HTTPException):
            await payment_service.handle_webhook(b"{}", "sig")

@pytest.mark.asyncio
async def test_handle_webhook_subscription_update(payment_service):
    mock_event = {"type": "customer.subscription.updated", "data": {"object": {"id": "sub_123", "status": "active"}}}
    with patch("stripe.Webhook.construct_event", return_value=mock_event), \
         patch.object(payment_service.db, "query"), \
         patch.object(payment_service.db, "commit"):
        result = await payment_service.handle_webhook(b"{}", "sig")
        assert result["status"] == "success"

@pytest.mark.asyncio
async def test_handle_webhook_unhandled_event(payment_service):
    mock_event = {"type": "unknown.event", "data": {"object": {}}}
    with patch("stripe.Webhook.construct_event", return_value=mock_event):
        result = await payment_service.handle_webhook(b"{}", "sig")
        assert result["status"] == "success"

# Private methods

def test_handle_payment_succeeded(payment_service, mock_db, sample_subscription):
    mock_invoice = {"subscription": "sub_123"}
    payment_service.db.query.return_value.filter.return_value.first.return_value = sample_subscription
    with patch.object(payment_service.db, "commit"):
        payment_service._handle_payment_succeeded(mock_invoice)

def test_handle_subscription_update(payment_service, mock_db, sample_subscription):
    mock_subscription = {"id": "sub_123", "status": "canceled"}
    payment_service.db.query.return_value.filter.return_value.first.return_value = sample_subscription
    with patch.object(payment_service.db, "commit"):
        payment_service._handle_subscription_update(mock_subscription) 