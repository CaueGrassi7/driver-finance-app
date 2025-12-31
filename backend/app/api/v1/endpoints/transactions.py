from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionFilter,
)
from app.services.transaction_service import transaction_service

router = APIRouter()


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new transaction.
    
    - **type**: Transaction type (income or expense)
    - **amount**: Transaction amount (must be positive)
    - **description**: Optional description
    - **transaction_date**: Date when transaction occurred
    - **category_id**: Optional category ID
    
    Returns the created transaction.
    """
    return await transaction_service.create_transaction(db, transaction_data, current_user.id)


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    type: str | None = None,
    category_id: int | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    skip: int = 0,
    limit: int = 50,
):
    """
    List transactions for the current user.
    
    Optional filters:
    - **type**: Filter by transaction type (income or expense)
    - **category_id**: Filter by category
    - **start_date**: Filter by start date (ISO format)
    - **end_date**: Filter by end date (ISO format)
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return (max 100)
    
    Returns list of transactions ordered by date (newest first).
    """
    from datetime import datetime
    from app.models.transaction import TransactionType
    
    # Parse filters
    filters = TransactionFilter(
        type=TransactionType(type) if type else None,
        category_id=category_id,
        start_date=datetime.fromisoformat(start_date) if start_date else None,
        end_date=datetime.fromisoformat(end_date) if end_date else None,
        skip=skip,
        limit=min(limit, 100),
    )
    
    return await transaction_service.get_user_transactions(db, current_user.id, filters)


@router.get("/summary")
async def get_transaction_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get financial summary for the current user.
    
    Returns:
    - **total_income**: Total income
    - **total_expenses**: Total expenses
    - **balance**: Current balance (income - expenses)
    """
    return await transaction_service.get_summary(db, current_user.id)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get a specific transaction by ID.
    
    Returns the transaction if it belongs to the current user.
    """
    return await transaction_service.get_transaction(db, transaction_id, current_user.id)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update a transaction.
    
    All fields are optional. Only provided fields will be updated.
    Transaction must belong to the current user.
    """
    return await transaction_service.update_transaction(
        db, transaction_id, transaction_data, current_user.id
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete a transaction.
    
    Transaction must belong to the current user.
    """
    await transaction_service.delete_transaction(db, transaction_id, current_user.id)
    return None

