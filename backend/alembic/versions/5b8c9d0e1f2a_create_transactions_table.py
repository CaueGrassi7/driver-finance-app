"""create transactions table

Revision ID: 5b8c9d0e1f2a
Revises: 4a7b8c3d9e0f
Create Date: 2025-12-31 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5b8c9d0e1f2a'
down_revision: Union[str, Sequence[str], None] = '4a7b8c3d9e0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create transactions table."""
    # Create enum type using raw SQL with conditional check
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE transactiontype AS ENUM ('income', 'expense');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create table (create_type=False because we already created the enum above)
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        # _create_events=False prevents SQLAlchemy from emitting CREATE TYPE during table creation
        sa.Column('type', sa.Enum('income', 'expense', name='transactiontype', _create_events=False), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('transaction_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('amount > 0', name='check_amount_positive'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_transactions_category_id'), 'transactions', ['category_id'], unique=False)
    op.create_index('ix_transactions_user_date', 'transactions', ['user_id', 'transaction_date'], unique=False)
    op.create_index('ix_transactions_user_type_date', 'transactions', ['user_id', 'type', 'transaction_date'], unique=False)


def downgrade() -> None:
    """Drop transactions table and enum type."""
    op.drop_index('ix_transactions_user_type_date', table_name='transactions')
    op.drop_index('ix_transactions_user_date', table_name='transactions')
    op.drop_index(op.f('ix_transactions_category_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_user_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_table('transactions')
    
    # Drop enum type using raw SQL
    op.execute("DROP TYPE IF EXISTS transactiontype")
