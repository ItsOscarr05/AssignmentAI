import asyncio
from app.db.session import async_session
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.usage import Usage
from datetime import datetime, timedelta

async def create_mock_subscription():
    async with async_session() as db:
        try:
            # Get the mock user
            result = await db.execute(
                db.query(User).filter(User.email == "dev@assignmentai.com")
            )
            mock_user = result.scalar_one_or_none()
            
            if not mock_user:
                print("Mock user not found! Please run create_mock_user.py first.")
                return

            # Check if subscription already exists
            result = await db.execute(
                db.query(Subscription).filter(Subscription.user_id == mock_user.id)
            )
            existing_subscription = result.scalar_one_or_none()
            
            if existing_subscription:
                print("Mock subscription already exists!")
                return existing_subscription

            # Create mock subscription (Free plan with 30,000 tokens)
            mock_subscription = Subscription(
                user_id=mock_user.id,
                stripe_subscription_id="sub_mock_123456",
                stripe_customer_id="cus_mock_123456",
                plan_id="free",
                status=SubscriptionStatus.ACTIVE,
                ai_model="gpt-4-0125-preview",
                token_limit=30000,  # Free plan limit
                subscription_metadata={
                    "plan_name": "Free",
                    "price": 0,
                    "billing_cycle": "monthly"
                }
            )
            
            db.add(mock_subscription)
            await db.commit()
            await db.refresh(mock_subscription)
            
            # Create some mock usage data (user has used 15,000 tokens)
            mock_usage = [
                Usage(
                    user_id=mock_user.id,
                    feature="ai_generation",
                    action="generate_feedback",
                    timestamp=datetime.utcnow() - timedelta(days=5),
                    tokens_used=500,
                    usage_metadata={"assignment_id": 1, "type": "feedback"}
                ),
                Usage(
                    user_id=mock_user.id,
                    feature="ai_generation",
                    action="analyze_submission",
                    timestamp=datetime.utcnow() - timedelta(days=3),
                    tokens_used=1000,
                    usage_metadata={"submission_id": 1, "type": "analysis"}
                ),
                Usage(
                    user_id=mock_user.id,
                    feature="ai_generation",
                    action="generate_assignment",
                    timestamp=datetime.utcnow() - timedelta(days=1),
                    tokens_used=1000,
                    usage_metadata={"assignment_id": 2, "type": "generation"}
                ),
                # Add more usage to reach 15,000 total
                Usage(
                    user_id=mock_user.id,
                    feature="ai_generation",
                    action="code_completion",
                    timestamp=datetime.utcnow() - timedelta(hours=12),
                    tokens_used=200,
                    usage_metadata={"file_path": "main.py", "type": "completion"}
                ),
                # Add bulk usage to simulate heavy usage
                *[Usage(
                    user_id=mock_user.id,
                    feature="ai_generation",
                    action="generate_content",
                    timestamp=datetime.utcnow() - timedelta(hours=i),
                    tokens_used=500,
                    usage_metadata={"type": "content_generation"}
                ) for i in range(1, 25)]  # 12,000 more tokens
            ]
            
            for usage in mock_usage:
                db.add(usage)
            
            await db.commit()
            
            print("Mock subscription and usage data created successfully!")
            print(f"User: {mock_user.email}")
            print(f"Plan: Free (30,000 tokens/month)")
            print(f"Status: Active")
            print(f"Tokens Used: ~15,000")
            print(f"Tokens Remaining: ~15,000")
            
            return mock_subscription
            
        except Exception as e:
            print(f"Error creating mock subscription: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_mock_subscription()) 