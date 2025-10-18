"""adicionar_valor_honorarios_ao_cliente

Revision ID: 09c7b661ca28
Revises: 8ac1421940bd
Create Date: 2025-10-17 20:15:01.224346

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '09c7b661ca28'
down_revision = '8ac1421940bd'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar coluna valor_honorarios à tabela cliente
    op.add_column('cliente', sa.Column('valor_honorarios', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade():
    # Remover coluna valor_honorarios da tabela cliente
    op.drop_column('cliente', 'valor_honorarios')
