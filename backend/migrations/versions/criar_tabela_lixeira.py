"""Criar tabela de lixeira para itens excluídos

Revision ID: criar_tabela_lixeira
Revises: 
Create Date: 2025-10-17 22:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'criar_tabela_lixeira'
down_revision = '8ac1421940bd'  # Última migração
branch_labels = None
depends_on = None


def upgrade():
    # Criar tabela itens_excluidos
    op.create_table('itens_excluidos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tipo_entidade', sa.String(length=50), nullable=False),
        sa.Column('entidade_id_original', sa.Integer(), nullable=False),
        sa.Column('dados_json', sa.Text(), nullable=False),
        sa.Column('data_exclusao', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('usuario_exclusao_id', sa.Integer(), nullable=False),
        sa.Column('motivo_exclusao', sa.String(length=500), nullable=True),
        sa.Column('restaurado', sa.Boolean(), nullable=False, default=False),
        sa.Column('data_restauracao', sa.DateTime(), nullable=True),
        sa.Column('usuario_restauracao_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_exclusao_id'], ['usuario.id'], ),
        sa.ForeignKeyConstraint(['usuario_restauracao_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Criar índices para melhorar performance
    op.create_index('ix_itens_excluidos_tipo_entidade', 'itens_excluidos', ['tipo_entidade'])
    op.create_index('ix_itens_excluidos_restaurado', 'itens_excluidos', ['restaurado'])
    op.create_index('ix_itens_excluidos_data_exclusao', 'itens_excluidos', ['data_exclusao'])


def downgrade():
    # Remover índices
    op.drop_index('ix_itens_excluidos_data_exclusao', table_name='itens_excluidos')
    op.drop_index('ix_itens_excluidos_restaurado', table_name='itens_excluidos')
    op.drop_index('ix_itens_excluidos_tipo_entidade', table_name='itens_excluidos')
    
    # Remover tabela
    op.drop_table('itens_excluidos')

