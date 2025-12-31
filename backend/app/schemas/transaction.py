from datetime import datetime
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    """Base transaction schema with common fields."""

    type: TransactionType
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=500)
    transaction_date: datetime


class TransactionCreate(TransactionBase):
    """Schema for transaction creation."""

    category_id: Optional[int] = None


class TransactionUpdate(BaseModel):
    """Schema for transaction updates - all fields optional."""

    type: Optional[TransactionType] = None
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=500)
    transaction_date: Optional[datetime] = None
    category_id: Optional[int] = None


class TransactionResponse(TransactionBase):
    """Schema for transaction response - public data."""

    id: int
    user_id: int
    category_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionFilter(BaseModel):
    """Schema for filtering transactions."""

    type: Optional[TransactionType] = None
    category_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=100)


class TransactionInDB(TransactionBase):
    """Schema for transaction in database."""

    id: int
    user_id: int
    category_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

