"""Adicionar suporte para pessoa física

Revision ID: add_pessoa_fisica_suport
Revises: 
Create Date: 2025-10-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_pessoa_fisica_suport'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Usa batch mode para SQLite
    with op.batch_alter_table('cliente') as batch_op:
        # Adiciona campo tipo_pessoa com valor padrão 'PJ' para registros existentes
        batch_op.add_column(sa.Column('tipo_pessoa', sa.String(length=2), nullable=False, server_default='PJ'))
        
        # Adiciona campos específicos de Pessoa Física
        batch_op.add_column(sa.Column('cpf', sa.String(length=14), nullable=True))
        batch_op.add_column(sa.Column('nome_completo', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('data_nascimento', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('rg', sa.String(length=20), nullable=True))
        
        # Cria índice único para CPF
        batch_op.create_unique_constraint('uq_cliente_cpf', ['cpf'])
        
        # Altera campos de PJ para nullable (já que agora PF não terá CNPJ)
        batch_op.alter_column('razao_social', nullable=True)
        batch_op.alter_column('cnpj', nullable=True)


def downgrade():
    # Remove campos adicionados
    with op.batch_alter_table('cliente') as batch_op:
        batch_op.drop_constraint('uq_cliente_cpf', type_='unique')
        batch_op.drop_column('rg')
        batch_op.drop_column('data_nascimento')
        batch_op.drop_column('nome_completo')
        batch_op.drop_column('cpf')
        batch_op.drop_column('tipo_pessoa')
        
        # Restaura campos como not nullable
        batch_op.alter_column('razao_social', nullable=False)
        batch_op.alter_column('cnpj', nullable=False)

