from typing import Any, Dict, Optional, Union, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserProfile, UserPreferences

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalar_one_or_none()

    async def get_user(self, db: AsyncSession, *, user_id: int) -> Optional[User]:
        return await self.get(db, id=user_id)

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            is_superuser=obj_in.is_superuser,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def authenticate(
        self, db: AsyncSession, *, email: str, password: str
    ) -> Optional[User]:
        user = await self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser

user = CRUDUser(User)

# Export functions
get_user = user.get_user
get_user_by_email = user.get_by_email
create_user = user.create
update_user = user.update
delete_user = user.remove

def get_profile(db: Session, user_id: str) -> UserProfile:
    """Get user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    return UserProfile(
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        bio=user.bio,
        location=user.location,
        website=user.website
    )

def update_profile(db: Session, user_id: str, profile: UserProfile) -> UserProfile:
    """Update user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    user.name = profile.name
    user.bio = profile.bio
    user.location = profile.location
    user.website = profile.website
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return get_profile(db, user_id)

def update_preferences(db: Session, user_id: str, preferences: UserPreferences) -> UserPreferences:
    """Update user preferences"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    user.preferences = preferences.dict()
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return preferences

def update_avatar(db: Session, user_id: str, avatar_url: str) -> None:
    """Update user avatar"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    user.avatar = avatar_url
    
    db.add(user)
    db.commit()
    db.refresh(user)

def verify_password(user: User, password: str) -> bool:
    """Verify user password"""
    return verify_password(password, user.hashed_password)

def update_password(db: Session, user_id: str, new_password: str) -> None:
    """Update user password"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    user.hashed_password = get_password_hash(new_password)
    
    db.add(user)
    db.commit()
    db.refresh(user)

def delete_user(db: Session, user_id: str) -> None:
    """Delete user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    db.delete(user)
    db.commit()

def get_sessions(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Get user's active sessions"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    # This is a placeholder. In a real application, you would query a sessions table
    # or use a session management system like Redis
    return [
        {
            "id": "current",
            "device": "Web Browser",
            "location": "Unknown",
            "last_active": "2024-03-20T12:00:00Z",
            "created_at": "2024-03-20T12:00:00Z"
        }
    ]

def revoke_session(db: Session, user_id: str, session_id: str) -> None:
    """Revoke a specific session"""
    # This is a placeholder. In a real application, you would invalidate the session
    # in your session management system
    pass

def revoke_all_sessions(db: Session, user_id: str) -> None:
    """Revoke all sessions except current"""
    # This is a placeholder. In a real application, you would invalidate all sessions
    # in your session management system
    pass 