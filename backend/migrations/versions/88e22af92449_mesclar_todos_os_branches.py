"""Mesclar todos os branches

Revision ID: 88e22af92449
Revises: criar_tabela_lixeira, 09c7b661ca28, add_pessoa_fisica_suport
Create Date: 2025-10-18 19:54:52.421193

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '88e22af92449'
down_revision = ('criar_tabela_lixeira', '09c7b661ca28', 'add_pessoa_fisica_suport')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
