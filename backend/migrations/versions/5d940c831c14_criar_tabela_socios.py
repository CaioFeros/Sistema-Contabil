"""criar_tabela_socios

Revision ID: 5d940c831c14
Revises: 7d80b4e5313c
Create Date: 2025-10-18 21:51:22.639249

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5d940c831c14'
down_revision = '7d80b4e5313c'
branch_labels = None
depends_on = None


def upgrade():
    # Cria tabela de sócios (relacionamento PJ <-> PF)
    op.create_table('socio',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('empresa_id', sa.Integer(), nullable=False),
        sa.Column('socio_id', sa.Integer(), nullable=False),
        sa.Column('percentual_participacao', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('data_entrada', sa.String(length=10), nullable=True),
        sa.Column('cargo', sa.String(length=100), nullable=True),
        sa.Column('data_cadastro', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['empresa_id'], ['cliente.id'], ),
        sa.ForeignKeyConstraint(['socio_id'], ['cliente.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('empresa_id', 'socio_id', name='uq_empresa_socio')
    )


def downgrade():
    # Remove tabela de sócios
    op.drop_table('socio')
