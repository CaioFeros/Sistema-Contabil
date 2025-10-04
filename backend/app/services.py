import pandas as pd
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, and_
from .models import db, Processamento, FaturamentoDetalhe, Cliente


def calcular_imposto_simples_nacional(cliente_id: int, mes_calculo: int, ano_calculo: int, faturamento_mes_atual: float) -> float:
    """
    Calcula o imposto para o regime Simples Nacional com base no faturamento acumulado (RBT12).
    """
    # 1. Calcular o faturamento acumulado dos 12 meses anteriores (fatAcum12 / RBT12)
    data_fim_periodo = datetime(ano_calculo, mes_calculo, 1) - relativedelta(days=1)
    data_inicio_periodo = data_fim_periodo - relativedelta(months=12) + relativedelta(days=1)

    fat_acum_12 = db.session.query(func.sum(Processamento.faturamento_total)).filter(
        Processamento.cliente_id == cliente_id,
        func.date(func.concat(Processamento.ano, '-', Processamento.mes, '-01')).between(
            data_inicio_periodo.strftime('%Y-%m-01'),
            data_fim_periodo.strftime('%Y-%m-01')
        )
    ).scalar() or 0.0

    fat_acum_12 = float(fat_acum_12)

    # 2. Encontrar a alíquota nominal e a parcela a deduzir com base no fatAcum12
    aliquota_nominal = 0.0
    parcela_a_deduzir = 0.0

    if fat_acum_12 <= 180000.00:
        # Faixa 1 (usando a alíquota antiga como base, pois não foi especificada)
        aliquota_nominal = 0.06
        parcela_a_deduzir = 0.0
    elif 180000.01 <= fat_acum_12 <= 360000.00:
        # Faixa 2
        aliquota_nominal = 0.1120
        parcela_a_deduzir = 9360.00
    elif 360000.01 <= fat_acum_12 <= 720000.00:
        # Faixa 3
        aliquota_nominal = 0.1350
        parcela_a_deduzir = 17640.00
    elif 720000.01 <= fat_acum_12 <= 1800000.00:
        # Faixa 4
        aliquota_nominal = 0.1600
        parcela_a_deduzir = 35640.00
    elif 1800000.01 <= fat_acum_12 <= 3600000.00:
        # Faixa 5
        aliquota_nominal = 0.2100
        parcela_a_deduzir = 125640.00
    else: # > 3.600.000,00
        # Faixa 6
        aliquota_nominal = 0.3300
        parcela_a_deduzir = 648000.00

    # 3. Calcular a alíquota efetiva
    # Fórmula: ((RBT12 * Alíquota Nominal) - Parcela a Deduzir) / RBT12
    if fat_acum_12 > 0:
        numerador = (fat_acum_12 * aliquota_nominal) - parcela_a_deduzir
        aliquota_efetiva = numerador / fat_acum_12
    else:
        aliquota_efetiva = aliquota_nominal

    # 4. Calcular o imposto do mês
    imposto_final = faturamento_mes_atual * aliquota_efetiva

    return imposto_final

def calcular_impostos(faturamento_total: float, regime_tributario: str) -> float:
    """
    Calcula o valor do imposto com base no faturamento total e no regime tributário.

    Esta é uma lógica de exemplo e deve ser adaptada às regras fiscais reais
    e às alíquotas específicas de cada cliente ou serviço.

    Args:
        faturamento_total: O valor total faturado.
        regime_tributario: O regime tributário do cliente (ex: 'Simples Nacional').

    Returns:
        O valor do imposto calculado.
    """
    taxas = {
        'Lucro Presumido': 0.1133,     # Exemplo: Alíquota de 11.33% (PIS/COFINS/IRPJ/CSLL)
        'Lucro Real': 0.15            # Exemplo: Alíquota de 15% (simplificado)
    }

    taxa = taxas.get(regime_tributario, 0.0) # Retorna 0.0 se o regime não for encontrado
    return faturamento_total * taxa


def processar_arquivo_faturamento(arquivo, cliente_id: int, mes: int, ano: int):
    """
    Lê um arquivo CSV, calcula faturamento e impostos, e persiste no banco.
    """
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        raise ValueError("Cliente não encontrado")

    if Processamento.query.filter_by(cliente_id=cliente_id, mes=mes, ano=ano).first():
        raise ValueError(f"Faturamento para o cliente no período {mes}/{ano} já foi processado.")

    try:
        df = pd.read_csv(arquivo, sep=';', decimal=',', encoding='utf-8')
    except (pd.errors.ParserError, UnicodeDecodeError) as e:
        raise ValueError(f"Erro ao ler o CSV. Verifique o formato, separador (;) e codificação. Detalhe: {e}")

    colunas_esperadas = {'Valor', 'Descrição'}
    if not colunas_esperadas.issubset(df.columns):
        raise ValueError(f"O arquivo CSV deve conter as colunas: {', '.join(colunas_esperadas)}")

    faturamento_total = df['Valor'].sum()

    # Decide qual lógica de cálculo de imposto usar
    if cliente.regime_tributario == 'Simples Nacional':
        imposto_calculado = calcular_imposto_simples_nacional(
            cliente_id=cliente_id, mes_calculo=mes, ano_calculo=ano, faturamento_mes_atual=float(faturamento_total)
        )
    else:
        imposto_calculado = calcular_impostos(float(faturamento_total), cliente.regime_tributario)

    novo_processamento = Processamento(
        cliente_id=cliente_id,
        mes=mes,
        ano=ano,
        faturamento_total=faturamento_total,
        imposto_calculado=imposto_calculado,
        nome_arquivo_original=arquivo.filename
    )

    for _, row in df.iterrows():
        detalhe = FaturamentoDetalhe(
            processamento=novo_processamento,
            descricao_servico=row['Descrição'],
            valor=row['Valor']
        )
        db.session.add(detalhe)

    db.session.add(novo_processamento)
    # O commit será feito na rota após a chamada do serviço

    return novo_processamento


def gerar_relatorio_faturamento(filtros: dict):
    """
    Gera um relatório de faturamento consolidado com base nos filtros.
    """
    cliente_id = filtros.get('cliente_id')
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        raise ValueError("Cliente não encontrado.")

    query = db.session.query(
        func.sum(Processamento.faturamento_total).label('faturamento_total'),
        func.sum(Processamento.imposto_calculado).label('imposto_total')
    ).filter(Processamento.cliente_id == cliente_id)

    detalhamento_query = Processamento.query.filter(Processamento.cliente_id == cliente_id)

    tipo_filtro = filtros.get('tipo_filtro', 'ano')
    periodo_descricao = ""

    if tipo_filtro == 'ano':
        ano = filtros.get('ano', datetime.now().year)
        query = query.filter(Processamento.ano == ano)
        detalhamento_query = detalhamento_query.filter(Processamento.ano == ano)
        periodo_descricao = f"o ano de {ano}"
    elif tipo_filtro == 'mes':
        ano = filtros.get('ano', datetime.now().year)
        mes = filtros.get('mes', datetime.now().month)
        query = query.filter(Processamento.ano == ano, Processamento.mes == mes)
        detalhamento_query = detalhamento_query.filter(Processamento.ano == ano, Processamento.mes == mes)
        periodo_descricao = f"o mês {mes}/{ano}"
    elif tipo_filtro in ('ultimos_12_meses', 'ultimos_13_meses'):
        meses_atras = 11 if tipo_filtro == 'ultimos_12_meses' else 12
        data_inicio = datetime.now().replace(day=1) - relativedelta(months=meses_atras)
        query = query.filter(func.date(func.concat(Processamento.ano, '-', Processamento.mes, '-01')) >= data_inicio)
        detalhamento_query = detalhamento_query.filter(func.date(func.concat(Processamento.ano, '-', Processamento.mes, '-01')) >= data_inicio)
        periodo_descricao = f"os últimos {meses_atras + 1} meses"
    elif tipo_filtro == 'periodo':
        data_inicio = datetime.strptime(filtros['data_inicio'], '%Y-%m')
        data_fim = datetime.strptime(filtros['data_fim'], '%Y-%m')
        query = query.filter(func.date(func.concat(Processamento.ano, '-', Processamento.mes, '-01')).between(data_inicio, data_fim))
        detalhamento_query = detalhamento_query.filter(func.date(func.concat(Processamento.ano, '-', Processamento.mes, '-01')).between(data_inicio, data_fim))
        periodo_descricao = f"o período de {data_inicio.strftime('%m/%Y')} a {data_fim.strftime('%m/%Y')}"

    # Executa a query de agregação
    totais = query.first()
    detalhamento_mensal = detalhamento_query.order_by(Processamento.ano, Processamento.mes).all()

    if not detalhamento_mensal:
        return {
            "cliente": {"razao_social": cliente.razao_social, "cnpj": cliente.cnpj},
            "periodo_relatorio": periodo_descricao,
            "faturamento_total": float(totais.faturamento_total if totais and totais.faturamento_total else 0),
            "imposto_total": float(totais.imposto_total if totais and totais.imposto_total else 0),
            "detalhamento_mensal": [],
        }

    # Calcula o faturamento acumulado para cada mês no detalhamento
    detalhamento_com_acumulado = []
    for p in detalhamento_mensal:
        # Calcula o RBT12 para o mês 'p' (soma dos 12 meses anteriores)
        data_fim_periodo_rbt12 = datetime(p.ano, p.mes, 1) - relativedelta(days=1)
        data_inicio_periodo_rbt12 = data_fim_periodo_rbt12 - relativedelta(months=12) + relativedelta(days=1)
        fat_acum_12 = db.session.query(func.sum(Processamento.faturamento_total)).filter(
            Processamento.cliente_id == cliente_id,
            func.date(func.concat(Processamento.ano, '-', Processamento.mes, '-01')).between(
                data_inicio_periodo_rbt12.strftime('%Y-%m-01'),
                data_fim_periodo_rbt12.strftime('%Y-%m-01')
            )
        ).scalar() or 0.0

        detalhamento_com_acumulado.append({
            "mes": p.mes,
            "ano": p.ano,
            "faturamento_total": float(p.faturamento_total),
            "aliquota": (float(p.imposto_calculado) / float(p.faturamento_total)) if p.faturamento_total > 0 else 0,
            "imposto_calculado": float(p.imposto_calculado),
            "faturamento_acumulado": float(fat_acum_12)
        })

    relatorio = {
        "cliente": {"razao_social": cliente.razao_social, "cnpj": cliente.cnpj},
        "periodo_relatorio": periodo_descricao,
        "faturamento_total": float(totais.faturamento_total if totais and totais.faturamento_total else 0),
        "imposto_total": float(totais.imposto_total if totais and totais.imposto_total else 0),
        "detalhamento_mensal": detalhamento_com_acumulado,
    }
    return relatorio