"""Add user audit system

Revision ID: add_user_audit_system
Revises: 3a4d8270636d
Create Date: 2025-10-15 13:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_user_audit_system'
down_revision = '3a4d8270636d'
branch_labels = None
depends_on = None


def upgrade():
    # Atualizar tabela usuario existente
    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.add_column(sa.Column('nome', sa.String(length=120), nullable=False, server_default='Usuário'))
        batch_op.add_column(sa.Column('ativo', sa.Boolean(), nullable=False, server_default='1'))
        batch_op.add_column(sa.Column('data_criacao', sa.DateTime(), nullable=False, server_default=sa.func.now()))
        batch_op.add_column(sa.Column('ultimo_login', sa.DateTime(), nullable=True))
        batch_op.alter_column('papel', server_default='USER')
    
    # Criar tabela de logs de auditoria
    op.create_table('log_auditoria',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('acao', sa.String(length=100), nullable=False),
        sa.Column('entidade', sa.String(length=50), nullable=False),
        sa.Column('entidade_id', sa.Integer(), nullable=True),
        sa.Column('detalhes', sa.Text(), nullable=True),
        sa.Column('data_acao', sa.DateTime(), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_log_auditoria_data_acao'), 'log_auditoria', ['data_acao'], unique=False)
    op.create_index(op.f('ix_log_auditoria_usuario_id'), 'log_auditoria', ['usuario_id'], unique=False)


def downgrade():
    # Remover tabela de logs
    op.drop_index(op.f('ix_log_auditoria_usuario_id'), table_name='log_auditoria')
    op.drop_index(op.f('ix_log_auditoria_data_acao'), table_name='log_auditoria')
    op.drop_table('log_auditoria')
    
    # Remover colunas da tabela usuario
    with op.batch_alter_table('usuario', schema=None) as batch_op:
        batch_op.drop_column('ultimo_login')
        batch_op.drop_column('data_criacao')
        batch_op.drop_column('ativo')
        batch_op.drop_column('nome')
