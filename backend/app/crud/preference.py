from typing import Optional
from sqlalchemy.orm import Session
from app.models.preference import Preference
from app.schemas.preference import PreferenceCreate, PreferenceUpdate

def create_preference(db: Session, preference: PreferenceCreate) -> Preference:
    db_preference = Preference(**preference.model_dump())
    db.add(db_preference)
    db.commit()
    db.refresh(db_preference)
    return db_preference

def get_preference(db: Session, user_id: str) -> Optional[Preference]:
    return db.query(Preference).filter(Preference.user_id == user_id).first()

def get_or_create_preference(db: Session, user_id: str) -> Preference:
    preference = get_preference(db, user_id)
    if not preference:
        preference = create_preference(db, PreferenceCreate(user_id=user_id))
    return preference

def update_preference(
    db: Session,
    user_id: str,
    preference_update: PreferenceUpdate
) -> Optional[Preference]:
    db_preference = get_preference(db, user_id)
    if not db_preference:
        return None
    
    update_data = preference_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_preference, field, value)
    
    db.commit()
    db.refresh(db_preference)
    return db_preference

def delete_preference(db: Session, user_id: str) -> bool:
    db_preference = get_preference(db, user_id)
    if not db_preference:
        return False
    
    db.delete(db_preference)
    db.commit()
    return True

def reset_preference(db: Session, user_id: str) -> Optional[Preference]:
    """Reset user preferences to default values"""
    db_preference = get_preference(db, user_id)
    if not db_preference:
        return None
    
    # Reset to default values
    db_preference.theme = "light"
    db_preference.language = "en"
    db_preference.font_size = "medium"
    db_preference.compact_mode = False

    db_preference.show_profile = True
    db_preference.show_progress = True
    db_preference.show_activity = True
    db_preference.high_contrast = False
    db_preference.reduced_motion = False
    db_preference.screen_reader = False
    db_preference.custom_preferences = {}
    
    db.commit()
    db.refresh(db_preference)
    return db_preference 