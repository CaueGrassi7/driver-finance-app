from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.repositories.user_repository import user_repository
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> User:
    """
    Get current user profile.
    
    Requires authentication.
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Update current user profile.
    
    Requires authentication.
    Users can update their own:
    - email
    - password
    - full_name
    
    Note: is_active and is_superuser can only be changed by superusers.
    """
    # Prevent non-superusers from elevating privileges
    if not current_user.is_superuser:
        if user_update.is_superuser is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify superuser status"
            )
        if user_update.is_active is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify active status"
            )
    
    # Check email uniqueness if email is being updated
    if user_update.email and user_update.email != current_user.email:
        existing_user = await user_repository.get_by_email(db, email=user_update.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    updated_user = await user_repository.update(db, id=current_user.id, obj_in=user_update)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user


@router.get("/{user_id}", response_model=UserResponse)
async def read_user_by_id(
    user_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Get user by ID.
    
    Requires superuser privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access other users"
        )
    
    user = await user_repository.get_by_id(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

