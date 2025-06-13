import stripe
from typing import Optional, Dict, Any
from fastapi import HTTPException
from app.core.config import settings
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from sqlalchemy.orm import Session

stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    async def create_customer(self, user: User) -> str:
        """Create a Stripe customer for a user"""
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}",
                metadata={"user_id": str(user.id)}
            )
            return customer.id
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def create_subscription(
        self,
        user: User,
        price_id: str,
        payment_method_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a subscription for a user"""
        try:
            # Get or create customer
            if not user.stripe_customer_id:
                customer_id = await self.create_customer(user)
                user.stripe_customer_id = customer_id
                self.db.commit()

            # Attach payment method if provided
            if payment_method_id:
                stripe.PaymentMethod.attach(
                    payment_method_id,
                    customer=user.stripe_customer_id
                )
                # Set as default payment method
                stripe.Customer.modify(
                    user.stripe_customer_id,
                    invoice_settings={
                        "default_payment_method": payment_method_id
                    }
                )

            # Create subscription
            subscription = stripe.Subscription.create(
                customer=user.stripe_customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"]
            )

            # Map price_id to AI model and token limit
            model_mapping = {
                'price_free': {
                    'model': 'gpt-4.1-nano',  # GPT-4.1 Nano model
                    'token_limit': 30000
                },
                'price_plus': {
                    'model': 'gpt-3.5-turbo-0125',  # Latest GPT-3.5 Turbo model
                    'token_limit': 50000
                },
                'price_pro': {
                    'model': 'gpt-4-turbo-preview',  # Latest GPT-4 Turbo model
                    'token_limit': 75000
                },
                'price_max': {
                    'model': 'gpt-4',  # Standard GPT-4 model
                    'token_limit': 100000
                }
            }

            plan_config = model_mapping.get(price_id, {
                'model': 'gpt-4.1-nano',  # Default fallback to free plan model
                'token_limit': 5000
            })

            # Create subscription record in database
            db_subscription = Subscription(
                user_id=user.id,
                stripe_subscription_id=subscription.id,
                status=SubscriptionStatus.PENDING,
                plan_id=price_id,
                ai_model=plan_config['model'],
                token_limit=plan_config['token_limit']
            )
            self.db.add(db_subscription)
            self.db.commit()

            return {
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret
            }

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def cancel_subscription(self, user: User) -> Dict[str, Any]:
        """Cancel a user's subscription"""
        try:
            subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).first()

            if not subscription:
                raise HTTPException(status_code=404, detail="No active subscription found")

            # Cancel at period end
            stripe_sub = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=True
            )

            subscription.status = SubscriptionStatus.CANCELING
            self.db.commit()

            return {"message": "Subscription will be canceled at the end of the billing period"}

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def handle_webhook(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )

            if event.type == "customer.subscription.updated":
                subscription = event.data.object
                db_subscription = self.db.query(Subscription).filter(
                    Subscription.stripe_subscription_id == subscription.id
                ).first()

                if db_subscription:
                    if subscription.status == "active":
                        db_subscription.status = SubscriptionStatus.ACTIVE
                    elif subscription.status == "canceled":
                        db_subscription.status = SubscriptionStatus.CANCELED
                    self.db.commit()

            elif event.type == "customer.subscription.deleted":
                subscription = event.data.object
                db_subscription = self.db.query(Subscription).filter(
                    Subscription.stripe_subscription_id == subscription.id
                ).first()

                if db_subscription:
                    db_subscription.status = SubscriptionStatus.CANCELED
                    self.db.commit()

            return {"status": "success"}

        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e)) 