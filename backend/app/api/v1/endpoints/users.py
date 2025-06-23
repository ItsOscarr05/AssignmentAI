from typing import Any, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_current_active_teacher
from app.services.storage_service import StorageService
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserProfile, UserPreferences, UserResponse, UserCreate, UserUpdate
from app.crud import user as user_crud
from app.services.security_monitoring import security_monitoring

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_teacher),
) -> Any:
    """
    Retrieve users.
    """
    users = user_crud.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/users", response_model=UserResponse)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_current_active_teacher),
) -> Any:
    """
    Create new user.
    """
    user = user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = user_crud.create(db, obj_in=user_in)
    return user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update own user.
    """
    if user_in.password is not None:
        current_user_data = jsonable_encoder(current_user)
        user_in = UserUpdate(**current_user_data)
    user = user_crud.update(db, db_obj=current_user, obj_in=user_in)
    return user

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    return user_crud.get_profile(db, current_user.id)

@router.put("/profile", response_model=UserProfile)
async def update_profile(
    profile: UserProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    return user_crud.update_profile(db, current_user.id, profile)

@router.put("/preferences", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's preferences"""
    return user_crud.update_preferences(db, current_user.id, preferences)

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create storage service
    storage_service = StorageService(db)
    
    # Delete old avatar if exists
    if current_user.avatar:
        storage_service.delete_file(current_user.avatar)
    
    # Upload new avatar
    avatar_path = await storage_service.save_file(file, f"avatars/{current_user.id}")
    
    # Update user profile
    user_crud.update_avatar(db, current_user.id, avatar_path)
    
    return {"avatarUrl": avatar_path}

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete current user's account"""
    # Create storage service
    storage_service = StorageService(db)
    
    # Delete avatar if exists
    if current_user.avatar:
        storage_service.delete_file(current_user.avatar)
    
    # Delete user
    user_crud.delete_user(db, current_user.id)
    return {"message": "Account deleted successfully"}

@router.post("/change-password")
async def change_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user's password"""
    if not user_crud.verify_password(current_user, current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    user_crud.update_password(db, current_user.id, new_password)
    return {"message": "Password changed successfully"}

@router.get("/sessions", response_model=List[dict])
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's active sessions"""
    return user_crud.get_sessions(db, current_user.id)

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific session"""
    user_crud.revoke_session(db, current_user.id, session_id)
    return {"message": "Session revoked successfully"}

@router.delete("/sessions")
async def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all sessions except current"""
    user_crud.revoke_all_sessions(db, current_user.id)
    return {"message": "All sessions revoked successfully"} 
