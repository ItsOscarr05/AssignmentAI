from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Dict, Any
from pydantic import BaseModel
from datetime import datetime
from app.core.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.models.transaction import Transaction
from app.services.payment_service import PaymentService
from app.schemas.payment import CreateSubscriptionRequest, CreateTokenPurchaseRequest, CreatePaymentIntentRequest


router = APIRouter()


@router.post("/create-subscription")
async def create_subscription(
    request: CreateSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new subscription"""
    payment_service = PaymentService(db)
    return await payment_service.create_subscription(
        user=current_user,
        price_id=request.price_id,
        payment_method_id=request.payment_method_id
    )


@router.post("/upgrade-subscription")
async def upgrade_subscription(
    request: CreateSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upgrade an existing subscription to a new plan"""
    payment_service = PaymentService(db)
    return await payment_service.upgrade_subscription(
        user=current_user,
        new_price_id=request.price_id,
        payment_method_id=request.payment_method_id
    )


@router.post("/purchase-tokens")
async def purchase_tokens(
    request: CreateTokenPurchaseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Purchase additional tokens for the user"""
    payment_service = PaymentService(db)
    return await payment_service.purchase_tokens(
        user=current_user,
        token_amount=request.token_amount,
        payment_method_id=request.payment_method_id
    )


@router.post("/create-payment-intent")
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a payment intent for token purchase"""
    payment_service = PaymentService(db)
    return await payment_service.create_payment_intent(
        user=current_user,
        token_amount=request.token_amount,
        amount=request.amount
    )


@router.post("/create-subscription-payment-intent")
async def create_subscription_payment_intent(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a payment intent for subscription"""
    payment_service = PaymentService(db)
    return await payment_service.create_subscription_payment_intent(
        user=current_user,
        price_id=request['price_id'],
        is_upgrade=request.get('is_upgrade', False)
    )


@router.post("/confirm-subscription-payment")
async def confirm_subscription_payment(
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm subscription payment and create subscription (fallback for webhook)"""
    print("=" * 50)
    print("FALLBACK SUBSCRIPTION PAYMENT CONFIRMATION")
    print("=" * 50)
    print(f"Request data: {request}")
    print(f"Current user: {current_user.id} ({current_user.email})")
    
    # Create a mock payment intent object with the current user's ID
    mock_payment_intent = {
        'status': 'succeeded',
        'id': f'pi_fallback_{current_user.id}_{int(datetime.now().timestamp())}',
        'metadata': {
            'user_id': str(current_user.id),
            'price_id': request.get('metadata', {}).get('price_id'),
            'plan_name': request.get('metadata', {}).get('plan_name'),
            'is_upgrade': request.get('metadata', {}).get('is_upgrade', 'false')
        }
    }
    
    print(f"Mock payment intent: {mock_payment_intent}")
    
    try:
        payment_service = PaymentService(db)
        await payment_service.handle_subscription_payment_success(mock_payment_intent)
        print("Subscription created successfully via fallback")
        return {'status': 'success', 'message': 'Subscription created successfully'}
    except Exception as e:
        print(f"Error in fallback subscription creation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create subscription: {str(e)}")


@router.post("/cancel-subscription")
async def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel the current user's subscription and revert to free plan"""
    payment_service = PaymentService(db)
    return await payment_service.cancel_subscription(user=current_user)


@router.post("/test-upgrade-subscription")
async def test_upgrade_subscription(
    request: CreateSubscriptionRequest,
    db: Session = Depends(get_db)
):
    """Test endpoint for upgrading subscription without authentication"""
    try:
        print("=" * 50)
        print("REAL SUBSCRIPTION UPGRADE REQUEST RECEIVED")
        print("=" * 50)
        print(f"Full request object: {request}")
        print(f"Request dict: {request.dict()}")
        print(f"Price ID: '{request.price_id}' (type: {type(request.price_id)})")
        print(f"Payment Method ID: '{request.payment_method_id}' (type: {type(request.payment_method_id)})")
        print("=" * 50)
        
        # Get or create a test user for testing purposes
        from app.models.user import User
        from app.models.subscription import Subscription, SubscriptionStatus
        
        # Get existing test user - DO NOT CREATE NEW ONES
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            raise HTTPException(
                status_code=404, 
                detail="Test user not found. Test users are no longer automatically created."
            )
        
        # Check if test user has an existing subscription
        existing_subscription = db.query(Subscription).filter(
            Subscription.user_id == test_user.id,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELING])
        ).first()
        
        if existing_subscription:
            print(f"Test user has existing subscription: {existing_subscription.id}")
            print(f"Subscription status: {existing_subscription.status}")
            print(f"Plan ID: {existing_subscription.plan_id}")
            print(f"Stripe subscription ID: {existing_subscription.stripe_subscription_id}")
        else:
            print("Test user has no existing subscription (free plan)")
        
        # Use the payment service to handle the upgrade (or create new subscription if from free plan)
        payment_service = PaymentService(db)
        result = await payment_service.upgrade_subscription(
            user=test_user,
            new_price_id=request.price_id,
            payment_method_id=request.payment_method_id
        )
        
        return result
    except Exception as e:
        print(f"Error in test upgrade subscription: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


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
        
        # Get existing test user - DO NOT CREATE NEW ONES
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            raise HTTPException(
                status_code=404, 
                detail="Test user not found. Test users are no longer automatically created."
            )
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


@router.get("/plans")
async def get_plans():
    """Get available subscription plans (public)"""
    # Debug: Log what the settings are resolving to
    print("=== BACKEND PLANS DEBUG ===")
    print(f"settings.STRIPE_PRICE_FREE: {settings.STRIPE_PRICE_FREE}")
    print(f"settings.STRIPE_PRICE_PLUS: {settings.STRIPE_PRICE_PLUS}")
    print(f"settings.STRIPE_PRICE_PRO: {settings.STRIPE_PRICE_PRO}")
    print(f"settings.STRIPE_PRICE_MAX: {settings.STRIPE_PRICE_MAX}")
    print("=== END BACKEND PLANS DEBUG ===")
    
    plans = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "interval": "month",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Basic Templates",
                "5 assignments/day",
                "100,000 tokens/month"
            ],
            "priceId": settings.STRIPE_PRICE_FREE
        },
        {
            "id": "plus",
            "name": "Plus",
            "price": 4.99,
            "interval": "month",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Standard Templates",
                "Style & Tone Analysis",
                "Enhanced Writing Suggestions",
                "25 assignments/day",
                "250,000 tokens/month",
                "Ad-Free Experience"
            ],
            "priceId": settings.STRIPE_PRICE_PLUS
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 9.99,
            "interval": "month",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Advanced Templates",
                "Image Analysis",
                "Code Review Assistant",
                "Citation Management",
                "Custom Writing Tone",
                "100 assignments/day",
                "500,000 tokens/month",
                "Ad-Free Experience"
            ],
            "priceId": settings.STRIPE_PRICE_PRO
        },
        {
            "id": "max",
            "name": "Max",
            "price": 14.99,
            "interval": "month",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Advanced + Custom Templates",
                "Image Analysis",
                "Code Review Assistant",
                "Citation Management",
                "Custom Writing Tone",
                "Performance Insights Dashboard",
                "Unlimited assignments/day",
                "1,000,000 tokens/month",
                "Ad-Free Experience"
            ],
            "priceId": settings.STRIPE_PRICE_MAX
        }
    ]
    return plans


@router.get("/plans/with-status")
async def get_plans_with_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available subscription plans with current plan status for authenticated users"""
    # Debug: Log what the settings are resolving to
    print("=== BACKEND PLANS WITH STATUS DEBUG ===")
    print(f"settings.STRIPE_PRICE_FREE: {settings.STRIPE_PRICE_FREE}")
    print(f"settings.STRIPE_PRICE_PLUS: {settings.STRIPE_PRICE_PLUS}")
    print(f"settings.STRIPE_PRICE_PRO: {settings.STRIPE_PRICE_PRO}")
    print(f"settings.STRIPE_PRICE_MAX: {settings.STRIPE_PRICE_MAX}")
    print("=== END BACKEND PLANS WITH STATUS DEBUG ===")
    
    # Get current user's subscription to determine which plan is active
    payment_service = PaymentService(db)
    current_subscription = await payment_service.get_current_subscription(current_user)
    current_plan_id = current_subscription.get("plan_id") if current_subscription else settings.STRIPE_PRICE_FREE
    
    plans = [
        {
            "id": "free",
            "name": "Free",
            "price": 0,
            "interval": "month",
            "color": "#2196f3",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Basic Templates",
                "5 assignments/day",
                "100,000 tokens/month"
            ],
            "priceId": settings.STRIPE_PRICE_FREE,
            "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_FREE,
            "status": "current" if current_plan_id == settings.STRIPE_PRICE_FREE else "available"
        },
        {
            "id": "plus",
            "name": "Plus",
            "price": 4.99,
            "interval": "month",
            "color": "#4caf50",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Standard Templates",
                "Style & Tone Analysis",
                "Enhanced Writing Suggestions",
                "25 assignments/day",
                "250,000 tokens/month",
                "Ad-Free Experience"
            ],
            "priceId": settings.STRIPE_PRICE_PLUS,
            "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_PLUS,
            "status": "current" if current_plan_id == settings.STRIPE_PRICE_PLUS else "available"
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 9.99,
            "interval": "month",
            "color": "#9c27b0",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Advanced Templates",
                "Image Analysis",
                "Code Review Assistant",
                "Citation Management",
                "Custom Writing Tone",
                "100 assignments/day",
                "500,000 tokens/month",
                "Ad-Free Experience"
            ],
            "priceId": settings.STRIPE_PRICE_PRO,
            "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_PRO,
            "status": "current" if current_plan_id == settings.STRIPE_PRICE_PRO else "available"
        },
        {
            "id": "max",
            "name": "Max",
            "price": 14.99,
            "interval": "month",
            "color": "#ff9800",
            "features": [
                "AssignmentAI Core Assistant",
                "Grammar & Spelling Check",
                "Writing Suggestions",
                "Advanced + Custom Templates",
                "Image Analysis",
                "Code Review Assistant",
                "Citation Management",
                "Custom Writing Tone",
                "Performance Insights Dashboard",
                "Unlimited assignments/day",
                "1,000,000 tokens/month",
                "Ad-Free Experience"
            ],
            "priceId": settings.STRIPE_PRICE_MAX,
            "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_MAX,
            "status": "current" if current_plan_id == settings.STRIPE_PRICE_MAX else "available"
        }
    ]
    return plans


@router.get("/plans/with-status/test")
async def get_plans_with_status_test(
    db: Session = Depends(get_db)
):
    """Get available subscription plans with current plan status for test user (no authentication)"""
    try:
        # Get or create a test user for testing purposes
        from app.models.user import User
        
        # Get existing test user - DO NOT CREATE NEW ONES
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            raise HTTPException(
                status_code=404, 
                detail="Test user not found. Test users are no longer automatically created."
            )
        
        # Get current user's subscription to determine which plan is active
        payment_service = PaymentService(db)
        current_subscription = await payment_service.get_current_subscription(test_user)
        current_plan_id = current_subscription.get("plan_id") if current_subscription else settings.STRIPE_PRICE_FREE
        
        print(f"Test user current plan ID: {current_plan_id}")
        print(f"Current subscription data: {current_subscription}")
        
        # If we got a free plan but the user should have Plus, force the correct plan
        if current_plan_id == settings.STRIPE_PRICE_FREE and test_user.id == 1:
            # Check if there's actually a Plus subscription in the database
            from app.models.subscription import Subscription, SubscriptionStatus
            plus_subscription = db.query(Subscription).filter(
                Subscription.user_id == test_user.id,
                Subscription.plan_id == settings.STRIPE_PRICE_PLUS,
                Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELING])
            ).first()
            
            if plus_subscription:
                print(f"Found Plus subscription in database: {plus_subscription.id}")
                current_plan_id = settings.STRIPE_PRICE_PLUS
                print(f"Corrected current plan ID to: {current_plan_id}")
        
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
                "priceId": settings.STRIPE_PRICE_FREE,
                "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_FREE,
                "status": "current" if current_plan_id == settings.STRIPE_PRICE_FREE else "available"
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
                "priceId": settings.STRIPE_PRICE_PLUS,
                "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_PLUS,
                "status": "current" if current_plan_id == settings.STRIPE_PRICE_PLUS else "available"
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
                "priceId": settings.STRIPE_PRICE_PRO,
                "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_PRO,
                "status": "current" if current_plan_id == settings.STRIPE_PRICE_PRO else "available"
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
                "priceId": settings.STRIPE_PRICE_MAX,
                "isCurrentPlan": current_plan_id == settings.STRIPE_PRICE_MAX,
                "status": "current" if current_plan_id == settings.STRIPE_PRICE_MAX else "available"
            }
        ]
        
        print(f"Returning plans with status. Current plan: {current_plan_id}")
        for plan in plans:
            print(f"  {plan['name']}: isCurrentPlan={plan['isCurrentPlan']}, status={plan['status']}")
        
        return plans
    except Exception as e:
        print(f"Error in test plans with status endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


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
        
        # Get existing test user - DO NOT CREATE NEW ONES
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            raise HTTPException(
                status_code=404, 
                detail="Test user not found. Test users are no longer automatically created."
            )
        
        # Use the real payment service to get the subscription (this will auto-create free plan if none exists)
        payment_service = PaymentService(db)
        result = await payment_service.get_current_subscription(test_user)
        
        # Debug: Print the actual result from the database
        print(f"DEBUG: Raw subscription result from database: {result}")
        
        # Ensure all required fields are present with defaults if missing
        if result.get("plan_id") is None:
            result["plan_id"] = settings.STRIPE_PRICE_FREE
        if result.get("ai_model") is None:
            result["ai_model"] = "gpt-5-nano"
        if result.get("token_limit") is None:
            result["token_limit"] = 100000
        
        # Debug: Print the final result being returned
        print(f"DEBUG: Final subscription result being returned: {result}")
        
        return result
    except Exception as e:
        print(f"Error in test subscription endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


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


@router.get("/transactions")
async def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's transaction history"""
    print(f"🔍 TRANSACTIONS: Endpoint called for user {current_user.email} (ID: {current_user.id})")
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.created_at.desc()).limit(50).all()
    
    print(f"🔍 TRANSACTIONS: Found {len(transactions)} transactions for user {current_user.email}")
    
    result = [
        {
            "id": transaction.id,
            "type": transaction.transaction_type,
            "amount": transaction.amount,
            "currency": transaction.currency,
            "description": transaction.description,
            "created_at": transaction.created_at.isoformat(),
            "metadata": transaction.transaction_metadata
        }
        for transaction in transactions
    ]
    
    print(f"🔍 TRANSACTIONS: Returning {len(result)} transactions: {[t['description'] for t in result]}")
    
    return result


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
