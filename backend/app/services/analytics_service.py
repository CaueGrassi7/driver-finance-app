from typing import Optional
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import select, func, and_, extract, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.repositories.transaction_repository import transaction_repository
from app.repositories.category_repository import category_repository


class AnalyticsService:
    """Service for analytics and reporting."""

    def __init__(self):
        self.transaction_repo = transaction_repository
        self.category_repo = category_repository

    async def get_monthly_summary(
        self, db: AsyncSession, user_id: int, year: int, month: int
    ) -> dict:
        """
        Get financial summary for a specific month.
        
        Args:
            db: Database session
            user_id: User ID
            year: Year (e.g., 2025)
            month: Month (1-12)
            
        Returns:
            Dictionary with monthly income, expenses, balance, and transaction count
        """
        # Get income for the month
        income_result = await db.execute(
            select(
                func.coalesce(func.sum(Transaction.amount), 0).label("total"),
                func.count(Transaction.id).label("count")
            )
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.INCOME,
                    extract("year", Transaction.transaction_date) == year,
                    extract("month", Transaction.transaction_date) == month
                )
            )
        )
        income_data = income_result.one()
        
        # Get expenses for the month
        expense_result = await db.execute(
            select(
                func.coalesce(func.sum(Transaction.amount), 0).label("total"),
                func.count(Transaction.id).label("count")
            )
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.EXPENSE,
                    extract("year", Transaction.transaction_date) == year,
                    extract("month", Transaction.transaction_date) == month
                )
            )
        )
        expense_data = expense_result.one()
        
        total_income = Decimal(str(income_data.total))
        total_expenses = Decimal(str(expense_data.total))
        balance = total_income - total_expenses
        
        return {
            "year": year,
            "month": month,
            "total_income": float(total_income),
            "income_count": income_data.count,
            "total_expenses": float(total_expenses),
            "expense_count": expense_data.count,
            "balance": float(balance),
            "total_transactions": income_data.count + expense_data.count,
        }

    async def get_daily_summary(
        self, db: AsyncSession, user_id: int, target_date: date
    ) -> dict:
        """
        Get financial summary for a specific day.
        
        Args:
            db: Database session
            user_id: User ID
            target_date: Target date
            
        Returns:
            Dictionary with daily income, expenses, balance, fuel expenses and transaction count
        """
        # Get income for the day
        income_result = await db.execute(
            select(
                func.coalesce(func.sum(Transaction.amount), 0).label("total"),
                func.count(Transaction.id).label("count")
            )
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.INCOME,
                    cast(Transaction.transaction_date, Date) == target_date
                )
            )
        )
        income_data = income_result.one()
        
        # Get expenses for the day
        expense_result = await db.execute(
            select(
                func.coalesce(func.sum(Transaction.amount), 0).label("total"),
                func.count(Transaction.id).label("count")
            )
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.EXPENSE,
                    cast(Transaction.transaction_date, Date) == target_date
                )
            )
        )
        expense_data = expense_result.one()
        
        total_income = Decimal(str(income_data.total))
        total_expenses = Decimal(str(expense_data.total))
        balance = total_income - total_expenses

        fuel_result = await db.execute(
            select(
                func.coalesce(func.sum(Transaction.amount), 0).label("total"),
                func.count(Transaction.id).label("count")
            )
            .where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.type == TransactionType.EXPENSE,
                    Transaction.category_id == 1,
                    cast(Transaction.transaction_date, Date) == target_date
                )
            )
        )
        fuel_data = fuel_result.one()
        
        total_fuel_expenses = Decimal(str(fuel_data.total))
        fuel_transaction_count = fuel_data.count
        
        # Avoid division by zero
        if fuel_transaction_count > 0:
            average_fuel_expense = total_fuel_expenses / fuel_transaction_count
        else:
            average_fuel_expense = Decimal("0")
        
        return {
            "date": target_date.isoformat(),
            "total_income": float(total_income),
            "income_count": income_data.count,
            "total_expenses": float(total_expenses),
            "expense_count": expense_data.count,
            "balance": float(balance),
            "total_transactions": income_data.count + expense_data.count,
            "total_fuel_expenses": float(total_fuel_expenses),
            "fuel_transaction_count": fuel_transaction_count,
            "average_fuel_expense": float(average_fuel_expense),
        }

    async def get_category_breakdown(
        self,
        db: AsyncSession,
        user_id: int,
        transaction_type: Optional[TransactionType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> list[dict]:
        """
        Get spending/income breakdown by category.
        
        Args:
            db: Database session
            user_id: User ID
            transaction_type: Optional filter by type
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            List of dictionaries with category details and totals
        """
        query = (
            select(
                Category.id,
                Category.name,
                Category.type,
                Category.color,
                Category.icon,
                func.coalesce(func.sum(Transaction.amount), 0).label("total"),
                func.count(Transaction.id).label("count")
            )
            .join(Transaction, Transaction.category_id == Category.id)
            .where(Transaction.user_id == user_id)
            .group_by(Category.id, Category.name, Category.type, Category.color, Category.icon)
        )
        
        if transaction_type:
            query = query.where(Transaction.type == transaction_type)
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        result = await db.execute(query.order_by(func.sum(Transaction.amount).desc()))
        
        breakdown = []
        for row in result:
            breakdown.append({
                "category_id": row.id,
                "category_name": row.name,
                "category_type": row.type,
                "category_color": row.color,
                "category_icon": row.icon,
                "total": float(row.total),
                "transaction_count": row.count,
            })
        
        return breakdown

    async def get_fuel_analytics(
        self,
        db: AsyncSession,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        """
        Get fuel spending analytics.
        
        Looks for categories with "Combustível" or "Fuel" in the name.
        
        Args:
            db: Database session
            user_id: User ID
            start_date: Optional start date filter
            end_date: Optional end date filter
            
        Returns:
            Dictionary with fuel spending statistics
        """
        # Find fuel category
        fuel_categories = await db.execute(
            select(Category.id).where(
                and_(
                    Category.name.ilike("%combustível%"),
                    Category.type == TransactionType.EXPENSE
                )
            )
        )
        fuel_category_ids = [row[0] for row in fuel_categories]
        
        if not fuel_category_ids:
            return {
                "total_fuel_expenses": 0.0,
                "fuel_transaction_count": 0,
                "average_fuel_expense": 0.0,
            }
        
        # Build query
        query = select(
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
            func.count(Transaction.id).label("count"),
            func.coalesce(func.avg(Transaction.amount), 0).label("average")
        ).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.category_id.in_(fuel_category_ids)
            )
        )
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        result = await db.execute(query)
        data = result.one()
        
        return {
            "total_fuel_expenses": float(data.total),
            "fuel_transaction_count": data.count,
            "average_fuel_expense": float(data.average),
        }


# Singleton instance
analytics_service = AnalyticsService()

