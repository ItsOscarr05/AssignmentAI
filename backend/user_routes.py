"""
User routes for AssignmentAI.
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List
from database.models import User
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from security import get_current_user, get_password_hash, verify_password
from schemas import UserCreate, UserUpdate, UserResponse

router = APIRouter()

@router.post("/users/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user."""
    # Check if email already exists
    existing_user = await db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    db_user = User(
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.get("/users/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current user information."""
    return current_user

@router.put("/users/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update current user information."""
    # Update password if provided
    if user_update.password:
        current_user.password_hash = get_password_hash(user_update.password)
    
    # Update other fields
    for field, value in user_update.dict(exclude={'password'}, exclude_unset=True).items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a user by ID."""
    # Only admins can view other users
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all users (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to list users")
    
    users = await db.query(User).all()
    return users 