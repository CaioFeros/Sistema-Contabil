"""adicionar_campos_detalhados_cnae

Revision ID: add_cnae_detailed_fields
Revises: 5d940c831c14
Create Date: 2025-10-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_cnae_detailed_fields'
down_revision = '5d940c831c14'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar colunas descricao_detalhada e lista_atividades à tabela cnae
    op.add_column('cnae', sa.Column('descricao_detalhada', sa.Text(), nullable=True))
    op.add_column('cnae', sa.Column('lista_atividades', sa.Text(), nullable=True))


def downgrade():
    # Remover colunas descricao_detalhada e lista_atividades da tabela cnae
    op.drop_column('cnae', 'lista_atividades')
    op.drop_column('cnae', 'descricao_detalhada')

