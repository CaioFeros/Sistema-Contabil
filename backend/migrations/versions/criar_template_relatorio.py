"""Criar tabela template_relatorio

Revision ID: criar_template_relatorio
Revises: ff26e57d4ebd
Create Date: 2024-01-23 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'criar_template_relatorio'
down_revision = 'ff26e57d4ebd'
branch_labels = None
depends_on = None


def upgrade():
    # Criar tabela template_relatorio
    op.create_table('template_relatorio',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('titulo', sa.String(length=200), nullable=False),
        sa.Column('conteudo', sa.Text(), nullable=False),
        sa.Column('tipo', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('usuario_criador_id', sa.Integer(), nullable=False),
        sa.Column('data_criacao', sa.DateTime(), nullable=False),
        sa.Column('data_atualizacao', sa.DateTime(), nullable=False),
        sa.Column('ativo', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_criador_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Criar índices para busca eficiente
    op.create_index('idx_template_relatorio_titulo', 'template_relatorio', ['titulo'])
    op.create_index('idx_template_relatorio_tipo', 'template_relatorio', ['tipo'])
    op.create_index('idx_template_relatorio_status', 'template_relatorio', ['status'])
    op.create_index('idx_template_relatorio_usuario', 'template_relatorio', ['usuario_criador_id'])
    op.create_index('idx_template_relatorio_ativo', 'template_relatorio', ['ativo'])


def downgrade():
    # Remover índices
    op.drop_index('idx_template_relatorio_ativo', table_name='template_relatorio')
    op.drop_index('idx_template_relatorio_usuario', table_name='template_relatorio')
    op.drop_index('idx_template_relatorio_status', table_name='template_relatorio')
    op.drop_index('idx_template_relatorio_tipo', table_name='template_relatorio')
    op.drop_index('idx_template_relatorio_titulo', table_name='template_relatorio')
    
    # Remover tabela
    op.drop_table('template_relatorio')
