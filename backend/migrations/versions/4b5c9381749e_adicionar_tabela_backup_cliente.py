"""adicionar_tabela_backup_cliente

Revision ID: 4b5c9381749e
Revises: 3a4d8270636d
Create Date: 2025-10-18 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4b5c9381749e'
down_revision = '3a4d8270636d'
branch_labels = None
depends_on = None


def upgrade():
    # Criar tabela backup_cliente
    op.create_table('backup_cliente',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cliente_id_original', sa.Integer(), nullable=False),
        sa.Column('razao_social', sa.String(length=200), nullable=False),
        sa.Column('cnpj', sa.String(length=18), nullable=False),
        sa.Column('regime_tributario', sa.String(length=100), nullable=False),
        sa.Column('nome_fantasia', sa.String(length=200), nullable=True),
        sa.Column('data_abertura', sa.String(length=10), nullable=True),
        sa.Column('situacao_cadastral', sa.String(length=50), nullable=True),
        sa.Column('data_situacao', sa.String(length=10), nullable=True),
        sa.Column('motivo_situacao', sa.String(length=200), nullable=True),
        sa.Column('natureza_juridica', sa.String(length=200), nullable=True),
        sa.Column('cnae_principal', sa.String(length=200), nullable=True),
        sa.Column('cnae_secundarias', sa.Text(), nullable=True),
        sa.Column('logradouro', sa.String(length=200), nullable=True),
        sa.Column('numero', sa.String(length=20), nullable=True),
        sa.Column('complemento', sa.String(length=100), nullable=True),
        sa.Column('bairro', sa.String(length=100), nullable=True),
        sa.Column('cep', sa.String(length=10), nullable=True),
        sa.Column('municipio', sa.String(length=100), nullable=True),
        sa.Column('uf', sa.String(length=2), nullable=True),
        sa.Column('telefone1', sa.String(length=20), nullable=True),
        sa.Column('telefone2', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=120), nullable=True),
        sa.Column('capital_social', sa.String(length=50), nullable=True),
        sa.Column('porte', sa.String(length=100), nullable=True),
        sa.Column('opcao_simples', sa.String(length=3), nullable=True),
        sa.Column('data_opcao_simples', sa.String(length=10), nullable=True),
        sa.Column('opcao_mei', sa.String(length=3), nullable=True),
        sa.Column('data_exclusao_simples', sa.String(length=10), nullable=True),
        sa.Column('situacao_especial', sa.String(length=200), nullable=True),
        sa.Column('data_situacao_especial', sa.String(length=10), nullable=True),
        sa.Column('data_exclusao', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('restaurado', sa.Boolean(), nullable=True),
        sa.Column('data_restauracao', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Remover tabela backup_cliente
    op.drop_table('backup_cliente')