from typing import Any, Dict, Optional, Union, List
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

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
    """Delete user and all related entities"""
    # Convert user_id to int since User.id is an integer
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid user ID")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise ValueError("User not found")
    
    # Delete all related entities
    from app.models.preference import Preference
    from app.models.assignment import Assignment
    from app.models.submission import Submission
    from app.models.feedback import Feedback
    from app.models.ai_assignment import AIAssignment
    from app.models.file_upload import FileUpload
    from app.models.file_completion_session import FileCompletionSession
    from app.models.subscription import Subscription
    from app.models.usage import Usage
    from app.models.template import Template
    from app.models.citation import Citation
    from app.models.token import Token
    from app.models.security import SecurityAlert, AuditLog, TwoFactorSetup
    from app.models.transaction import Transaction
    
    # Delete preferences
    db.query(Preference).filter(Preference.user_id == user_id_int).delete()
    
    # Delete feedback for user's submissions first (Feedback is linked to submissions, not users)
    # Get all submission IDs for this user before deleting submissions
    submission_ids = db.query(Submission.id).filter(Submission.user_id == user_id_int).all()
    if submission_ids:
        submission_id_list = [sub_id[0] for sub_id in submission_ids]
        db.query(Feedback).filter(Feedback.submission_id.in_(submission_id_list)).delete()
    
    # Delete submissions
    db.query(Submission).filter(Submission.user_id == user_id_int).delete()
    
    # Delete AI assignments for user's assignments (AIAssignment is linked to assignments, not users)
    # Get all assignment IDs for this user before deleting assignments
    assignment_ids = db.query(Assignment.id).filter(Assignment.user_id == user_id_int).all()
    if assignment_ids:
        assignment_id_list = [ass_id[0] for ass_id in assignment_ids]
        db.query(AIAssignment).filter(AIAssignment.assignment_id.in_(assignment_id_list)).delete()
    
    # Delete assignments (after AI assignments are deleted)
    db.query(Assignment).filter(Assignment.user_id == user_id_int).delete()
    
    # Note: File model doesn't have user_id attribute, files are managed through FileUpload
    # Files will be deleted when FileUploads are deleted
    
    # Delete file uploads
    db.query(FileUpload).filter(FileUpload.user_id == user_id_int).delete()
    
    # Delete file completion sessions
    db.query(FileCompletionSession).filter(FileCompletionSession.user_id == user_id_int).delete()
    
    # Delete subscriptions
    db.query(Subscription).filter(Subscription.user_id == user_id_int).delete()
    
    # Delete usage records
    db.query(Usage).filter(Usage.user_id == user_id_int).delete()
    # Note: UsageLimit doesn't have user_id - it's a global configuration table based on plan_id
    
    # Note: Activity model doesn't have user_id attribute - skipping activity deletion
    
    # Delete templates authored by the user (support legacy column names)
    template_owner_column = getattr(Template, "created_by", None) or getattr(Template, "creator_id", None)
    if template_owner_column is not None:
        try:
            db.query(Template).filter(template_owner_column == user_id_int).delete()
        except OperationalError:
            # Legacy sqlite schema may still reference creator_id
            db.execute(text("DELETE FROM templates WHERE creator_id = :user_id"), {"user_id": user_id_int})
    else:
        db.execute(text("DELETE FROM templates WHERE creator_id = :user_id"), {"user_id": user_id_int})
    
    # Delete citations
    db.query(Citation).filter(Citation.user_id == user_id_int).delete()
    
    # Delete tokens
    db.query(Token).filter(Token.user_id == user_id_int).delete()
    
    # Delete security records
    db.query(SecurityAlert).filter(SecurityAlert.user_id == user_id_int).delete()
    db.query(AuditLog).filter(AuditLog.user_id == user_id_int).delete()
    two_factor = db.query(TwoFactorSetup).filter(TwoFactorSetup.user_id == user_id_int).first()
    if two_factor:
        db.delete(two_factor)
    
    # Delete transactions
    db.query(Transaction).filter(Transaction.user_id == user_id_int).delete()
    
    # Finally, delete the user
    db.delete(user)
    db.commit()


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