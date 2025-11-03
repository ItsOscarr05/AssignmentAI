import stripe
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from datetime import datetime
from app.core.config import settings
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.transaction import Transaction, TransactionType
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
                name=user.name or user.email,  # Use name if available, otherwise use email
                metadata={"user_id": str(user.id)}
            )
            return customer.id
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def create_subscription(
        self, user: User, price_id: str, payment_method_id: str
    ) -> Dict[str, Any]:
        """
        Creates a new subscription for a user.
        - Gets or creates a Stripe customer for the user.
        - Attaches the payment method to the customer.
        - Sets the payment method as the default for the customer.
        - Creates a new subscription in Stripe.
        - Saves the subscription details to the local database.
        """
        try:
            # Step 1: Get or create a Stripe customer
            if not user.stripe_customer_id:
                customer = stripe.Customer.create(email=user.email)
                user.stripe_customer_id = customer.id
                self.db.add(user)
                self.db.commit()
                self.db.refresh(user)

            # Step 2: Attach the payment method to the customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=user.stripe_customer_id,
            )

            # Step 3: Set the payment method as the default for the customer
            stripe.Customer.modify(
                user.stripe_customer_id,
                invoice_settings={'default_payment_method': payment_method_id},
            )

            # Step 4: Create the subscription
            subscription = stripe.Subscription.create(
                customer=user.stripe_customer_id,
                items=[{'price': price_id}],
                expand=['latest_invoice.payment_intent'],
            )

            # Step 5: Determine plan details from price_id
            plan_details = self._get_plan_details_from_price_id(price_id)
            
            # Step 6: Save the subscription to your database
            db_subscription = Subscription(
                user_id=user.id,
                stripe_subscription_id=subscription.id,
                stripe_customer_id=user.stripe_customer_id,
                plan_name=plan_details["name"],
                plan_price=plan_details["price"],
                status=subscription.status,
                current_period_start=datetime.now(),  # Use current time as fallback
                current_period_end=datetime.now(),  # Use current time as fallback
                plan_id=plan_details["plan_id"],
                ai_model=plan_details["ai_model"],
                token_limit=plan_details["token_limit"]
            )
            self.db.add(db_subscription)
            self.db.commit()
            
            # Create transaction record for subscription
            transaction = Transaction(
                user_id=user.id,
                transaction_type=TransactionType.SUBSCRIPTION,
                amount=plan_details["price"],
                currency="USD",
                description=f"Subscription - {plan_details['name']}",
                stripe_subscription_id=subscription.id,
                transaction_metadata=f'{{"plan_name": "{plan_details["name"]}", "plan_id": "{plan_details["plan_id"]}", "token_limit": {plan_details["token_limit"]}}}',
                created_at=datetime.utcnow()
            )
            self.db.add(transaction)
            self.db.commit()

            return subscription

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def upgrade_subscription(
        self, user: User, new_price_id: str, payment_method_id: str
    ) -> Dict[str, Any]:
        """
        Upgrades an existing subscription to a new plan.
        - If user has no subscription (free plan), creates a new subscription
        - If user has an existing subscription, updates it with the new price
        - Updates the local database with new plan details
        """
        try:
            # Step 1: Find the current active subscription
            current_subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELING])
            ).first()

            # Check if this is a free plan user (has subscription but it's the free plan)
            is_free_plan = False
            if current_subscription and current_subscription.plan_id == settings.STRIPE_PRICE_FREE:
                is_free_plan = True
                print(f"User {user.id} is on free plan. Treating as new subscription creation.")

            # If no existing subscription or user is on free plan, create a new subscription
            if not current_subscription or is_free_plan:
                print(f"User {user.id} has no valid subscription or is on free plan. Creating new subscription.")
                # If they had a free plan subscription, remove it first
                if current_subscription and is_free_plan:
                    self.db.delete(current_subscription)
                    self.db.commit()
                    print(f"Removed old free plan subscription for user {user.id}")
                
                # Create a new subscription instead of upgrading
                return await self.create_subscription(user, new_price_id, payment_method_id)

            # Step 2: Get the current subscription from Stripe (only for paid plans)
            try:
                stripe_subscription = stripe.Subscription.retrieve(current_subscription.stripe_subscription_id)
                print(f"Retrieved Stripe subscription: {stripe_subscription.id}")
            except stripe.error.InvalidRequestError as e:
                if "No such subscription" in str(e):
                    print(f"Stripe subscription {current_subscription.stripe_subscription_id} not found. Treating as new subscription.")
                    # Remove the invalid subscription from database
                    self.db.delete(current_subscription)
                    self.db.commit()
                    return await self.create_subscription(user, new_price_id, payment_method_id)
                else:
                    raise e
            
            # Step 3: Get the current subscription items using dictionary access
            subscription_items = stripe_subscription['items']
            print(f"Subscription items: {subscription_items}")
            print(f"Subscription items type: {type(subscription_items)}")
            
            if not subscription_items or not subscription_items.data:
                print(f"Subscription items data: {subscription_items.data if subscription_items else 'None'}")
                raise HTTPException(status_code=400, detail="No subscription items found")
            
            subscription_item_id = subscription_items.data[0].id
            print(f"Found subscription item ID: {subscription_item_id}")

            # Step 4: Update the subscription in Stripe
            updated_subscription = stripe.Subscription.modify(
                current_subscription.stripe_subscription_id,
                items=[{
                    'id': subscription_item_id,
                    'price': new_price_id,
                }],
                proration_behavior='create_prorations',  # Prorate the change
            )

            # Step 5: Get new plan details
            new_plan_details = self._get_plan_details_from_price_id(new_price_id)
            
            # Step 6: Update the local database
            print(f"DEBUG: Updating database with new plan details: {new_plan_details}")
            
            current_subscription.plan_name = new_plan_details["name"]
            current_subscription.plan_price = new_plan_details["price"]
            current_subscription.plan_id = new_plan_details["plan_id"]
            current_subscription.ai_model = new_plan_details["ai_model"]
            current_subscription.token_limit = new_plan_details["token_limit"]
            current_subscription.status = SubscriptionStatus.ACTIVE
            current_subscription.updated_at = datetime.now()
            
            self.db.commit()
            self.db.refresh(current_subscription)
            
            print(f"DEBUG: Database updated. New token_limit: {current_subscription.token_limit}")

            return {
                "message": "Subscription upgraded successfully",
                "subscription": updated_subscription,
                "new_plan": new_plan_details
            }

        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    def _get_plan_details_from_price_id(self, price_id: str) -> Dict[str, Any]:
        """Get plan details from price_id"""
        plan_mapping = {
            settings.STRIPE_PRICE_FREE: {
                "name": "Free", 
                "price": 0.0,
                "plan_id": settings.STRIPE_PRICE_FREE,  # Store actual Stripe price ID
                "ai_model": "gpt-5-nano",
                "token_limit": 100000
            },
            settings.STRIPE_PRICE_PLUS: {
                "name": "Plus", 
                "price": 4.99,
                "plan_id": settings.STRIPE_PRICE_PLUS,  # Store actual Stripe price ID
                "ai_model": "gpt-5-mini",
                "token_limit": 250000
            },
            settings.STRIPE_PRICE_PRO: {
                "name": "Pro", 
                "price": 9.99,
                "plan_id": settings.STRIPE_PRICE_PRO,  # Store actual Stripe price ID
                "ai_model": "gpt-5-mini",
                "token_limit": 500000
            },
            settings.STRIPE_PRICE_MAX: {
                "name": "Max", 
                "price": 14.99,
                "plan_id": settings.STRIPE_PRICE_MAX,  # Store actual Stripe price ID
                "ai_model": "gpt-5",
                "token_limit": 1000000
            },
        }
        
        if price_id in plan_mapping:
            return plan_mapping[price_id]
        else:
            # Default to Pro if price_id not found
            return {
                "name": "Pro", 
                "price": 9.99,
                "plan_id": settings.STRIPE_PRICE_PRO,  # Store actual Stripe price ID
                "ai_model": "gpt-4",
                "token_limit": 500000
            }



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
            settings.STRIPE_PRICE_FREE: {
                "id": "free",
                "name": "Free",
                "price": 0,
                "interval": "month"
            },
            settings.STRIPE_PRICE_PLUS: {
                "id": "plus",
                "name": "Plus",
                "price": 4.99,
                "interval": "month"
            },
            settings.STRIPE_PRICE_PRO: {
                "id": "pro",
                "name": "Pro",
                "price": 9.99,
                "interval": "month"
            },
            settings.STRIPE_PRICE_MAX: {
                "id": "max",
                "name": "Max",
                "price": 14.99,
                "interval": "month"
            }
        }

        return plan_mapping.get(subscription.plan_id, plan_mapping[settings.STRIPE_PRICE_FREE])

    async def cancel_subscription(self, user: User) -> Dict[str, Any]:
        """
        Cancels the user's current subscription and reverts them to the free plan.
        - Cancels the subscription in Stripe
        - Updates the local database to mark subscription as cancelled
        - Returns confirmation message
        """
        try:
            # Get the user's current active subscription
            subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELING])
            ).first()
            
            if not subscription:
                raise HTTPException(
                    status_code=404, 
                    detail="No active subscription found to cancel"
                )
            
            # Cancel the subscription in Stripe if it's a real Stripe subscription
            if (subscription.stripe_subscription_id and 
                not subscription.stripe_subscription_id.startswith('test_') and
                not subscription.stripe_subscription_id.startswith('free_sub_')):
                
                try:
                    stripe_sub = stripe.Subscription.modify(
                        subscription.stripe_subscription_id,
                        cancel_at_period_end=True
                    )
                    print(f"Stripe subscription {subscription.stripe_subscription_id} marked for cancellation")
                except stripe.error.StripeError as e:
                    print(f"Warning: Could not cancel Stripe subscription: {e}")
                    # Continue with local cancellation even if Stripe fails
            
            # Update the subscription status in local database
            subscription.status = SubscriptionStatus.CANCELED
            subscription.canceled_at = datetime.now()
            self.db.commit()
            
            return {
                "message": "Subscription cancelled successfully",
                "subscription_id": subscription.id,
                "plan_name": subscription.plan_name,
                "status": "cancelled"
            }
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def get_current_subscription(self, user: User) -> Dict[str, Any]:
        """Get current user's subscription"""
        print(f"DEBUG: get_current_subscription called for user {user.id} ({user.email})")
        
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELING])
        ).first()

        if subscription:
            print(f"DEBUG: Found subscription in database: ID={subscription.id}, Plan={subscription.plan_id}, Stripe={subscription.stripe_subscription_id}")
        else:
            print(f"DEBUG: No active subscription found for user {user.id}")
            
            # No more test user logic - just create free plan for users without subscription
            
            # For other users, create a free plan subscription
            return await self._create_free_plan_subscription(user)

        # Get subscription details from Stripe (only for paid plans)
        # Skip Stripe validation for test/fake subscription IDs
        if (subscription.stripe_subscription_id and 
            not subscription.stripe_subscription_id.startswith('test_plus_sub_') and
            not subscription.stripe_subscription_id.startswith('free_sub_')):
            
            print(f"DEBUG: Attempting to retrieve Stripe subscription: {subscription.stripe_subscription_id}")
            try:
                stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
                
                # Safely access Stripe subscription fields
                current_period_end = None
                cancel_at_period_end = False
                
                try:
                    if hasattr(stripe_sub, 'current_period_end') and stripe_sub.current_period_end:
                        current_period_end = stripe_sub.current_period_end
                    if hasattr(stripe_sub, 'cancel_at_period_end'):
                        cancel_at_period_end = stripe_sub.cancel_at_period_end
                except Exception as attr_error:
                    print(f"DEBUG: Error accessing Stripe subscription attributes: {attr_error}")
                
                return {
                    "id": subscription.id,
                    "status": subscription.status.value,
                    "plan_id": subscription.plan_id,
                    "current_period_end": current_period_end,
                    "cancel_at_period_end": cancel_at_period_end,
                    "ai_model": subscription.ai_model,
                    "token_limit": subscription.token_limit
                }
            except stripe.error.StripeError as e:
                print(f"Error retrieving Stripe subscription: {e}")
                # If Stripe subscription not found, return local subscription data
                # Don't create a new free plan - just return what we have
                return {
                    "id": subscription.id,
                    "status": subscription.status.value,
                    "plan_id": subscription.plan_id,
                    "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                    "cancel_at_period_end": subscription.cancel_at_period_end,
                    "ai_model": subscription.ai_model,
                    "token_limit": subscription.token_limit
                }
            except Exception as e:
                print(f"Unexpected error in get_current_subscription: {e}")
                # Return local subscription data as fallback
                return {
                    "id": subscription.id,
                    "status": subscription.status.value,
                    "plan_id": subscription.plan_id,
                    "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                    "cancel_at_period_end": subscription.cancel_at_period_end,
                    "ai_model": subscription.ai_model,
                    "token_limit": subscription.token_limit
                }
        else:
            # Free plan subscription - return local data
            return {
                "id": subscription.id,
                "status": subscription.status.value,
                "plan_id": subscription.plan_id,
                "current_period_end": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "ai_model": subscription.ai_model,
                "token_limit": subscription.token_limit
            }

    async def _create_free_plan_subscription(self, user: User) -> Dict[str, Any]:
        """Create a free plan subscription for users without one"""
        try:
            # Check if user already has a free plan subscription
            existing_free = self.db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.plan_id == settings.STRIPE_PRICE_FREE
            ).first()
            
            if existing_free:
                return {
                    "id": existing_free.id,
                    "status": existing_free.status.value,
                    "plan_id": existing_free.plan_id,
                    "current_period_end": existing_free.current_period_end.isoformat() if existing_free.current_period_end else None,
                    "cancel_at_period_end": existing_free.cancel_at_period_end,
                    "ai_model": existing_free.ai_model,
                    "token_limit": existing_free.token_limit
                }

            # Create a new free plan subscription
            from datetime import datetime, timedelta
            import uuid
            
            # Generate a unique fake Stripe subscription ID for free plans
            fake_stripe_id = f"free_sub_{uuid.uuid4().hex[:16]}"
            
            free_subscription = Subscription(
                user_id=user.id,
                stripe_subscription_id=fake_stripe_id,  # Use fake ID to avoid NOT NULL constraint
                stripe_customer_id=user.stripe_customer_id or f"free_customer_{user.id}",
                plan_name="Free",
                plan_price=0.0,
                plan_id=settings.STRIPE_PRICE_FREE,
                ai_model="gpt-5-nano",
                token_limit=100000,
                status=SubscriptionStatus.ACTIVE,
                current_period_start=datetime.now(),
                current_period_end=datetime.now() + timedelta(days=30),
                cancel_at_period_end=False
            )
            
            self.db.add(free_subscription)
            self.db.commit()
            self.db.refresh(free_subscription)
            
            return {
                "id": free_subscription.id,
                "status": free_subscription.status.value,
                "plan_id": free_subscription.plan_id,
                "current_period_end": free_subscription.current_period_end.isoformat(),
                "cancel_at_period_end": free_subscription.cancel_at_period_end,
                "ai_model": free_subscription.ai_model,
                "token_limit": free_subscription.token_limit
            }
            
        except Exception as e:
            print(f"Error creating free plan subscription: {e}")
            # Return a default free plan response
            return {
                "id": None,
                "status": "active",
                "plan_id": settings.STRIPE_PRICE_FREE,
                "current_period_end": (datetime.now() + timedelta(days=30)).isoformat(),
                "cancel_at_period_end": False,
                "ai_model": "gpt-5-nano",
                "token_limit": 100000
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
        except ValueError:
            raise HTTPException(status_code=400, detail='Invalid payload')
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail='Invalid signature')

        # Handle the event
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            # Check if this is a token purchase
            if payment_intent.get('metadata', {}).get('type') == 'token_purchase':
                await self.handle_token_purchase_success(payment_intent['id'])
            elif payment_intent.get('metadata', {}).get('type') == 'subscription':
                # Handle subscription payment intent success
                await self.handle_subscription_payment_success(payment_intent)
            else:
                self._handle_payment_succeeded(payment_intent)
        elif event['type'] == 'invoice.payment_succeeded':
            self._handle_payment_succeeded(event['data']['object'])
        elif event['type'] in (
            'customer.subscription.updated',
            'customer.subscription.deleted',
        ):
            self._handle_subscription_update(event['data']['object'])
        else:
            print(f"Unhandled event type {event['type']}")

        return {'status': 'success'}

    def _handle_payment_succeeded(self, invoice: Dict[str, Any]):
        """Handle successful payment invoices."""
        subscription_id = invoice.get('subscription')
        if subscription_id:
            db_subscription = (
                self.db.query(Subscription)
                .filter(Subscription.stripe_subscription_id == subscription_id)
                .first()
            )
            if db_subscription:
                db_subscription.status = 'active'
                self.db.commit()

    def _handle_subscription_update(self, subscription: Dict[str, Any]):
        """Handle subscription updates and cancellations."""
        db_subscription = (
            self.db.query(Subscription)
            .filter(Subscription.stripe_subscription_id == subscription['id'])
            .first()
        )
        if db_subscription:
            # Update status
            db_subscription.status = subscription['status']
            
            # Update plan details if the subscription items have changed
            if subscription.get('items') and subscription['items'].get('data'):
                subscription_item = subscription['items']['data'][0]
                if subscription_item.get('price') and subscription_item['price'].get('id'):
                    new_price_id = subscription_item['price']['id']
                    new_plan_details = self._get_plan_details_from_price_id(new_price_id)
                    
                    # Update plan details in database
                    db_subscription.plan_name = new_plan_details["name"]
                    db_subscription.plan_price = new_plan_details["price"]
                    db_subscription.plan_id = new_plan_details["plan_id"]
                    db_subscription.ai_model = new_plan_details["ai_model"]
                    db_subscription.token_limit = new_plan_details["token_limit"]
            
            # Update period information
            if subscription.get('current_period_start'):
                db_subscription.current_period_start = datetime.fromtimestamp(subscription['current_period_start'])
            if subscription.get('current_period_end'):
                db_subscription.current_period_end = datetime.fromtimestamp(subscription['current_period_end'])
            
            db_subscription.updated_at = datetime.now()
            self.db.commit()

    async def purchase_tokens(self, user: User, token_amount: int, payment_method_id: str) -> Dict[str, Any]:
        """Purchase additional tokens for the user"""
        try:
            # Define pricing tiers ($1.00 per 1K tokens minus 1 cent)
            pricing_tiers = {
                1000: 0.99,
                2000: 1.99,
                5000: 4.99,
                10000: 9.99
            }
            
            if token_amount not in pricing_tiers:
                raise HTTPException(status_code=400, detail="Invalid token amount. Please select 1000, 2000, 5000, or 10000 tokens.")
            
            total_cost = pricing_tiers[token_amount]
            
            # Create a payment intent for the token purchase
            payment_intent = stripe.PaymentIntent.create(
                amount=int(total_cost * 100),  # Convert to cents
                currency='usd',
                customer=user.stripe_customer_id or await self.create_customer(user),
                payment_method=payment_method_id,
                confirmation_method='manual',
                confirm=True,
                return_url='https://assignmentai.com/success',  # You can customize this
                metadata={
                    'user_id': str(user.id),
                    'token_amount': str(token_amount),
                    'type': 'token_purchase'
                }
            )
            
            if payment_intent.status == 'succeeded':
                # Add tokens to user's subscription
                subscription = self.db.query(Subscription).filter(
                    Subscription.user_id == user.id,
                    Subscription.status == SubscriptionStatus.ACTIVE
                ).first()
                
                if subscription:
                    # Add tokens to the existing subscription
                    subscription.token_limit += token_amount
                    subscription.updated_at = datetime.now()
                    self.db.commit()
                    
                    return {
                        "success": True,
                        "message": f"Successfully purchased {token_amount:,} tokens for ${total_cost:.2f}",
                        "payment_intent_id": payment_intent.id,
                        "tokens_purchased": token_amount,
                        "total_cost": total_cost,
                        "new_token_limit": subscription.token_limit
                    }
                else:
                    raise HTTPException(status_code=404, detail="No active subscription found")
            else:
                raise HTTPException(status_code=400, detail=f"Payment failed: {payment_intent.status}")
                
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error purchasing tokens: {str(e)}")

    async def create_payment_intent(self, user: User, token_amount: int, amount: float) -> Dict[str, Any]:
        """Create a payment intent for token purchase"""
        try:
            # Validate token amount (minimum 1000 tokens)
            if token_amount < 1000:
                raise HTTPException(status_code=400, detail="Minimum token amount is 1000 tokens.")
            
            # Calculate expected amount based on new formula: (tokens/1000) - 0.01
            expected_amount = (token_amount / 1000) - 0.01
            if abs(amount - expected_amount) > 0.01:  # Allow for small floating point differences
                raise HTTPException(status_code=400, detail="Amount does not match expected price for token amount.")
            
            # Create payment intent using the custom token price ID
            payment_intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency='usd',
                customer=user.stripe_customer_id or await self.create_customer(user),
                metadata={
                    'user_id': str(user.id),
                    'token_amount': str(token_amount),
                    'type': 'token_purchase',
                    'price_id': settings.STRIPE_TOKEN_PRICE_CUSTOM
                }
            )
            
            return {
                "client_secret": payment_intent.client_secret,
                "payment_intent_id": payment_intent.id
            }
                
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error creating payment intent: {str(e)}")

    async def handle_token_purchase_success(self, payment_intent_id: str) -> None:
        """Handle successful token purchase by adding tokens to user's subscription"""
        try:
            # Retrieve payment intent from Stripe
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if payment_intent.status != 'succeeded':
                return
            
            # Get user ID and token amount from metadata
            user_id = int(payment_intent.metadata.get('user_id'))
            token_amount = int(payment_intent.metadata.get('token_amount'))
            
            # Find user's active subscription
            subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).first()
            
            if subscription:
                # Add tokens to the existing subscription
                subscription.token_limit += token_amount
                subscription.updated_at = datetime.now()
                
                # Create transaction record
                transaction = Transaction(
                    user_id=user_id,
                    transaction_type=TransactionType.TOKEN_PURCHASE,
                    amount=payment_intent.amount / 100,  # Convert from cents
                    currency=payment_intent.currency.upper(),
                    description=f"Token Purchase - {token_amount:,} tokens",
                    stripe_payment_intent_id=payment_intent_id,
                    transaction_metadata=f'{{"token_amount": {token_amount}, "price_per_token": {payment_intent.amount / 100 / token_amount}}}',
                    created_at=datetime.utcnow()
                )
                self.db.add(transaction)
                self.db.commit()
                
                print(f"Successfully added {token_amount} tokens to user {user_id}'s subscription")
            else:
                print(f"No active subscription found for user {user_id}")
                
        except Exception as e:
            print(f"Error handling token purchase success: {str(e)}")

    async def handle_subscription_payment_success(self, payment_intent: Dict[str, Any]) -> None:
        """Handle successful subscription payment by creating the subscription"""
        try:
            print("=" * 50)
            print("HANDLING SUBSCRIPTION PAYMENT SUCCESS")
            print("=" * 50)
            print(f"Payment intent: {payment_intent}")
            
            if payment_intent.get('status') != 'succeeded':
                print("Payment intent status is not succeeded, skipping")
                return
            
            # Get user ID and plan details from metadata
            user_id = int(payment_intent.get('metadata', {}).get('user_id'))
            price_id = payment_intent.get('metadata', {}).get('price_id')
            plan_name = payment_intent.get('metadata', {}).get('plan_name')
            is_upgrade_value = payment_intent.get('metadata', {}).get('is_upgrade', 'False')
            # Handle both string and boolean values
            if isinstance(is_upgrade_value, bool):
                is_upgrade = is_upgrade_value
            else:
                is_upgrade = str(is_upgrade_value).lower() == 'true'
            
            print(f"Extracted data: user_id={user_id}, price_id={price_id}, plan_name={plan_name}, is_upgrade={is_upgrade}")
            
            if not user_id or not price_id:
                print(f"Missing required metadata: user_id={user_id}, price_id={price_id}")
                return
            
            # Validate price_id against known price IDs
            valid_price_ids = [settings.STRIPE_PRICE_FREE, settings.STRIPE_PRICE_PLUS, settings.STRIPE_PRICE_PRO, settings.STRIPE_PRICE_MAX]
            if price_id not in valid_price_ids:
                print(f"Invalid price_id: {price_id}. Valid IDs: {valid_price_ids}")
                return
            
            # Get user from database
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                print(f"User {user_id} not found")
                return
            
            # Get plan details
            plan_details = self._get_plan_details_from_price_id(price_id)
            print(f"Plan details: {plan_details}")
            
            # Check if user already has an active subscription
            existing_subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).first()
            
            print(f"Existing subscription: {existing_subscription}")
            if existing_subscription:
                print(f"Existing subscription details: ID={existing_subscription.id}, Plan={existing_subscription.plan_id}, Name={existing_subscription.plan_name}, Tokens={existing_subscription.token_limit}")
            
            if existing_subscription:
                print(f"Found existing subscription: {existing_subscription.plan_name} with {existing_subscription.token_limit} tokens")
                
                # Check if this is a free plan subscription that should be upgraded
                if existing_subscription.plan_id == settings.STRIPE_PRICE_FREE:
                    print(f"User {user_id} has free plan subscription, upgrading to {plan_details['name']}")
                    print(f"Before update: plan_id={existing_subscription.plan_id}, token_limit={existing_subscription.token_limit}")
                    
                    # Update existing subscription from free to paid plan
                    existing_subscription.plan_name = plan_details["name"]
                    existing_subscription.plan_price = plan_details["price"]
                    existing_subscription.plan_id = plan_details["plan_id"]
                    existing_subscription.ai_model = plan_details["ai_model"]
                    existing_subscription.token_limit = plan_details["token_limit"]
                    existing_subscription.updated_at = datetime.now()
                    
                    print(f"After update: plan_id={existing_subscription.plan_id}, token_limit={existing_subscription.token_limit}")
                    print(f"Updated subscription for user {user_id} from free to {plan_details['name']} with {plan_details['token_limit']} tokens")
                else:
                    # Update existing paid subscription (upgrade or downgrade)
                    print(f"Updating subscription from {existing_subscription.plan_name} to {plan_details['name']}")
                    print(f"Before update: plan_id={existing_subscription.plan_id}, token_limit={existing_subscription.token_limit}")
                    
                    existing_subscription.plan_name = plan_details["name"]
                    existing_subscription.plan_price = plan_details["price"]
                    existing_subscription.plan_id = plan_details["plan_id"]
                    existing_subscription.ai_model = plan_details["ai_model"]
                    existing_subscription.token_limit = plan_details["token_limit"]
                    existing_subscription.updated_at = datetime.now()
                    
                    print(f"After update: plan_id={existing_subscription.plan_id}, token_limit={existing_subscription.token_limit}")
                    print(f"Updated subscription for user {user_id} to {plan_details['name']} with {plan_details['token_limit']} tokens")
            else:
                # Create new subscription
                print(f"Creating new subscription for user {user_id}: {plan_details['name']} with {plan_details['token_limit']} tokens")
                db_subscription = Subscription(
                    user_id=user_id,
                    stripe_subscription_id=f"pi_{payment_intent['id']}",  # Use payment intent ID as subscription ID
                    stripe_customer_id=user.stripe_customer_id,
                    plan_name=plan_details["name"],
                    plan_price=plan_details["price"],
                    status=SubscriptionStatus.ACTIVE,
                    current_period_start=datetime.now(),
                    current_period_end=datetime.now(),  # Will be updated by Stripe webhooks
                    plan_id=plan_details["plan_id"],
                    ai_model=plan_details["ai_model"],
                    token_limit=plan_details["token_limit"]
                )
                self.db.add(db_subscription)
                print(f"Created new subscription for user {user_id}: {plan_details['name']}")
            
            # Create transaction record
            print("Creating transaction record...")
            transaction = Transaction(
                user_id=user_id,
                transaction_type=TransactionType.SUBSCRIPTION,
                amount=plan_details["price"],
                currency="USD",
                description=f"Subscription - {plan_details['name']}",
                stripe_payment_intent_id=payment_intent['id'],
                transaction_metadata=f'{{"plan_name": "{plan_details["name"]}", "plan_id": "{plan_details["plan_id"]}", "token_limit": {plan_details["token_limit"]}}}',
                created_at=datetime.utcnow()
            )
            self.db.add(transaction)
            
            print("Committing to database...")
            self.db.commit()
            
            # Verify the update by querying the database again
            updated_subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).first()
            
            if updated_subscription:
                print(f"VERIFICATION: Updated subscription in database: ID={updated_subscription.id}, Plan={updated_subscription.plan_id}, Name={updated_subscription.plan_name}, Tokens={updated_subscription.token_limit}")
            else:
                print("VERIFICATION: No active subscription found after update!")
            
            print(f"Successfully processed subscription payment for user {user_id}: {plan_details['name']} - {plan_details['token_limit']} tokens")
            print("=" * 50)
                
        except Exception as e:
            print(f"Error handling subscription payment success: {str(e)}")

    async def create_subscription_payment_intent(self, user: User, price_id: str, is_upgrade: bool = False) -> Dict[str, Any]:
        """Create a payment intent for subscription"""
        try:
            # Get plan details
            plan_details = self._get_plan_details_from_price_id(price_id)
            
            # Ensure user has a Stripe customer ID
            if not user.stripe_customer_id:
                user.stripe_customer_id = await self.create_customer(user)
                self.db.add(user)
                self.db.commit()
                self.db.refresh(user)
            
            # Create payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=int(plan_details['price'] * 100),  # Convert to cents
                currency='usd',
                customer=user.stripe_customer_id,
                metadata={
                    'user_id': str(user.id),
                    'price_id': price_id,
                    'plan_name': plan_details['name'],
                    'type': 'subscription',
                    'is_upgrade': str(is_upgrade)
                }
            )
            
            return {
                "client_secret": payment_intent.client_secret,
                "payment_intent_id": payment_intent.id
            }
                
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error creating subscription payment intent: {str(e)}") 