from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.user import UserCreate, UserUpdate


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    """Repository for User model with domain-specific methods."""

    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        Args:
            db: Database session
            email: Email address to search for
            
        Returns:
            User object if found, None otherwise
        """
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, obj_in: UserCreate) -> User:
        """
        Create a new user with hashed password.
        
        Args:
            db: Database session
            obj_in: User creation schema with plain password
            
        Returns:
            Created User object
        """
        # Hash the password before storing
        hashed_password = get_password_hash(obj_in.password)
        
        db_user = User(
            email=obj_in.email,
            hashed_password=hashed_password,
            full_name=obj_in.full_name,
            is_active=True,
            is_superuser=False,
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    async def update(
        self, db: AsyncSession, id: int, obj_in: UserUpdate
    ) -> Optional[User]:
        """
        Update user fields, handling password hashing.
        
        Args:
            db: Database session
            id: ID of user to update
            obj_in: Schema with fields to update
            
        Returns:
            Updated User object if found, None otherwise
        """
        user = await self.get_by_id(db, id)
        if not user:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Hash password if it's being updated
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
        return user

    async def authenticate(
        self, db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        """
        Authenticate user with email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        user = await self.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user


# Singleton instance
user_repository = UserRepository()

