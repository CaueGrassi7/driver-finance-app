from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from app.models.category import CategoryType


class CategoryBase(BaseModel):
    """Base category schema with common fields."""

    name: str = Field(..., min_length=1, max_length=100)
    type: CategoryType
    color: str = Field(default="#6B7280", pattern="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=50)


class CategoryCreate(CategoryBase):
    """Schema for category creation."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for category updates - all fields optional."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[CategoryType] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=50)


class CategoryResponse(CategoryBase):
    """Schema for category response - public data."""

    id: int
    user_id: Optional[int]
    is_system: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryInDB(CategoryBase):
    """Schema for category in database."""

    id: int
    user_id: Optional[int]
    is_system: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

