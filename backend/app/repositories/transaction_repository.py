from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType
from app.repositories.base import BaseRepository
from app.schemas.transaction import TransactionCreate, TransactionUpdate


class TransactionRepository(BaseRepository[Transaction, TransactionCreate, TransactionUpdate]):
    """Repository for Transaction model with domain-specific methods."""

    def __init__(self):
        super().__init__(Transaction)

    async def get_user_transactions(
        self,
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        transaction_type: Optional[TransactionType] = None,
        category_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> list[Transaction]:
        """
        Get transactions for a user with optional filters.
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            transaction_type: Optional filter by transaction type
            category_id: Optional filter by category
            start_date: Optional filter by start date
            end_date: Optional filter by end date
            
        Returns:
            List of Transaction objects
        """
        query = select(Transaction).where(Transaction.user_id == user_id)
        
        if transaction_type:
            query = query.where(Transaction.type == transaction_type)
        
        if category_id:
            query = query.where(Transaction.category_id == category_id)
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        query = query.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def create(
        self, db: AsyncSession, obj_in: TransactionCreate, user_id: int
    ) -> Transaction:
        """
        Create a new transaction for a user.
        
        Args:
            db: Database session
            obj_in: Transaction creation schema
            user_id: User ID
            
        Returns:
            Created Transaction object
        """
        obj_data = obj_in.model_dump()
        db_transaction = Transaction(**obj_data, user_id=user_id)
        db.add(db_transaction)
        await db.commit()
        await db.refresh(db_transaction)
        return db_transaction

    async def get_user_balance(self, db: AsyncSession, user_id: int) -> Decimal:
        """
        Calculate total balance (income - expenses) for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Total balance as Decimal
        """
        # Sum income
        income_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.INCOME
                )
            )
        )
        total_income = income_result.scalar_one()
        
        # Sum expenses
        expense_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.EXPENSE
                )
            )
        )
        total_expense = expense_result.scalar_one()
        
        return Decimal(str(total_income)) - Decimal(str(total_expense))

    async def get_total_by_type(
        self, db: AsyncSession, user_id: int, transaction_type: TransactionType
    ) -> Decimal:
        """
        Get total amount for a specific transaction type.
        
        Args:
            db: Database session
            user_id: User ID
            transaction_type: Transaction type (income or expense)
            
        Returns:
            Total amount as Decimal
        """
        result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == transaction_type
                )
            )
        )
        return Decimal(str(result.scalar_one()))

    async def get_by_category(
        self, db: AsyncSession, user_id: int, category_id: int
    ) -> list[Transaction]:
        """
        Get all transactions for a specific category.
        
        Args:
            db: Database session
            user_id: User ID
            category_id: Category ID
            
        Returns:
            List of Transaction objects
        """
        result = await db.execute(
            select(Transaction)
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.category_id == category_id
                )
            )
            .order_by(Transaction.transaction_date.desc())
        )
        return list(result.scalars().all())


# Singleton instance
transaction_repository = TransactionRepository()

