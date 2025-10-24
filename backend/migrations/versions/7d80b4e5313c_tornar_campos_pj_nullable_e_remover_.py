"""tornar_campos_pj_nullable_e_remover_regime_de_pf

Revision ID: 7d80b4e5313c
Revises: 88e22af92449
Create Date: 2025-10-18 21:00:50.953191

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7d80b4e5313c'
down_revision = '88e22af92449'
branch_labels = None
depends_on = None


def upgrade():
    # Torna campos de PJ nullable para permitir cadastro de PF
    with op.batch_alter_table('cliente', schema=None) as batch_op:
        batch_op.alter_column('razao_social',
               existing_type=sa.VARCHAR(length=200),
               nullable=True)
        batch_op.alter_column('cnpj',
               existing_type=sa.VARCHAR(length=18),
               nullable=True)
        batch_op.alter_column('regime_tributario',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)


def downgrade():
    # Reverte as alterações (torna NOT NULL novamente)
    with op.batch_alter_table('cliente', schema=None) as batch_op:
        batch_op.alter_column('regime_tributario',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
        batch_op.alter_column('cnpj',
               existing_type=sa.VARCHAR(length=18),
               nullable=False)
        batch_op.alter_column('razao_social',
               existing_type=sa.VARCHAR(length=200),
               nullable=False)
