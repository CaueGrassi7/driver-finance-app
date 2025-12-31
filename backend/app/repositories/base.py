from typing import Generic, TypeVar, Type, Optional, Any
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base

ModelT = TypeVar("ModelT", bound=Base)
CreateSchemaT = TypeVar("CreateSchemaT", bound=BaseModel)
UpdateSchemaT = TypeVar("UpdateSchemaT", bound=BaseModel)


class BaseRepository(Generic[ModelT, CreateSchemaT, UpdateSchemaT]):
    """
    Base repository with common CRUD operations.
    
    Generic parameters:
        ModelT: The SQLAlchemy model type
        CreateSchemaT: The Pydantic schema for creation
        UpdateSchemaT: The Pydantic schema for updates
    """

    def __init__(self, model: Type[ModelT]):
        """
        Initialize repository with a model.
        
        Args:
            model: SQLAlchemy model class
        """
        self.model = model

    async def get_by_id(self, db: AsyncSession, id: int) -> Optional[ModelT]:
        """
        Get a record by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Model instance if found, None otherwise
        """
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[ModelT]:
        """
        Get multiple records with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of model instances
        """
        result = await db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, db: AsyncSession, obj_in: CreateSchemaT) -> ModelT:
        """
        Create a new record.
        
        Args:
            db: Database session
            obj_in: Creation schema with data
            
        Returns:
            Created model instance
        """
        obj_data = obj_in.model_dump()
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, id: int, obj_in: UpdateSchemaT
    ) -> Optional[ModelT]:
        """
        Update an existing record.
        
        Args:
            db: Database session
            id: Record ID to update
            obj_in: Update schema with data
            
        Returns:
            Updated model instance if found, None otherwise
        """
        db_obj = await self.get_by_id(db, id)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, id: int) -> Optional[ModelT]:
        """
        Delete a record by ID.
        
        Args:
            db: Database session
            id: Record ID to delete
            
        Returns:
            Deleted model instance if found, None otherwise
        """
        db_obj = await self.get_by_id(db, id)
        if not db_obj:
            return None

        await db.delete(db_obj)
        await db.commit()
        return db_obj

    async def exists(self, db: AsyncSession, id: int) -> bool:
        """
        Check if a record exists by ID.
        
        Args:
            db: Database session
            id: Record ID to check
            
        Returns:
            True if record exists, False otherwise
        """
        result = await self.get_by_id(db, id)
        return result is not None

