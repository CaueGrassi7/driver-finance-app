from typing import Optional

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category, CategoryType
from app.repositories.base import BaseRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository(BaseRepository[Category, CategoryCreate, CategoryUpdate]):
    """Repository for Category model with domain-specific methods."""

    def __init__(self):
        super().__init__(Category)

    async def get_by_user_and_name(
        self, db: AsyncSession, user_id: int, name: str, type: CategoryType
    ) -> Optional[Category]:
        """
        Get category by user, name, and type.
        
        Args:
            db: Database session
            user_id: User ID
            name: Category name
            type: Category type
            
        Returns:
            Category object if found, None otherwise
        """
        result = await db.execute(
            select(Category).where(
                Category.user_id == user_id,
                Category.name == name,
                Category.type == type
            )
        )
        return result.scalar_one_or_none()

    async def get_user_categories(
        self, db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100
    ) -> list[Category]:
        """
        Get all categories for a user (including system categories).
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of Category objects
        """
        result = await db.execute(
            select(Category)
            .where(
                or_(
                    Category.user_id == user_id,
                    Category.is_system == True
                )
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_system_categories(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Category]:
        """
        Get all system categories.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of system Category objects
        """
        result = await db.execute(
            select(Category)
            .where(Category.is_system == True)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_type(
        self, db: AsyncSession, user_id: int, category_type: CategoryType
    ) -> list[Category]:
        """
        Get categories by type for a user (including system categories).
        
        Args:
            db: Database session
            user_id: User ID
            category_type: Category type (income or expense)
            
        Returns:
            List of Category objects
        """
        result = await db.execute(
            select(Category).where(
                or_(
                    Category.user_id == user_id,
                    Category.is_system == True
                ),
                Category.type == category_type
            )
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, obj_in: CategoryCreate, user_id: int) -> Category:
        """
        Create a new category for a user.
        
        Args:
            db: Database session
            obj_in: Category creation schema
            user_id: User ID
            
        Returns:
            Created Category object
        """
        obj_data = obj_in.model_dump()
        db_category = Category(**obj_data, user_id=user_id, is_system=False)
        db.add(db_category)
        await db.commit()
        await db.refresh(db_category)
        return db_category


# Singleton instance
category_repository = CategoryRepository()

