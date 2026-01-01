from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.core.security import create_access_token
from app.repositories.user_repository import user_repository
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_create: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Register a new user.
    
    - **email**: Valid email address (must be unique)
    - **password**: Password (minimum 8 characters)
    - **full_name**: Optional full name
    
    Returns the created user profile and JWT token.
    """
    # Check if user already exists
    existing_user = await user_repository.get_by_email(db, email=user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = await user_repository.create(db, obj_in=user_create)
    return user


@router.post("/login", response_model=Token)
async def login(
    db: Annotated[AsyncSession, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> dict[str, str]:
    """
    OAuth2 compatible login endpoint.
    
    - **username**: User email address (OAuth2 spec requires 'username' field)
    - **password**: User password
    
    Returns JWT access token for authentication.
    Works with Swagger UI "Authorize" button.
    """
    # Authenticate user (OAuth2 spec uses 'username', but we treat it as email)
    user = await user_repository.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

