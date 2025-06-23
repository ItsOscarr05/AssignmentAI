from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.crud import preference as preference_crud
from app.schemas.preference import Preference, PreferenceUpdate
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=Preference)
def get_preferences(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get current user's preferences.
    """
    preferences = preference_crud.get_or_create_preference(db, current_user.id)
    return preferences

@router.patch("/", response_model=Preference)
def update_preferences(
    preference_update: PreferenceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update current user's preferences.
    """
    preferences = preference_crud.update_preference(db, current_user.id, preference_update)
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return preferences

@router.post("/reset", response_model=Preference)
def reset_preferences(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Reset current user's preferences to default values.
    """
    preferences = preference_crud.reset_preference(db, current_user.id)
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return preferences

@router.delete("/")
def delete_preferences(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Delete current user's preferences.
    """
    if preference_crud.delete_preference(db, current_user.id):
        return {"message": "Preferences deleted successfully"}
    raise HTTPException(status_code=404, detail="Preferences not found") 
