import asyncio
import random
from datetime import datetime, timedelta
from app.db.session import async_session
from app.models.user import User
from app.models.usage import Usage

async def seed_mock_usage():
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

            # Optional: Clear existing usage for this user
            await db.execute(
                db.query(Usage).filter(Usage.user_id == mock_user.id).delete()
            )
            await db.commit()

            # Seed 30 assignments with random tokens_used
            total_tokens = 0
            for i in range(30):
                tokens = random.randint(200, 2000)
                total_tokens += tokens
                usage = Usage(
                    user_id=mock_user.id,
                    feature="ai_generation",
                    action="assignment_mock",
                    timestamp=datetime.utcnow() - timedelta(days=30-i),
                    tokens_used=tokens,
                    usage_metadata={"assignment_id": i+1, "mock": True}
                )
                db.add(usage)
            await db.commit()
            print(f"Seeded 30 mock usage records for {mock_user.email}.")
            print(f"Total tokens used: {total_tokens}")
            print(f"Tokens remaining (if 30,000 limit): {30000 - total_tokens}")
        except Exception as e:
            print(f"Error seeding mock usage: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(seed_mock_usage()) 