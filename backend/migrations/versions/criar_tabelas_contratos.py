"""criar tabelas contratos

Revision ID: criar_tabelas_contratos
Revises: adicionar_estado_civil_regime_comunhao
Create Date: 2025-10-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'criar_tabelas_contratos'
down_revision = 'adicionar_estado_civil_regime_comunhao'
branch_labels = None
depends_on = None


def upgrade():
    # Cria tabela template_contrato
    op.create_table(
        'template_contrato',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.String(length=100), nullable=False),
        sa.Column('nome', sa.String(length=200), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('conteudo', sa.Text(), nullable=False),
        sa.Column('variaveis_requeridas', sa.Text(), nullable=True),
        sa.Column('ativo', sa.Boolean(), nullable=False, default=True),
        sa.Column('versao', sa.String(length=20), nullable=True, default='1.0'),
        sa.Column('data_criacao', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('data_atualizacao', sa.DateTime(), nullable=True),
        sa.Column('usuario_criacao_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_criacao_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Cria tabela contrato
    op.create_table(
        'contrato',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('empresa_id', sa.Integer(), nullable=True),
        sa.Column('numero_contrato', sa.String(length=50), nullable=True),
        sa.Column('titulo', sa.String(length=300), nullable=False),
        sa.Column('tipo', sa.String(length=100), nullable=False),
        sa.Column('conteudo_gerado', sa.Text(), nullable=False),
        sa.Column('dados_variaveis', sa.Text(), nullable=True),
        sa.Column('socios_envolvidos', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, default='rascunho'),
        sa.Column('observacoes', sa.Text(), nullable=True),
        sa.Column('data_criacao', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('data_finalizacao', sa.DateTime(), nullable=True),
        sa.Column('usuario_criacao_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['template_contrato.id'], ),
        sa.ForeignKeyConstraint(['empresa_id'], ['cliente.id'], ),
        sa.ForeignKeyConstraint(['usuario_criacao_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('numero_contrato')
    )
    
    # Cria índices
    op.create_index('idx_contrato_tipo', 'contrato', ['tipo'])
    op.create_index('idx_contrato_status', 'contrato', ['status'])
    op.create_index('idx_contrato_empresa', 'contrato', ['empresa_id'])
    op.create_index('idx_template_tipo', 'template_contrato', ['tipo'])


def downgrade():
    # Remove índices
    op.drop_index('idx_template_tipo', table_name='template_contrato')
    op.drop_index('idx_contrato_empresa', table_name='contrato')
    op.drop_index('idx_contrato_status', table_name='contrato')
    op.drop_index('idx_contrato_tipo', table_name='contrato')
    
    # Remove tabelas
    op.drop_table('contrato')
    op.drop_table('template_contrato')

