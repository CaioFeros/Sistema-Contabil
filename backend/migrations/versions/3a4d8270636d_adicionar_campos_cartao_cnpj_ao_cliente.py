"""adicionar_campos_cartao_cnpj_ao_cliente

Revision ID: 3a4d8270636d
Revises: ff26e57d4ebd
Create Date: 2025-10-10 23:57:58.370975

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a4d8270636d'
down_revision = 'ff26e57d4ebd'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar novos campos ao modelo Cliente
    with op.batch_alter_table('cliente', schema=None) as batch_op:
        # Dados Básicos
        batch_op.add_column(sa.Column('nome_fantasia', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('data_abertura', sa.String(length=10), nullable=True))
        
        # Situação Cadastral
        batch_op.add_column(sa.Column('situacao_cadastral', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('data_situacao', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('motivo_situacao', sa.String(length=200), nullable=True))
        
        # Natureza Jurídica
        batch_op.add_column(sa.Column('natureza_juridica', sa.String(length=200), nullable=True))
        
        # Atividade Econômica
        batch_op.add_column(sa.Column('cnae_principal', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('cnae_secundarias', sa.Text(), nullable=True))
        
        # Endereço
        batch_op.add_column(sa.Column('logradouro', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('numero', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('complemento', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('bairro', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('cep', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('municipio', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('uf', sa.String(length=2), nullable=True))
        
        # Contato
        batch_op.add_column(sa.Column('telefone1', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('telefone2', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('email', sa.String(length=120), nullable=True))
        
        # Informações Empresariais
        batch_op.add_column(sa.Column('capital_social', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('porte', sa.String(length=100), nullable=True))
        
        # Opções Fiscais
        batch_op.add_column(sa.Column('opcao_simples', sa.String(length=3), nullable=True))
        batch_op.add_column(sa.Column('data_opcao_simples', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('opcao_mei', sa.String(length=3), nullable=True))
        batch_op.add_column(sa.Column('data_exclusao_simples', sa.String(length=10), nullable=True))
        
        # Situação Especial
        batch_op.add_column(sa.Column('situacao_especial', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('data_situacao_especial', sa.String(length=10), nullable=True))


def downgrade():
    # Remover os campos adicionados
    with op.batch_alter_table('cliente', schema=None) as batch_op:
        batch_op.drop_column('data_situacao_especial')
        batch_op.drop_column('situacao_especial')
        batch_op.drop_column('data_exclusao_simples')
        batch_op.drop_column('opcao_mei')
        batch_op.drop_column('data_opcao_simples')
        batch_op.drop_column('opcao_simples')
        batch_op.drop_column('porte')
        batch_op.drop_column('capital_social')
        batch_op.drop_column('email')
        batch_op.drop_column('telefone2')
        batch_op.drop_column('telefone1')
        batch_op.drop_column('uf')
        batch_op.drop_column('municipio')
        batch_op.drop_column('cep')
        batch_op.drop_column('bairro')
        batch_op.drop_column('complemento')
        batch_op.drop_column('numero')
        batch_op.drop_column('logradouro')
        batch_op.drop_column('cnae_secundarias')
        batch_op.drop_column('cnae_principal')
        batch_op.drop_column('natureza_juridica')
        batch_op.drop_column('motivo_situacao')
        batch_op.drop_column('data_situacao')
        batch_op.drop_column('situacao_cadastral')
        batch_op.drop_column('data_abertura')
        batch_op.drop_column('nome_fantasia')
