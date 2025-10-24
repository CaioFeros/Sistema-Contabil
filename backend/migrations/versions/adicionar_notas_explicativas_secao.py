"""adicionar_notas_explicativas_secao

Revision ID: add_secao_notas
Revises: add_cnae_detailed_fields
Create Date: 2025-10-20 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_secao_notas'
down_revision = 'add_cnae_detailed_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar coluna notas_explicativas_secao à tabela cnae
    op.add_column('cnae', sa.Column('notas_explicativas_secao', sa.Text(), nullable=True))


def downgrade():
    # Remover coluna notas_explicativas_secao da tabela cnae
    op.drop_column('cnae', 'notas_explicativas_secao')

