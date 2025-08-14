from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
import os
from app.db.base_class import Base

SQLALCHEMY_DATABASE_URL = settings.database_uri

# Sync engine and session
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Async engine and session
# async_database_url = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
# async_engine = create_async_engine(
#     async_database_url,
#     echo=False,
#     future=True,
#     pool_pre_ping=True,
#     pool_recycle=300,
#     pool_size=10,
#     max_overflow=20
# )

# AsyncSessionLocal = async_sessionmaker(
#     async_engine,
#     class_=AsyncSession,
#     expire_on_commit=False,
#     autocommit=False,
#     autoflush=False
# )

# Base = declarative_base()  # Removed to unify Base usage

print("SQLALCHEMY_DATABASE_URL:", SQLALCHEMY_DATABASE_URL)
print("Absolute path:", os.path.abspath(SQLALCHEMY_DATABASE_URL.replace('sqlite:///', '')))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# async def get_async_db():
#     async with AsyncSessionLocal() as session:
#         try:
#             yield session
#         finally:
#             await session.close() 