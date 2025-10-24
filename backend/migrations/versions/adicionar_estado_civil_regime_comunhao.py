"""adicionar estado civil e regime comunhao

Revision ID: adicionar_estado_civil_regime_comunhao
Revises: adicionar_suporte_pessoa_fisica
Create Date: 2025-10-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'adicionar_estado_civil_regime_comunhao'
down_revision = 'add_secao_notas'
branch_labels = None
depends_on = None


def upgrade():
    # Adiciona os campos estado_civil e regime_comunhao à tabela cliente
    with op.batch_alter_table('cliente', schema=None) as batch_op:
        batch_op.add_column(sa.Column('estado_civil', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('regime_comunhao', sa.String(length=50), nullable=True))


def downgrade():
    # Remove os campos estado_civil e regime_comunhao da tabela cliente
    with op.batch_alter_table('cliente', schema=None) as batch_op:
        batch_op.drop_column('regime_comunhao')
        batch_op.drop_column('estado_civil')

