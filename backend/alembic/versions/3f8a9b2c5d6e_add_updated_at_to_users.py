"""add updated_at to users

Revision ID: 3f8a9b2c5d6e
Revises: 2be74d816b14
Create Date: 2025-12-31 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f8a9b2c5d6e'
down_revision: Union[str, Sequence[str], None] = '2be74d816b14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add updated_at column to users table."""
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))


def downgrade() -> None:
    """Remove updated_at column from users table."""
    op.drop_column('users', 'updated_at')

