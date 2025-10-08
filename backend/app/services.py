# d:\Dev\Sistema-Contabil\backend\app\services.py

import pandas as pd
from decimal import Decimal
from datetime import datetime, timedelta
from .models import db, Cliente, Processamento, FaturamentoDetalhe
from sqlalchemy import func, and_


def calcular_impostos(faturamento, regime_tributario):
    """Calcula o imposto com base no regime tributário (simplificado)."""
    if regime_tributario == 'Lucro Presumido':
        return faturamento * 0.1633  # Exemplo de alíquota
    elif regime_tributario == 'Lucro Real':
        return faturamento * 0.34  # Exemplo de alíquota
    return 0

def calcular_imposto_simples_nacional(cliente_id, mes_calculo, ano_calculo, faturamento_mes_atual):
    """
    Calcula o imposto do Simples Nacional com base na receita bruta dos últimos 12 meses (RBT12).
    """
    # 1. Definir o período de 12 meses anteriores
    # data_final é o último dia do mês anterior ao mês de cálculo.
    data_final = datetime(ano_calculo, mes_calculo, 1) - timedelta(days=1)
    
    # data_inicial é o primeiro dia do mesmo mês, mas no ano anterior.
    data_inicial = datetime(data_final.year, data_final.month, 1).replace(year=data_final.year - 1)

    # 2. Consultar o faturamento acumulado (RBT12)
    resultado = db.session.query(
        func.sum(Processamento.faturamento_total)
    ).filter(
        Processamento.cliente_id == cliente_id,
        func.make_date(Processamento.ano, Processamento.mes, 1) >= data_inicial,
        func.make_date(Processamento.ano, Processamento.mes, 1) <= data_final
    ).scalar()

    rbt12 = Decimal(resultado or 0)

    # 3. Definir as faixas de alíquota do Anexo III (exemplo)
    faixas = [
        {"limite": Decimal("180000.00"), "aliquota": Decimal("0.06"), "deducao": Decimal("0")},
        {"limite": Decimal("360000.00"), "aliquota": Decimal("0.112"), "deducao": Decimal("9360.00")},
        {"limite": Decimal("720000.00"), "aliquota": Decimal("0.135"), "deducao": Decimal("17640.00")},
        {"limite": Decimal("1800000.00"), "aliquota": Decimal("0.16"), "deducao": Decimal("35640.00")},
        {"limite": Decimal("3600000.00"), "aliquota": Decimal("0.21"), "deducao": Decimal("125640.00")},
        {"limite": Decimal("4800000.00"), "aliquota": Decimal("0.33"), "deducao": Decimal("648000.00")}
    ]

    # 4. Encontrar a faixa correta e calcular a alíquota efetiva
    aliquota_efetiva = Decimal("0.06") # Alíquota mínima
    for faixa in faixas:
        if rbt12 <= faixa["limite"]:
            aliquota_nominal = faixa["aliquota"]
            parcela_a_deduzir = faixa["deducao"]
            if rbt12 > 0:
                aliquota_efetiva = ((rbt12 * aliquota_nominal) - parcela_a_deduzir) / rbt12
            else: # Se não houver faturamento anterior, usa a alíquota da primeira faixa
                aliquota_efetiva = faixas[0]['aliquota']
            break
    else: # Se RBT12 for maior que o limite máximo
        ultima_faixa = faixas[-1]
        aliquota_efetiva = ((rbt12 * ultima_faixa["aliquota"]) - ultima_faixa["deducao"]) / rbt12

    # 5. Calcular o imposto do mês
    imposto_do_mes = Decimal(faturamento_mes_atual) * aliquota_efetiva
    return float(imposto_do_mes.quantize(Decimal('0.01')))

def processar_arquivo_faturamento(arquivo, cliente_id, mes, ano):
    """
    Processa um arquivo CSV de faturamento, calcula os impostos e salva no banco.
    """
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        raise ValueError("Cliente não encontrado.")

    if Processamento.query.filter_by(cliente_id=cliente_id, mes=mes, ano=ano).first():
        raise ValueError(f"Faturamento para o período {mes}/{ano} já foi processado.")

    try:
        df = pd.read_csv(arquivo, sep=';', decimal=',')
        if 'valor' not in df.columns or 'descricao_servico' not in df.columns:
            raise ValueError("O CSV deve conter as colunas 'valor' e 'descricao_servico'.")
    except Exception as e:
        raise ValueError(f"Erro ao ler o arquivo CSV: {e}")

    faturamento_total = Decimal(df['valor'].sum()).quantize(Decimal('0.01'))

    if cliente.regime_tributario == 'Simples Nacional':
        imposto_calculado = calcular_imposto_simples_nacional(cliente_id, mes, ano, float(faturamento_total))
    else:
        imposto_calculado = calcular_impostos(float(faturamento_total), cliente.regime_tributario)

    detalhes = [FaturamentoDetalhe(descricao_servico=row['descricao_servico'], valor=Decimal(row['valor'])) for index, row in df.iterrows()]

    novo_processamento = Processamento(
        cliente_id=cliente_id,
        mes=mes,
        ano=ano,
        faturamento_total=faturamento_total,
        imposto_calculado=Decimal(imposto_calculado).quantize(Decimal('0.01')),
        nome_arquivo_original=arquivo.filename,
        detalhes=detalhes
    )
    db.session.add(novo_processamento)
    return novo_processamento

def gerar_relatorio_faturamento(params):
    """
    Gera um relatório de faturamento detalhado para um cliente e ano específicos,
    incluindo dados para gráficos.
    """
    cliente_id = params.get('cliente_id')
    ano = params.get('ano')

    # Busca todos os processamentos para o cliente e ano, ordenados por mês
    processamentos = Processamento.query.filter(
        Processamento.cliente_id == cliente_id,
        Processamento.ano == ano
    ).order_by(Processamento.mes).all()

    if not processamentos:
        return None

    detalhamento_mensal = []
    faturamento_total_periodo = 0
    imposto_total_periodo = 0

    # Precisamos calcular o RBT12 para cada mês do relatório
    for p in processamentos:
        faturamento_total_periodo += p.faturamento_total
        imposto_total_periodo += p.imposto_calculado

        # Cálculo do RBT12 para o mês p
        data_final_rbt12 = datetime(p.ano, p.mes, 1) - timedelta(days=1)
        data_inicial_rbt12 = data_final_rbt12.replace(year=data_final_rbt12.year - 1) + timedelta(days=1)
        rbt12_query_result = db.session.query(
            func.sum(Processamento.faturamento_total)
        ).filter(
            Processamento.cliente_id == cliente_id,
            func.make_date(Processamento.ano, Processamento.mes, 1) >= data_inicial_rbt12,
            func.make_date(Processamento.ano, Processamento.mes, 1) <= data_final_rbt12
        ).scalar()
        rbt12 = Decimal(rbt12_query_result or 0)

        # Cálculo da alíquota efetiva para o mês p
        aliquota_efetiva = Decimal(0)
        if p.faturamento_total > 0:
            aliquota_efetiva = p.imposto_calculado / p.faturamento_total

        detalhamento_mensal.append({
            'mes': p.mes,
            'ano': p.ano,
            'faturamento_total': p.faturamento_total,
            'faturamento_acumulado': rbt12,
            'aliquota': aliquota_efetiva,
            'imposto_calculado': p.imposto_calculado,
        })

    # --- PREPARAÇÃO DOS DADOS PARA OS GRÁFICOS ---
    # Extrai os dados do detalhamento que já calculamos
    meses_grafico = [f"{item['mes']:02d}/{item['ano']}" for item in detalhamento_mensal]
    faturamentos_grafico = [item['faturamento_total'] for item in detalhamento_mensal]
    impostos_grafico = [item['imposto_calculado'] for item in detalhamento_mensal]
    aliquotas_grafico = [item['aliquota'] for item in detalhamento_mensal]

    dados_graficos = {
        'faturamento_vs_imposto': {
            'meses': meses_grafico,
            'faturamento': faturamentos_grafico,
            'imposto': impostos_grafico,
        },
        'evolucao_aliquota': {
            'meses': meses_grafico,
            'aliquotas': aliquotas_grafico,
        }
    }
    # --- FIM DA PREPARAÇÃO ---

    cliente = Cliente.query.get(cliente_id)

    return {
        'cliente': {
            'id': cliente.id,
            'razao_social': cliente.razao_social,
            'cnpj': cliente.cnpj,
        },
        'ano': ano,
        'faturamento_total': faturamento_total_periodo,
        'imposto_total': imposto_total_periodo,
        'detalhamento_mensal': detalhamento_mensal,
        'dados_graficos': dados_graficos  # Adiciona os dados do gráfico à resposta
    }
