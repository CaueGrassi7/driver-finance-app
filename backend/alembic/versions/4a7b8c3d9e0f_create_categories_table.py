"""create categories table

Revision ID: 4a7b8c3d9e0f
Revises: 3f8a9b2c5d6e
Create Date: 2025-12-31 10:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a7b8c3d9e0f'
down_revision: Union[str, Sequence[str], None] = '3f8a9b2c5d6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create categories table and seed system categories."""
    # Create enum type using raw SQL with conditional check
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE categorytype AS ENUM ('income', 'expense');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create table (create_type=False because we already created the enum above)
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        # _create_events=False prevents SQLAlchemy from emitting CREATE TYPE during table creation
        sa.Column('type', sa.Enum('income', 'expense', name='categorytype', _create_events=False), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False, server_default='#6B7280'),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', 'type', name='uq_user_category_name_type')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_user_id'), 'categories', ['user_id'], unique=False)
    op.create_index('ix_categories_type_system', 'categories', ['type', 'is_system'], unique=False)
    
    # Seed system categories
    op.execute("""
        INSERT INTO categories (user_id, name, type, color, icon, is_system) VALUES
        (NULL, 'Combustível', 'expense', '#F59E0B', 'gas-station', true),
        (NULL, 'Manutenção do Veículo', 'expense', '#EF4444', 'car-wrench', true),
        (NULL, 'Pedágios', 'expense', '#6366F1', 'road', true),
        (NULL, 'Estacionamento', 'expense', '#8B5CF6', 'parking', true),
        (NULL, 'Seguro do Veículo', 'expense', '#EC4899', 'shield-car', true),
        (NULL, 'IPVA', 'expense', '#14B8A6', 'file-document', true),
        (NULL, 'Alimentação', 'expense', '#10B981', 'food', true),
        (NULL, 'Outros', 'expense', '#6B7280', 'dots-horizontal', true),
        (NULL, 'Corridas', 'income', '#22C55E', 'car', true),
        (NULL, 'Entregas', 'income', '#3B82F6', 'package-variant', true),
        (NULL, 'Gorjetas', 'income', '#FBBF24', 'cash', true),
        (NULL, 'Bônus', 'income', '#A855F7', 'star', true),
        (NULL, 'Outros', 'income', '#6B7280', 'cash-plus', true)
    """)


def downgrade() -> None:
    """Drop categories table and enum type."""
    op.drop_index('ix_categories_type_system', table_name='categories')
    op.drop_index(op.f('ix_categories_user_id'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
    
    # Drop enum type using raw SQL
    op.execute("DROP TYPE IF EXISTS categorytype")
