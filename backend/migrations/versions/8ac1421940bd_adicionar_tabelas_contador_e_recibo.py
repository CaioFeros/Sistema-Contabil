"""adicionar_tabelas_contador_e_recibo

Revision ID: 8ac1421940bd
Revises: add_username_to_usuario
Create Date: 2025-10-17 11:23:51.863106

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8ac1421940bd'
down_revision = 'add_username_to_usuario'
branch_labels = None
depends_on = None


def upgrade():
    # Criar tabela contador
    op.create_table('contador',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=200), nullable=False),
        sa.Column('cpf', sa.String(length=14), nullable=False),
        sa.Column('crc', sa.String(length=50), nullable=False),
        sa.Column('pix', sa.String(length=100), nullable=False),
        sa.Column('banco', sa.String(length=100), nullable=False),
        sa.Column('agencia', sa.String(length=20), nullable=False),
        sa.Column('conta_corrente', sa.String(length=20), nullable=False),
        sa.Column('imagem_assinatura', sa.Text(), nullable=True),
        sa.Column('imagem_logo', sa.Text(), nullable=True),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('data_criacao', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('data_atualizacao', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cpf')
    )
    
    # Criar tabela recibo
    op.create_table('recibo',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cliente_id', sa.Integer(), nullable=False),
        sa.Column('contador_id', sa.Integer(), nullable=False),
        sa.Column('mes', sa.Integer(), nullable=False),
        sa.Column('ano', sa.Integer(), nullable=False),
        sa.Column('valor', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('tipo_servico', sa.String(length=50), nullable=False, server_default='honorarios'),
        sa.Column('descricao_servico', sa.String(length=300), nullable=True),
        sa.Column('numero_recibo', sa.String(length=50), nullable=True),
        sa.Column('data_emissao', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('usuario_emitente_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['cliente_id'], ['cliente.id'], ),
        sa.ForeignKeyConstraint(['contador_id'], ['contador.id'], ),
        sa.ForeignKeyConstraint(['usuario_emitente_id'], ['usuario.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('numero_recibo')
    )


def downgrade():
    # Remover tabelas na ordem reversa (por causa das foreign keys)
    op.drop_table('recibo')
    op.drop_table('contador')
