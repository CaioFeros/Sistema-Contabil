import json
import random
from datetime import datetime
from decimal import Decimal
import click
from flask.cli import with_appcontext
import os

# Adicionando imports necessários
from werkzeug.security import generate_password_hash

# Corrigindo a importação circular: importar 'db' diretamente de 'models'
from app.models import db, Usuario, Cliente, Processamento, FaturamentoDetalhe
from app.services import calcular_impostos, calcular_imposto_simples_nacional

# --- FUNÇÕES DO SCRIPT ---

def criar_usuario_padrao():
    """Cria um usuário admin padrão para login se ele não existir."""
    print("Verificando/Criando usuário admin padrão...", flush=True)
    email_padrao = "admin@sistema.com"
    if not Usuario.query.filter_by(email=email_padrao).first():
        senha_hash = generate_password_hash("admin123", method='pbkdf2:sha256')
        novo_usuario = Usuario(
            email=email_padrao, 
            senha_hash=senha_hash,
            nome="Administrador",
            papel="ADMIN"
        )
        db.session.add(novo_usuario)
        db.session.commit()
        print(f"Usuário admin '{email_padrao}' criado com sucesso.", flush=True)
        print("Login: admin@sistema.com", flush=True)
        print("Senha: admin123", flush=True)
    else:
        print(f"Usuário admin '{email_padrao}' já existe.", flush=True)

def limpar_dados():
    """Apaga todos os dados das tabelas relacionadas para evitar duplicatas."""
    print("Limpando dados antigos...", flush=True)
    FaturamentoDetalhe.query.delete()
    Processamento.query.delete()
    Cliente.query.delete()
    db.session.commit()
    print("Dados limpos com sucesso.", flush=True)

def carregar_dados_json():
    """Carrega os dados de amostra do arquivo seed_data.json."""
    # Constrói o caminho para o arquivo JSON de forma segura
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'seed_data.json') # Agora o JSON está no mesmo diretório
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def criar_clientes(clientes_data):
    """Cria os clientes de amostra no banco de dados."""
    print("Criando clientes...", flush=True)
    # Usamos 'with_entities' para selecionar apenas a coluna 'id' e evitar erros
    # se o banco de dados ainda não estiver totalmente migrado.
    for cliente_data in clientes_data:
        cliente_existente = Cliente.query.with_entities(Cliente.id).filter_by(cnpj=cliente_data.get("cnpj")).first()
        if not cliente_existente:
            novo_cliente = Cliente(**cliente_data)
            db.session.add(novo_cliente)
    db.session.commit()
    print(f"{len(clientes_data)} clientes criados ou já existentes.", flush=True)
    return Cliente.query.all()

def gerar_faturamento_massivo(clientes):
    """Gera dados de faturamento massivos para todos os clientes de 2023 a 2025."""
    print("Gerando faturamento massivo de 2023 a 2025...", flush=True)

    if not clientes:
        print("Nenhum cliente encontrado para gerar faturamento.", flush=True)
        return

    servicos_possiveis = [
        "Consultoria de TI", "Desenvolvimento de Software", "Manutenção de Servidores",
        "Suporte Técnico", "Análise de Dados", "Marketing Digital", "Design Gráfico",
        "Gestão de Redes Sociais", "Auditoria Contábil", "Planejamento Tributário"
    ]

    for cliente in clientes:
        print(f"  -> Gerando para o cliente: {cliente.razao_social}", flush=True)
        for ano in range(2023, 2026): # de 2023 até 2025
            for mes in range(1, 13):
                # Pula meses futuros no ano corrente
                if ano == datetime.now().year and mes > datetime.now().month:
                    continue

                num_notas = random.randint(3, 5)
                detalhes_mes = []
                faturamento_total_mes = Decimal('0.0')

                for _ in range(num_notas):
                    descricao = random.choice(servicos_possiveis)
                    valor = Decimal(random.uniform(1000, 500000)).quantize(Decimal('0.01'))
                    detalhes_mes.append(FaturamentoDetalhe(descricao_servico=descricao, valor=valor))
                    faturamento_total_mes += valor

                if cliente.regime_tributario == 'Simples Nacional':
                    imposto_calculado = calcular_imposto_simples_nacional(cliente.id, mes, ano, float(faturamento_total_mes))
                else:
                    imposto_calculado = calcular_impostos(float(faturamento_total_mes), cliente.regime_tributario)

                novo_processamento = Processamento(
                    cliente_id=cliente.id, mes=mes, ano=ano,
                    faturamento_total=faturamento_total_mes,
                    imposto_calculado=Decimal(imposto_calculado).quantize(Decimal('0.01')),
                    nome_arquivo_original=f"gerado_automaticamente_{ano}_{mes}.csv",
                    detalhes=detalhes_mes
                )
                db.session.add(novo_processamento)

    db.session.commit()
    print("Geração de faturamento massivo concluída.", flush=True)

def gerar_faturamento_especifico():
    """Gera dados de faturamento específicos para a empresa de teste."""
    print("Gerando faturamento específico para 'Contabilidade Teste de Imposto LTDA'...", flush=True)
    
    razao_social_teste = "Contabilidade Teste de Imposto LTDA"
    cnpj_teste = "00.000.000/0001-11"

    cliente_teste = Cliente.query.filter_by(cnpj=cnpj_teste).first()
    if not cliente_teste:
        cliente_teste = Cliente(
            razao_social=razao_social_teste,
            cnpj=cnpj_teste,
            regime_tributario="Simples Nacional"
        )
        db.session.add(cliente_teste)
        db.session.commit()
        print(f"Cliente '{razao_social_teste}' criado.", flush=True)

    # Dados de faturamento específicos
    faturamentos = {
        (2024, 1): "23204.00", (2024, 2): "12442.00", (2024, 3): "34082.00",
        (2024, 4): "19010.00", (2024, 5): "20050.00", (2024, 6): "16595.00",
        (2024, 7): "19060.00", (2024, 8): "17918.00", (2024, 9): "11140.00",
        (2024, 10): "17636.00", (2024, 11): "10000.00", (2024, 12): "25712.00",
        (2025, 1): "33084.00", (2025, 2): "29391.00", (2025, 3): "19046.00",
        (2025, 4): "19667.00", (2025, 5): "19884.00", (2025, 6): "21911.00",
        (2025, 7): "27068.00", (2025, 8): "23300.00", (2025, 9): "23204.00",
    }

    for (ano, mes), valor_str in faturamentos.items():
        # Verifica se já existe um processamento para este período para evitar duplicatas
        if Processamento.query.filter_by(cliente_id=cliente_teste.id, ano=ano, mes=mes).first():
            continue

        faturamento_total_mes = Decimal(valor_str)
        
        # Cria 2 notas fictícias que somam o valor total
        valor_nota1 = (faturamento_total_mes / Decimal('2')).quantize(Decimal('0.01'))
        valor_nota2 = faturamento_total_mes - valor_nota1

        detalhes_mes = [
            FaturamentoDetalhe(descricao_servico="Serviço de Contabilidade A", valor=valor_nota1),
            FaturamentoDetalhe(descricao_servico="Serviço de Consultoria B", valor=valor_nota2)
        ]

        # O cálculo do imposto deve ser feito ANTES de criar o processamento,
        # pois ele depende dos faturamentos anteriores já existentes no banco.
        # Por isso, fazemos o commit a cada iteração.
        imposto_calculado = calcular_imposto_simples_nacional(
            cliente_id=cliente_teste.id,
            mes_calculo=mes,
            ano_calculo=ano,
            faturamento_mes_atual=float(faturamento_total_mes)
        )

        novo_processamento = Processamento(
            cliente_id=cliente_teste.id,
            mes=mes,
            ano=ano,
            faturamento_total=faturamento_total_mes,
            imposto_calculado=Decimal(imposto_calculado).quantize(Decimal('0.01')),
            nome_arquivo_original=f"importado_teste_{ano}_{mes}.csv",
            detalhes=detalhes_mes
        )
        db.session.add(novo_processamento)
        db.session.commit() # Commit a cada mês para que o próximo cálculo tenha os dados corretos

    print("Geração de faturamento específico concluída.", flush=True)

@click.command('seed-db')
@with_appcontext
def seed_db_command():
    """Limpa e preenche o banco de dados com dados de teste."""
    criar_usuario_padrao() # 1. Garante que o usuário de dev exista
    dados = carregar_dados_json()
    limpar_dados() # 2. Limpa apenas os dados de negócio
    clientes = criar_clientes(dados['clientes'])
    gerar_faturamento_massivo(clientes) # 3. Gera os dados de faturamento aleatórios
    gerar_faturamento_especifico() # 4. Gera os dados específicos para o cliente de teste
    print("Banco de dados populado com sucesso!", flush=True)

def register_commands(app):
    """Registra os comandos CLI no aplicativo Flask."""
    app.cli.add_command(seed_db_command)