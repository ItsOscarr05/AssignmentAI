from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.api import deps
from app.services.payment_service import PaymentService
from app.models.user import User
from app.core.config import settings

router = APIRouter()

@router.post("/create-subscription")
async def create_subscription(
    price_id: str,
    payment_method_id: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
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
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Cancel the current subscription"""
    payment_service = PaymentService(db)
    return await payment_service.cancel_subscription(user=current_user)

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(deps.get_db)
):
    """Handle Stripe webhook events"""
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    
    payload = await request.body()
    payment_service = PaymentService(db)
    return await payment_service.handle_webhook(payload, stripe_signature) 