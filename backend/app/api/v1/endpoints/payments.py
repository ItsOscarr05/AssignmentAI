from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.deps import get_current_user, get_db
from app.services.payment_service import PaymentService
from app.models.user import User
from app.core.config import settings

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

@router.get("/subscriptions/current")
async def get_current_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's subscription"""
    payment_service = PaymentService(db)
    return await payment_service.get_current_subscription(current_user)

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
