from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User
from app.models.assignment import Assignment
from app.models.submission import Submission

client = AsyncIOMotorClient(settings.MONGODB_URL)

async def init_db():
    """Initialize database connection and Beanie ODM."""
    await init_beanie(
        database=client[settings.MONGODB_DB],
        document_models=[
            User,
            Assignment,
            Submission
        ]
    )

async def get_db():
    """Get MongoDB database instance."""
    try:
        yield client[settings.MONGODB_DB]
    finally:
        client.close() 