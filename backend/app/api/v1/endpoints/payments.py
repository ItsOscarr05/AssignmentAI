from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.deps import get_current_user, get_db
from app.services.payment_service import PaymentService
from app.models.user import User
from app.core.config import settings


class CreateSubscriptionRequest(BaseModel):
    price_id: str
    payment_method_id: str


router = APIRouter()


@router.post("/create-subscription")
async def create_subscription(
    price_id: str,
    payment_method_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new subscription"""
    payment_service = PaymentService(db)
    return await payment_service.create_subscription(
        user=current_user,
        price_id=price_id,
        payment_method_id=payment_method_id
    )


@router.post("/test-create-subscription")
async def test_create_subscription(
    request: CreateSubscriptionRequest,
    db: Session = Depends(get_db)
):
    """Test endpoint for creating subscription without authentication"""
    try:
        print("=" * 50)
        print("REAL SUBSCRIPTION REQUEST RECEIVED")
        print("=" * 50)
        print(f"Full request object: {request}")
        print(f"Request dict: {request.dict()}")
        print(f"Price ID: '{request.price_id}' (type: {type(request.price_id)})")
        print(f"Payment Method ID: '{request.payment_method_id}' (type: {type(request.payment_method_id)})")
        print(f"Price ID length: {len(request.price_id) if request.price_id else 0}")
        print(f"Price ID is empty: {request.price_id == ''}")
        print(f"Price ID is None: {request.price_id is None}")
        print("=" * 50)
        
        # Get or create a test user for testing purposes
        from app.models.user import User
        import uuid
        
        # Try to get existing test user, or create a new one with unique email
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            print("Creating new test user...")
            test_user = User(
                email="test@example.com",
                name="Test User",
                hashed_password="dummy_hash_for_testing",
                is_active=True,
                is_verified=False,
                two_factor_enabled=False,
                is_superuser=False,
                failed_login_attempts=0,
                password_history=[],
                sessions=[]
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"New test user created with ID: {test_user.id}")
        else:
            # Clear the existing stripe_customer_id to force creation of a new one
            if test_user.stripe_customer_id:
                test_user.stripe_customer_id = None
                db.commit()
                db.refresh(test_user)
        
        # Use the real payment service to create the subscription
        payment_service = PaymentService(db)
        result = await payment_service.create_subscription(
            user=test_user,
            price_id=request.price_id,
            payment_method_id=request.payment_method_id
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel-subscription")
async def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel the current subscription"""
    payment_service = PaymentService(db)
    return await payment_service.cancel_subscription(user=current_user)


@router.get("/plans")
async def get_plans():
    """Get available subscription plans"""
    plans = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "interval": "month",
            "features": [
                "Basic assignment generation",
                "5 assignments per month",
                "Standard AI model",
                "Email support"
            ],
            "priceId": settings.STRIPE_PRICE_FREE
        },
        {
            "id": "plus",
            "name": "Plus",
            "price": 4.99,
            "interval": "month",
            "features": [
                "Enhanced assignment generation",
                "25 assignments per month",
                "Advanced AI model",
                "Priority support",
                "Export to DOCX"
            ],
            "priceId": settings.STRIPE_PRICE_PLUS
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 9.99,
            "interval": "month",
            "features": [
                "Unlimited assignment generation",
                "Premium AI model",
                "Advanced templates",
                "Citation helper",
                "Priority support",
                "Export to DOCX/PDF"
            ],
            "priceId": settings.STRIPE_PRICE_PRO
        },
        {
            "id": "max",
            "name": "Max",
            "price": 14.99,
            "interval": "month",
            "features": [
                "Everything in Pro",
                "Custom AI models",
                "Advanced analytics",
                "API access",
                "Dedicated support",
                "White-label options"
            ],
            "priceId": settings.STRIPE_PRICE_MAX
        }
    ]
    return plans


@router.get("/plans/current")
async def get_current_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's plan"""
    payment_service = PaymentService(db)
    return await payment_service.get_current_plan(current_user)


@router.get("/plans/current/public")
async def get_current_plan_public(
    db: Session = Depends(get_db)
):
    """Get current user's plan without authentication (for pricing page)"""
    # Return a default response for unauthenticated users
    return {
        "id": "free",
        "name": "Free",
        "price": 0,
        "interval": "month",
        "features": [
            "Basic assignment generation",
            "5 assignments per month",
            "Standard AI model",
            "Email support"
        ]
    }


@router.get("/subscriptions/current")
async def get_current_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's subscription"""
    payment_service = PaymentService(db)
    return await payment_service.get_current_subscription(current_user)


@router.get("/subscriptions/current/test")
async def get_current_subscription_test(
    db: Session = Depends(get_db)
):
    """Get current subscription for test user without authentication"""
    try:
        # Get or create a test user for testing purposes
        from app.models.user import User
        
        # Try to get existing test user, or create a new one with unique email
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            print("Creating new test user for subscription test...")
            test_user = User(
                email="test@example.com",
                name="Test User",
                hashed_password="dummy_hash_for_testing",
                is_active=True,
                is_verified=False,
                two_factor_enabled=False,
                is_superuser=False,
                failed_login_attempts=0,
                password_history=[],
                sessions=[]
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"New test user created with ID: {test_user.id}")
        else:
            pass
        
        # Use the real payment service to get the subscription
        payment_service = PaymentService(db)
        result = await payment_service.get_current_subscription(test_user)
        
        # Ensure all required fields are present with defaults if missing
        if result.get("plan_id") is None:
            result["plan_id"] = "price_test_plus"
        if result.get("ai_model") is None:
            result["ai_model"] = "gpt-4"
        if result.get("token_limit") is None:
            result["token_limit"] = 50000
        
        return result
    except Exception as e:
        # Return a default test subscription response
        return {
            "id": "test_sub_123",
            "status": "active",
            "plan_id": "price_test_plus",
            "current_period_end": "2024-12-31T23:59:59Z",
            "cancel_at_period_end": False,
            "token_limit": 30000
        }


@router.post("/payment-methods")
async def create_payment_method(
    payment_method_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new payment method"""
    payment_service = PaymentService(db)
    return await payment_service.create_payment_method(current_user, payment_method_data)


@router.get("/payment-methods")
async def get_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's payment methods"""
    payment_service = PaymentService(db)
    return await payment_service.get_payment_methods(current_user)


@router.put("/payment-methods/{payment_method_id}")
async def update_payment_method(
    payment_method_id: str,
    payment_method_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a payment method"""
    payment_service = PaymentService(db)
    return await payment_service.update_payment_method(current_user, payment_method_id, payment_method_data)


@router.delete("/payment-methods/{payment_method_id}")
async def delete_payment_method(
    payment_method_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a payment method"""
    payment_service = PaymentService(db)
    return await payment_service.delete_payment_method(current_user, payment_method_id)


@router.get("/invoices")
async def get_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's invoices"""
    payment_service = PaymentService(db)
    return await payment_service.get_invoices(current_user)


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias='Stripe-Signature'),
    db: Session = Depends(get_db)
):
    """Stripe webhook endpoint"""
    payload = await request.body()
    payment_service = PaymentService(db)
    return await payment_service.handle_webhook(payload, stripe_signature)
