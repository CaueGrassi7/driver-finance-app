from typing import Annotated
from datetime import datetime, date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.transaction import TransactionType
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/monthly")
async def get_monthly_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    year: int = Query(..., description="Year (e.g., 2025)"),
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
):
    """
    Get financial summary for a specific month.
    
    Query parameters:
    - **year**: Year (e.g., 2025)
    - **month**: Month (1-12)
    
    Returns:
    - **year**: Requested year
    - **month**: Requested month
    - **total_income**: Total income for the month
    - **income_count**: Number of income transactions
    - **total_expenses**: Total expenses for the month
    - **expense_count**: Number of expense transactions
    - **balance**: Net balance (income - expenses)
    - **total_transactions**: Total number of transactions
    """
    return await analytics_service.get_monthly_summary(db, current_user.id, year, month)


@router.get("/category-breakdown")
async def get_category_breakdown(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    type: str | None = Query(None, description="Filter by transaction type (income or expense)"),
    start_date: str | None = Query(None, description="Start date (ISO format)"),
    end_date: str | None = Query(None, description="End date (ISO format)"),
):
    """
    Get spending/income breakdown by category.
    
    Optional query parameters:
    - **type**: Filter by transaction type (income or expense)
    - **start_date**: Filter by start date (ISO format: YYYY-MM-DD)
    - **end_date**: Filter by end date (ISO format: YYYY-MM-DD)
    
    Returns list of categories with:
    - **category_id**: Category ID
    - **category_name**: Category name
    - **category_type**: Category type
    - **category_color**: Category color (hex)
    - **category_icon**: Category icon name
    - **total**: Total amount for this category
    - **transaction_count**: Number of transactions in this category
    
    Results are ordered by total amount (highest first).
    """
    # Parse optional filters
    transaction_type = TransactionType(type) if type else None
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    return await analytics_service.get_category_breakdown(
        db, current_user.id, transaction_type, start, end
    )


@router.get("/fuel")
async def get_fuel_analytics(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    start_date: str | None = Query(None, description="Start date (ISO format)"),
    end_date: str | None = Query(None, description="End date (ISO format)"),
):
    """
    Get fuel spending analytics.
    
    Analyzes transactions in fuel-related categories.
    
    Optional query parameters:
    - **start_date**: Filter by start date (ISO format: YYYY-MM-DD)
    - **end_date**: Filter by end date (ISO format: YYYY-MM-DD)
    
    Returns:
    - **total_fuel_expenses**: Total spent on fuel
    - **fuel_transaction_count**: Number of fuel transactions
    - **average_fuel_expense**: Average fuel transaction amount
    """
    # Parse optional filters
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    return await analytics_service.get_fuel_analytics(db, current_user.id, start, end)


@router.get("/summary")
async def get_overall_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get overall financial summary for the current user.
    
    Returns:
    - **total_income**: Total income (all time)
    - **total_expenses**: Total expenses (all time)
    - **balance**: Current balance (income - expenses)
    
    Note: This endpoint is also available at /transactions/summary
    """
    from app.services.transaction_service import transaction_service
    return await transaction_service.get_summary(db, current_user.id)


@router.get("/daily")
async def get_daily_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    date: str | None = Query(None, description="Date (ISO format: YYYY-MM-DD). Defaults to today."),
):
    """
    Get financial summary for a specific day.
    
    Optional query parameters:
    - **date**: Date (ISO format: YYYY-MM-DD). If not provided, uses today.
    
    Returns:
    - **date**: Requested date
    - **total_income**: Total income for the day
    - **income_count**: Number of income transactions
    - **total_expenses**: Total expenses for the day
    - **expense_count**: Number of expense transactions
    - **balance**: Net balance for the day (income - expenses)
    - **total_transactions**: Total number of transactions for the day
    """
    # Parse date or use today
    target_date = datetime.fromisoformat(date).date() if date else datetime.now().date()
    
    return await analytics_service.get_daily_summary(db, current_user.id, target_date)

