import stripe
from typing import Optional, Dict, Any, List
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
                    'model': 'gpt-4.1-nano',  # GPT-4.1 Nano (30K tokens)
                    'token_limit': 30000
                },
                'price_plus': {
                    'model': 'gpt-3.5-turbo',  # GPT-3.5 Turbo (50K tokens)
                    'token_limit': 50000
                },
                'price_pro': {
                    'model': 'gpt-4-turbo',  # GPT-4 Turbo (75K tokens)
                    'token_limit': 75000
                },
                'price_max': {
                    'model': 'gpt-4',  # Standard GPT-4 (100K tokens)
                    'token_limit': 100000
                }
            }

            plan_config = model_mapping.get(price_id, {
                'model': 'gpt-4.1-nano',  # Default fallback to free plan model
                'token_limit': 30000
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

    async def get_current_plan(self, user: User) -> Dict[str, Any]:
        """Get current user's plan"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELING])
        ).first()

        if not subscription:
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

        # Map plan_id to plan details
        plan_mapping = {
            'price_free': {
                "id": "free",
                "name": "Free",
                "price": 0,
                "interval": "month"
            },
            'price_plus': {
                "id": "plus",
                "name": "Plus",
                "price": 4.99,
                "interval": "month"
            },
            'price_pro': {
                "id": "pro",
                "name": "Pro",
                "price": 9.99,
                "interval": "month"
            },
            'price_max': {
                "id": "max",
                "name": "Max",
                "price": 14.99,
                "interval": "month"
            }
        }

        return plan_mapping.get(subscription.plan_id, plan_mapping['price_free'])

    async def get_current_subscription(self, user: User) -> Dict[str, Any]:
        """Get current user's subscription"""
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELING])
        ).first()

        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        # Get subscription details from Stripe
        stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)

        return {
            "id": subscription.id,
            "status": subscription.status.value,
            "plan_id": subscription.plan_id,
            "current_period_end": stripe_sub.current_period_end,
            "cancel_at_period_end": stripe_sub.cancel_at_period_end,
            "ai_model": subscription.ai_model,
            "token_limit": subscription.token_limit
        }

    async def create_payment_method(self, user: User, payment_method_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new payment method"""
        try:
            payment_method = stripe.PaymentMethod.create(
                type="card",
                card={
                    "number": payment_method_data["card_number"],
                    "exp_month": int(payment_method_data["expiry_date"].split("/")[0]),
                    "exp_year": int("20" + payment_method_data["expiry_date"].split("/")[1]),
                    "cvc": payment_method_data["cvc"],
                },
                billing_details={
                    "name": payment_method_data["name"],
                    "email": user.email,
                },
            )

            # Attach to customer
            if user.stripe_customer_id:
                payment_method.attach(customer=user.stripe_customer_id)

            return {
                "id": payment_method.id,
                "type": payment_method.type,
                "card": {
                    "brand": payment_method.card.brand,
                    "last4": payment_method.card.last4,
                    "exp_month": payment_method.card.exp_month,
                    "exp_year": payment_method.card.exp_year,
                }
            }

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def get_payment_methods(self, user: User) -> List[Dict[str, Any]]:
        """Get user's payment methods"""
        if not user.stripe_customer_id:
            return []

        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=user.stripe_customer_id,
                type="card"
            )

            return [
                {
                    "id": pm.id,
                    "type": pm.type,
                    "card": {
                        "brand": pm.card.brand,
                        "last4": pm.card.last4,
                        "exp_month": pm.card.exp_month,
                        "exp_year": pm.card.exp_year,
                    }
                }
                for pm in payment_methods.data
            ]

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def update_payment_method(self, user: User, payment_method_id: str, payment_method_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a payment method"""
        try:
            payment_method = stripe.PaymentMethod.modify(
                payment_method_id,
                billing_details={
                    "name": payment_method_data["name"],
                    "email": user.email,
                },
            )

            return {
                "id": payment_method.id,
                "type": payment_method.type,
                "card": {
                    "brand": payment_method.card.brand,
                    "last4": payment_method.card.last4,
                    "exp_month": payment_method.card.exp_month,
                    "exp_year": payment_method.card.exp_year,
                }
            }

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def delete_payment_method(self, user: User, payment_method_id: str) -> Dict[str, Any]:
        """Delete a payment method"""
        try:
            stripe.PaymentMethod.detach(payment_method_id)
            return {"message": "Payment method deleted successfully"}

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def get_invoices(self, user: User) -> List[Dict[str, Any]]:
        """Get user's invoices"""
        if not user.stripe_customer_id:
            return []

        try:
            invoices = stripe.Invoice.list(customer=user.stripe_customer_id)

            return [
                {
                    "id": invoice.id,
                    "amount_paid": invoice.amount_paid,
                    "currency": invoice.currency,
                    "status": invoice.status,
                    "created": invoice.created,
                    "period_start": invoice.period_start,
                    "period_end": invoice.period_end,
                    "pdf": invoice.invoice_pdf,
                    "hosted_invoice_url": invoice.hosted_invoice_url,
                }
                for invoice in invoices.data
            ]

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

            elif event.type == "invoice.payment_succeeded":
                invoice = event.data.object
                if invoice.subscription:
                    db_subscription = self.db.query(Subscription).filter(
                        Subscription.stripe_subscription_id == invoice.subscription
                    ).first()

                    if db_subscription:
                        db_subscription.status = SubscriptionStatus.ACTIVE
                        self.db.commit()

            elif event.type == "invoice.payment_failed":
                invoice = event.data.object
                if invoice.subscription:
                    db_subscription = self.db.query(Subscription).filter(
                        Subscription.stripe_subscription_id == invoice.subscription
                    ).first()

                    if db_subscription:
                        db_subscription.status = SubscriptionStatus.PAST_DUE
                        self.db.commit()

            return {"status": "success"}

        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e)) 