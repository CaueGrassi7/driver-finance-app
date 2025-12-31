from typing import Optional
from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import TransactionType
from app.repositories.transaction_repository import transaction_repository
from app.repositories.category_repository import category_repository
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionFilter


class TransactionService:
    """Service for transaction business logic."""

    def __init__(self):
        self.transaction_repo = transaction_repository
        self.category_repo = category_repository

    async def create_transaction(
        self, db: AsyncSession, transaction_data: TransactionCreate, user_id: int
    ):
        """
        Create a new transaction for a user.
        
        Validates that:
        - If category_id is provided, it exists and belongs to the user
        
        Args:
            db: Database session
            transaction_data: Transaction creation data
            user_id: User ID
            
        Returns:
            Created transaction
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate category if provided
        if transaction_data.category_id:
            category = await self.category_repo.get_by_id(db, transaction_data.category_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            # Check if category belongs to user or is a system category
            if category.user_id is not None and category.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Category does not belong to this user"
                )
        
        return await self.transaction_repo.create(db, transaction_data, user_id)

    async def get_user_transactions(
        self, db: AsyncSession, user_id: int, filters: TransactionFilter
    ):
        """
        Get transactions for a user with optional filters.
        
        Args:
            db: Database session
            user_id: User ID
            filters: Filter criteria
            
        Returns:
            List of transactions
        """
        return await self.transaction_repo.get_user_transactions(
            db=db,
            user_id=user_id,
            skip=filters.skip,
            limit=filters.limit,
            transaction_type=filters.type,
            category_id=filters.category_id,
            start_date=filters.start_date,
            end_date=filters.end_date,
        )

    async def get_transaction(self, db: AsyncSession, transaction_id: int, user_id: int):
        """
        Get a transaction by ID, verifying it belongs to the user.
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            user_id: User ID
            
        Returns:
            Transaction object
            
        Raises:
            HTTPException: If transaction not found or doesn't belong to user
        """
        transaction = await self.transaction_repo.get_by_id(db, transaction_id)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        if transaction.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Transaction does not belong to this user"
            )
        return transaction

    async def update_transaction(
        self, db: AsyncSession, transaction_id: int, transaction_data: TransactionUpdate, user_id: int
    ):
        """
        Update a transaction.
        
        Validates that:
        - Transaction exists and belongs to the user
        - If category_id is being updated, it exists and belongs to the user
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            transaction_data: Update data
            user_id: User ID
            
        Returns:
            Updated transaction
            
        Raises:
            HTTPException: If validation fails
        """
        # Verify transaction belongs to user
        transaction = await self.get_transaction(db, transaction_id, user_id)
        
        # Validate category if being updated
        if transaction_data.category_id is not None:
            category = await self.category_repo.get_by_id(db, transaction_data.category_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            if category.user_id is not None and category.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Category does not belong to this user"
                )
        
        return await self.transaction_repo.update(db, transaction_id, transaction_data)

    async def delete_transaction(self, db: AsyncSession, transaction_id: int, user_id: int):
        """
        Delete a transaction.
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            user_id: User ID
            
        Returns:
            Deleted transaction
            
        Raises:
            HTTPException: If transaction not found or doesn't belong to user
        """
        # Verify transaction belongs to user
        await self.get_transaction(db, transaction_id, user_id)
        
        return await self.transaction_repo.delete(db, transaction_id)

    async def get_summary(self, db: AsyncSession, user_id: int) -> dict:
        """
        Get financial summary for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with income, expenses, and balance totals
        """
        total_income = await self.transaction_repo.get_total_by_type(
            db, user_id, TransactionType.INCOME
        )
        total_expenses = await self.transaction_repo.get_total_by_type(
            db, user_id, TransactionType.EXPENSE
        )
        balance = await self.transaction_repo.get_user_balance(db, user_id)
        
        return {
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "balance": float(balance),
        }


# Singleton instance
transaction_service = TransactionService()

