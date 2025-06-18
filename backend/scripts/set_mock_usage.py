import asyncio
from datetime import datetime
from app.db.session import async_session
from app.models.user import User
from app.models.usage import Usage

# CHANGE THIS VALUE to test different scenarios
TOKENS_USED = 29000  # Set to 31000 to test "over the limit"

async def set_mock_user_usage():
    async with async_session() as db:
        try:
            # Find the mock user
            result = await db.execute(
                db.query(User).filter(User.email == "dev@assignmentai.com")
            )
            mock_user = result.scalar_one_or_none()
            if not mock_user:
                print("Mock user not found! Run create_mock_user.py first.")
                return

            # Delete all existing usage for this user
            await db.execute(
                db.query(Usage).filter(Usage.user_id == mock_user.id).delete()
            )
            await db.commit()

            # Add a single usage record
            usage = Usage(
                user_id=mock_user.id,
                feature="ai_generation",
                action="test_seed",
                timestamp=datetime.utcnow(),
                tokens_used=29000,
                usage_metadata={"seeded": True}
            )
            db.add(usage)
            await db.commit()
            print(f"Set mock user usage to {TOKENS_USED} tokens.")
            print(f"Tokens remaining (if 30,000 limit): {30000 - TOKENS_USED}")
        except Exception as e:
            print(f"Error: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(set_mock_user_usage()) 