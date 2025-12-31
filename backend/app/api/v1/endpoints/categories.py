from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.category import CategoryType
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.repositories.category_repository import category_repository

router = APIRouter()


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    type: str | None = None,
):
    """
    List all categories available to the current user.
    
    Returns both user-created categories and system categories.
    
    Optional filters:
    - **type**: Filter by category type (income or expense)
    """
    if type:
        category_type = CategoryType(type)
        return await category_repository.get_by_type(db, current_user.id, category_type)
    else:
        return await category_repository.get_user_categories(db, current_user.id)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new custom category.
    
    - **name**: Category name (max 100 characters)
    - **type**: Category type (income or expense)
    - **color**: Hex color code (optional, default #6B7280)
    - **icon**: Icon name (optional)
    
    Returns the created category.
    """
    # Check if category with same name and type already exists
    existing = await category_repository.get_by_user_and_name(
        db, current_user.id, category_data.name, category_data.type
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name and type already exists"
        )
    
    return await category_repository.create(db, category_data, current_user.id)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get a specific category by ID.
    
    Returns the category if it's a system category or belongs to the current user.
    """
    category = await category_repository.get_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if user has access (own category or system category)
    if category.user_id is not None and category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Category does not belong to this user"
        )
    
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update a category.
    
    All fields are optional. Only provided fields will be updated.
    System categories cannot be updated.
    Category must belong to the current user.
    """
    category = await category_repository.get_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if it's a system category
    if category.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories cannot be modified"
        )
    
    # Check if category belongs to user
    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Category does not belong to this user"
        )
    
    # Check for name conflicts if name is being changed
    if category_data.name and category_data.name != category.name:
        type_to_check = category_data.type if category_data.type else category.type
        existing = await category_repository.get_by_user_and_name(
            db, current_user.id, category_data.name, type_to_check
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name and type already exists"
            )
    
    return await category_repository.update(db, category_id, category_data)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete a category.
    
    System categories cannot be deleted.
    Category must belong to the current user.
    Associated transactions will have their category_id set to NULL.
    """
    category = await category_repository.get_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if it's a system category
    if category.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories cannot be deleted"
        )
    
    # Check if category belongs to user
    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Category does not belong to this user"
        )
    
    await category_repository.delete(db, category_id)
    return None

