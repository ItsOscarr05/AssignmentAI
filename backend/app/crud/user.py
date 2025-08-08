from typing import Any, Dict, Optional, Union, List
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserProfile, UserPreferences
from app.core.validation import validate_ai_settings, sanitize_ai_settings, get_default_ai_settings

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_user(self, db: Session, *, user_id: int) -> Optional[User]:
        return self.get(db, id=user_id)

    def get(self, db: Session, *, id: int) -> Optional[User]:
        return db.query(User).filter(User.id == id).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            hashed_password=get_password_hash(obj_in.password),
            name=obj_in.name,
            updated_at=datetime.utcnow(),
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        # Update the object directly
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(
        self, db: Session, *, email: str, password: str
    ) -> Optional[User]:
        user = self.get_by_email(db, email=email)
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
get_multi = user.get_multi
create_user = user.create
update_user = user.update
delete_user = user.remove
get = user.get

def get_profile(db: Session, user_id: str) -> UserProfile:
    """Get user profile"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise ValueError("User not found")
    
    return UserProfile(
        name=user.name,
        email=user.email,
        avatar=user.avatar or "",
        bio=user.bio,
        location=user.location,
        website=user.website
    )

def update_profile(db: Session, user_id: str, profile: UserProfile) -> UserProfile:
    """Update user profile"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
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
    """Update user preferences with AI settings validation"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise ValueError("User not found")
    
    # Get current preferences
    current_prefs = user.preferences or {}
    
    # Validate AI settings if provided
    if preferences.ai_settings:
        # Get user's subscription plan (default to 'free' for now)
        subscription_plan = current_prefs.get('subscription_plan', 'free')
        
        # Validate AI settings
        validation_errors = validate_ai_settings(preferences.ai_settings, subscription_plan)
        if validation_errors:
            raise ValueError(f"AI settings validation failed: {'; '.join(validation_errors)}")
        
        # Sanitize AI settings
        sanitized_ai_settings = sanitize_ai_settings(preferences.ai_settings, subscription_plan)
        current_prefs['ai_settings'] = sanitized_ai_settings
    
    # Update other preferences
    prefs_dict = preferences.dict(exclude={'ai_settings'})
    current_prefs.update(prefs_dict)
    
    user.preferences = current_prefs
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return preferences

def get_ai_settings(db: Session, user_id: str) -> Dict[str, Any]:
    """Get user's AI settings with fallback to defaults"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise ValueError("User not found")
    
    # Get user's subscription plan (default to 'free' for now)
    subscription_plan = (user.preferences or {}).get('subscription_plan', 'free')
    
    # Get AI settings from user preferences
    ai_settings = (user.preferences or {}).get('ai_settings', {})
    
    # If no AI settings, return defaults
    if not ai_settings:
        return get_default_ai_settings()
    
    # Sanitize existing settings to ensure they're valid
    return sanitize_ai_settings(ai_settings, subscription_plan)

def update_avatar(db: Session, user_id: str, avatar_url: str) -> None:
    """Update user avatar"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise ValueError("User not found")
    
    user.avatar = avatar_url
    
    db.add(user)
    db.commit()
    db.refresh(user)

def verify_user_password(user: User, password: str) -> bool:
    """Verify user password"""
    return verify_password(password, user.hashed_password)

def update_password(db: Session, user_id: str, new_password: str) -> None:
    """Update user password"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise ValueError("User not found")
    
    user.hashed_password = get_password_hash(new_password)
    
    db.add(user)
    db.commit()
    db.refresh(user)

def delete_user_account(db: Session, user_id: str) -> None:
    """Delete user"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise ValueError("User not found")
    
    db.delete(user)
    db.commit()

def get_sessions(db: Session, user_id: str) -> List[Dict[str, Any]]:
    """Get user's active sessions"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
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

def count(db: Session) -> int:
    """Count total users"""
    return db.query(User).count()

def count_by_role(db: Session, role: str) -> int:
    """Count users by role"""
    if role == "teacher":
        return db.query(User).filter(User.is_superuser == True).count()
    elif role == "student":
        return db.query(User.is_superuser == False).count()
    return 0

def update_status(db: Session, user: User, is_active: bool, is_superuser: bool = None) -> User:
    """Update user status"""
    user.is_active = is_active
    if is_superuser is not None:
        user.is_superuser = is_superuser
    db.add(user)
    db.commit()
    db.refresh(user)
    return user 