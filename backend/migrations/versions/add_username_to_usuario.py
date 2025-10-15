"""add username to usuario

Revision ID: add_username_to_usuario
Revises: add_user_audit_system
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_username_to_usuario'
down_revision = 'add_user_audit_system'
branch_labels = None
depends_on = None


def upgrade():
    # Adiciona a coluna username à tabela usuario
    op.add_column('usuario', sa.Column('username', sa.String(length=80), nullable=True))
    
    # Cria um índice único para username
    op.create_unique_constraint('uq_usuario_username', 'usuario', ['username'])


def downgrade():
    # Remove o índice único
    op.drop_constraint('uq_usuario_username', 'usuario', type_='unique')
    
    # Remove a coluna username
    op.drop_column('usuario', 'username')
