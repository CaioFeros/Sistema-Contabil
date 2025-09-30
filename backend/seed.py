import random
from datetime import datetime
from decimal import Decimal
import click
from flask.cli import with_appcontext

# Corrigindo a importação circular: importar 'db' diretamente de 'models'
from .models import db, Cliente, Processamento, FaturamentoDetalhe
from app.services import calcular_impostos

# --- DADOS DE AMOSTRA ---

CLIENTES_PARA_CRIAR = [
    {"razao_social": "Tech Solutions Ltda", "cnpj": "01.123.456/0001-11", "regime_tributario": "Lucro Presumido"},
    {"razao_social": "Inova Consultoria S.A.", "cnpj": "02.234.567/0001-22", "regime_tributario": "Lucro Real"},
    {"razao_social": "Mercado Varejista do Bairro", "cnpj": "03.345.678/0001-33", "regime_tributario": "Simples Nacional"},
    {"razao_social": "Logística Express Transportes", "cnpj": "04.456.789/0001-44", "regime_tributario": "Lucro Presumido"},
    {"razao_social": "Agropecuária Campo Verde", "cnpj": "05.567.890/0001-55", "regime_tributario": "Lucro Real"},
]

SERVICOS_AMOSTRA = [
    "Consultoria em TI", "Desenvolvimento de Software", "Manutenção de Servidores",
    "Análise de Dados", "Suporte Técnico", "Marketing Digital", "Auditoria Contábil",
    "Transporte de Cargas Leves", "Armazenagem", "Consultoria Agrícola"
]

# --- FUNÇÕES DO SCRIPT ---

def limpar_dados():
    """Apaga todos os dados das tabelas relacionadas para evitar duplicatas."""
    print("Limpando dados antigos...")
    FaturamentoDetalhe.query.delete()
    Processamento.query.delete()
    Cliente.query.delete()
    db.session.commit()
    print("Dados limpos com sucesso.")

def criar_clientes():
    """Cria os clientes de amostra no banco de dados."""
    print("Criando clientes...")
    clientes_db = []
    for cliente_data in CLIENTES_PARA_CRIAR:
        # Verifica se o cliente já existe pelo CNPJ
        cliente_existente = Cliente.query.filter_by(cnpj=cliente_data["cnpj"]).first()
        if not cliente_existente:
            novo_cliente = Cliente(**cliente_data)
            db.session.add(novo_cliente)
            clientes_db.append(novo_cliente)
    db.session.commit()
    print(f"{len(CLIENTES_PARA_CRIAR)} clientes criados ou já existentes.")
    return Cliente.query.all()

def gerar_faturamento(clientes):
    """Gera dados de faturamento mensais para cada cliente."""
    print("Gerando faturamento e processamentos...")
    anos = [2023, 2024, 2025]
    total_processamentos = 0

    for cliente in clientes:
        for ano in anos:
            # Para 2025, gera dados apenas até o mês atual para ser mais realista
            mes_final = datetime.now().month if ano == datetime.now().year else 12
            
            for mes in range(1, mes_final + 1):
                detalhes = []
                faturamento_mensal = Decimal('0.0')
                
                # Gera de 3 a 7 notas fiscais (serviços) por mês
                for _ in range(random.randint(3, 7)):
                    valor_servico = Decimal(random.uniform(1000, 1000000))
                    detalhe = FaturamentoDetalhe(
                        descricao_servico=random.choice(SERVICOS_AMOSTRA),
                        valor=valor_servico
                    )
                    detalhes.append(detalhe)
                    faturamento_mensal += valor_servico

                imposto_calculado = calcular_impostos(float(faturamento_mensal), cliente.regime_tributario)

                novo_processamento = Processamento(
                    cliente_id=cliente.id,
                    mes=mes,
                    ano=ano,
                    faturamento_total=faturamento_mensal,
                    imposto_calculado=Decimal(imposto_calculado),
                    nome_arquivo_original=f"seed_data_{ano}_{mes}.csv",
                    detalhes=detalhes
                )
                db.session.add(novo_processamento)
                total_processamentos += 1

    db.session.commit()
    print(f"{total_processamentos} processamentos mensais gerados com sucesso.")

@click.command('seed-db')
@with_appcontext
def seed_db_command():
    """Limpa e preenche o banco de dados com dados de teste."""
    limpar_dados()
    clientes = criar_clientes()
    gerar_faturamento(clientes)
    print("Banco de dados populado com sucesso!")

def register_commands(app):
    """Registra os comandos CLI no aplicativo Flask."""
    app.cli.add_command(seed_db_command)