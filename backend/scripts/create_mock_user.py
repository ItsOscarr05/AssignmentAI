import asyncio
from app.db.session import async_session
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def create_mock_user():
    async with async_session() as db:
        try:
            # Check if mock user already exists
            result = await db.execute(
                db.query(User).filter(User.email == "dev@assignmentai.com")
            )
            mock_user = result.scalar_one_or_none()
            
            if mock_user:
                print("Mock user already exists!")
                return mock_user

            # Create mock user
            mock_user = User(
                email="dev@assignmentai.com",
                hashed_password=get_password_hash("dev123456"),  # Simple password for development
                full_name="Development User",
                role=UserRole.ADMIN,  # Give admin access for development
                is_active=True,
                is_verified=True,  # Skip email verification for development
                is_superuser=True  # Give superuser access for development
            )
            
            db.add(mock_user)
            await db.commit()
            await db.refresh(mock_user)
            print("Mock user created successfully!")
            print(f"Email: dev@assignmentai.com")
            print(f"Password: dev123456")
            return mock_user
        except Exception as e:
            print(f"Error creating mock user: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_mock_user()) 