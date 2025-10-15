# d:\Dev\Sistema-Contabil\backend\app\services.py

import pandas as pd
from decimal import Decimal
from datetime import datetime, timedelta
from .models import db, Cliente, Processamento, FaturamentoDetalhe
from sqlalchemy import func, and_, or_

def _filtro_periodo(ano_col, mes_col, data_inicial, data_final):
    """
    Cria um filtro de período compatível com SQLite e PostgreSQL.
    Compara ano e mês separadamente ao invés de usar make_date.
    """
    ano_inicial = data_inicial.year
    mes_inicial = data_inicial.month
    ano_final = data_final.year
    mes_final = data_final.month
    
    # Caso simples: mesmo ano
    if ano_inicial == ano_final:
        return and_(
            ano_col == ano_inicial,
            mes_col >= mes_inicial,
            mes_col <= mes_final
        )
    
    # Caso complexo: anos diferentes
    return or_(
        and_(ano_col == ano_inicial, mes_col >= mes_inicial),
        and_(ano_col > ano_inicial, ano_col < ano_final),
        and_(ano_col == ano_final, mes_col <= mes_final)
    )

def calcular_impostos(faturamento, regime_tributario):
    """Calcula o imposto com base no regime tributário (simplificado)."""
    if regime_tributario == 'Lucro Presumido':
        return faturamento * 0.1633  # Exemplo de alíquota
    elif regime_tributario == 'Lucro Real':
        return faturamento * 0.34  # Exemplo de alíquota
    return 0

def calcular_imposto_simples_nacional(cliente_id, mes_calculo, ano_calculo, faturamento_mes_atual, rbt12_fornecido=None):
    """
    Calcula o imposto do Simples Nacional com base na receita bruta dos últimos 12 meses (RBT12).
    Pode receber um RBT12 pré-calculado para cenários específicos (como cálculo de alíquota futura).
    """
    if rbt12_fornecido is not None:
        rbt12 = Decimal(rbt12_fornecido)
    else:
        # 1. Definir o período de 12 meses anteriores se não for fornecido
        # data_final é o último dia do mês anterior ao mês de cálculo.
        data_final = datetime(ano_calculo, mes_calculo, 1) - timedelta(days=1)
        
        # data_inicial é o primeiro dia do mesmo mês, mas no ano anterior.
        # Evita usar replace(year=) para não ter problemas com anos bissextos (29 fev)
        ano_inicial_calc = ano_calculo - 1
        mes_inicial_calc = mes_calculo
        data_inicial = datetime(ano_inicial_calc, mes_inicial_calc, 1)

        # 2. Consultar o faturamento acumulado (RBT12)
        resultado = db.session.query(
            func.sum(Processamento.faturamento_total)
        ).filter(
            Processamento.cliente_id == cliente_id,
            _filtro_periodo(Processamento.ano, Processamento.mes, data_inicial, data_final)
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
    tipo_filtro = params.get('tipo_filtro')
    ano = params.get('ano')
    mes = params.get('mes')
    data_inicio_str = params.get('data_inicio')
    data_fim_str = params.get('data_fim')

    # Seleciona o escopo conforme o tipo de filtro
    query = Processamento.query.filter(Processamento.cliente_id == cliente_id)

    # Lógica de filtragem por período
    if tipo_filtro == 'mes' and ano is not None and mes is not None:
        query = query.filter(
            Processamento.ano == ano,
            Processamento.mes == mes
        )
    elif tipo_filtro in ['ultimos_12_meses', 'ultimos_13_meses']:
        num_meses = 13 if tipo_filtro == 'ultimos_12_meses' else 14
        hoje = datetime.today()
        # O período começa no primeiro dia de N-1 meses atrás
        # Ex: hoje é 15/07/2024, ultimos 12 meses começa em 01/08/2023
        data_inicial = (hoje.replace(day=1) - timedelta(days=1)).replace(day=1) # Vai para o último dia do mês anterior, depois para o primeiro dia
        for _ in range(num_meses - 1):
            data_inicial = (data_inicial - timedelta(days=1)).replace(day=1)
        
        # O período termina no último dia do mês passado
        data_final = hoje.replace(day=1) - timedelta(days=1)

        query = query.filter(
            _filtro_periodo(Processamento.ano, Processamento.mes, data_inicial, data_final)
        )
    elif tipo_filtro == 'periodo' and data_inicio_str and data_fim_str:
        try:
            # Converte as strings YYYY-MM para objetos datetime
            data_inicio_dt = datetime.strptime(data_inicio_str, '%Y-%m')
            data_fim_dt = datetime.strptime(data_fim_str, '%Y-%m')
            
            # data_inicio é o primeiro dia do mês
            data_inicio = data_inicio_dt.date()
            
            # data_fim é o último dia do mês
            # Vai para o primeiro dia do próximo mês e subtrai 1 dia
            if data_fim_dt.month == 12:
                primeiro_dia_prox_mes = datetime(data_fim_dt.year + 1, 1, 1)
            else:
                primeiro_dia_prox_mes = datetime(data_fim_dt.year, data_fim_dt.month + 1, 1)
            data_fim = (primeiro_dia_prox_mes - timedelta(days=1))
            
            query = query.filter(
                _filtro_periodo(Processamento.ano, Processamento.mes, data_inicio, data_fim)
            )
        except ValueError:
            raise ValueError("Formato de data inválido para o período. Use YYYY-MM.")
    elif ano is not None:
        query = query.filter(Processamento.ano == ano)

    # Ordena cronologicamente
    processamentos = query.order_by(Processamento.ano, Processamento.mes).all()

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
        # data_final é o último dia do mês anterior ao mês do processamento
        data_final_rbt12 = datetime(p.ano, p.mes, 1) - timedelta(days=1)
        
        # data_inicial é o primeiro dia do mesmo mês, mas 12 meses antes
        # Evita usar replace(year=) para não ter problemas com anos bissextos (29 fev)
        # Exemplo: março/2024 -> calcula de março/2023 até fev/2024
        ano_inicial_rbt12 = p.ano - 1
        mes_inicial_rbt12 = p.mes
        data_inicial_rbt12 = datetime(ano_inicial_rbt12, mes_inicial_rbt12, 1)
        rbt12_query_result = db.session.query(
            func.sum(Processamento.faturamento_total)
        ).filter(
            Processamento.cliente_id == cliente_id,
            _filtro_periodo(Processamento.ano, Processamento.mes, data_inicial_rbt12, data_final_rbt12)
        ).scalar()
        rbt12 = Decimal(rbt12_query_result or 0)

        # Cálculo da alíquota efetiva para o mês p
        # IMPORTANTE: Não usar p.imposto_calculado pois ele foi calculado na época do processamento
        # com um RBT12 diferente. Precisamos recalcular baseado no RBT12 atual.
        aliquota_efetiva = Decimal(0)
        if rbt12 > 0:
            # Definir as faixas de alíquota do Anexo III (mesmo que em calcular_imposto_simples_nacional)
            faixas_sn = [
                {"limite": Decimal("180000.00"), "aliquota": Decimal("0.06"), "deducao": Decimal("0")},
                {"limite": Decimal("360000.00"), "aliquota": Decimal("0.112"), "deducao": Decimal("9360.00")},
                {"limite": Decimal("720000.00"), "aliquota": Decimal("0.135"), "deducao": Decimal("17640.00")},
                {"limite": Decimal("1800000.00"), "aliquota": Decimal("0.16"), "deducao": Decimal("35640.00")},
                {"limite": Decimal("3600000.00"), "aliquota": Decimal("0.21"), "deducao": Decimal("125640.00")},
                {"limite": Decimal("4800000.00"), "aliquota": Decimal("0.33"), "deducao": Decimal("648000.00")}
            ]
            
            # Encontrar a faixa correta e calcular a alíquota efetiva
            for faixa in faixas_sn:
                if rbt12 <= faixa["limite"]:
                    aliquota_nominal = faixa["aliquota"]
                    parcela_a_deduzir = faixa["deducao"]
                    aliquota_efetiva = ((rbt12 * aliquota_nominal) - parcela_a_deduzir) / rbt12
                    break
            else: # Se RBT12 for maior que o limite máximo
                ultima_faixa = faixas_sn[-1]
                aliquota_efetiva = ((rbt12 * ultima_faixa["aliquota"]) - ultima_faixa["deducao"]) / rbt12
        else:
            # Se não houver faturamento anterior, usa a alíquota da primeira faixa
            aliquota_efetiva = Decimal("0.06")

        # --- CÁLCULO DA ALÍQUOTA FUTURA ---
        # O RBT12 para o próximo mês inclui o faturamento do mês atual.
        # Período: 11 meses anteriores + mês atual.
        
        # data_final_futura é o último dia do mês atual do processamento
        if p.mes == 12:
            primeiro_dia_prox_mes_fut = datetime(p.ano + 1, 1, 1)
        else:
            primeiro_dia_prox_mes_fut = datetime(p.ano, p.mes + 1, 1)
        data_final_futura = primeiro_dia_prox_mes_fut - timedelta(days=1)
        
        # data_inicial_futura é o primeiro dia de 11 meses antes do mês atual
        # Exemplo: março/2024 (mês 3) -> de abril/2023 (mês 4) até março/2024 = 12 meses
        # Cálculo: março + 1 = abril, ano - 1 = 2023
        if p.mes < 12:
            ano_inicial_fut = p.ano - 1
            mes_inicial_fut = p.mes + 1
        else:  # Dezembro
            ano_inicial_fut = p.ano
            mes_inicial_fut = 1
        data_inicial_futura = datetime(ano_inicial_fut, mes_inicial_fut, 1)

        rbt12_futuro_result = db.session.query(
            func.sum(Processamento.faturamento_total)
        ).filter(
            Processamento.cliente_id == cliente_id,
            _filtro_periodo(Processamento.ano, Processamento.mes, data_inicial_futura, data_final_futura)
        ).scalar()
        rbt12_futuro = Decimal(rbt12_futuro_result or 0)

        # --- CÁLCULO DA ALÍQUOTA FUTURA (LÓGICA DEDICADA) ---
        faixas_sn = [
            {"limite": Decimal("180000.00"), "aliquota": Decimal("0.06"), "deducao": Decimal("0")},
            {"limite": Decimal("360000.00"), "aliquota": Decimal("0.112"), "deducao": Decimal("9360.00")},
            {"limite": Decimal("720000.00"), "aliquota": Decimal("0.135"), "deducao": Decimal("17640.00")},
            {"limite": Decimal("1800000.00"), "aliquota": Decimal("0.16"), "deducao": Decimal("35640.00")},
            {"limite": Decimal("3600000.00"), "aliquota": Decimal("0.21"), "deducao": Decimal("125640.00")},
            {"limite": Decimal("4800000.00"), "aliquota": Decimal("0.33"), "deducao": Decimal("648000.00")}
        ]

        aliquota_futura = Decimal("0.06") # Alíquota mínima
        for faixa in faixas_sn:
            if rbt12_futuro <= faixa["limite"]:
                aliquota_nominal = faixa["aliquota"]
                parcela_a_deduzir = faixa["deducao"]
                if rbt12_futuro > 0:
                    aliquota_futura = ((rbt12_futuro * aliquota_nominal) - parcela_a_deduzir) / rbt12_futuro
                else:
                    aliquota_futura = faixas_sn[0]['aliquota']
                break
        else: # Se RBT12 for maior que o limite máximo
            ultima_faixa = faixas_sn[-1]
            aliquota_futura = ((rbt12_futuro * ultima_faixa["aliquota"]) - ultima_faixa["deducao"]) / rbt12_futuro


        # Calcula o Fator R
        # Fator R = (RBT12 / 12) * 0.28
        media_mensal_12m = rbt12 / Decimal('12') if rbt12 > 0 else Decimal('0')
        fator_r = media_mensal_12m * Decimal('0.28')
        
        detalhamento_mensal.append({
            'mes': p.mes,
            'ano': p.ano,
            'faturamento_total': p.faturamento_total,
            'faturamento_acumulado': rbt12,
            'fator_r': fator_r,
            'aliquota': aliquota_efetiva,
            'aliquota_futura': aliquota_futura,
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
    response = {
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

    # Quando o filtro for mensal, incluir histórico de 13 meses e notas fiscais do mês
    if tipo_filtro == 'mes' and ano is not None and mes is not None:
        # Monta a lista de (ano, mes) para os últimos 13 meses incluindo o mês selecionado
        meses_anos = []
        data_ref = datetime(int(ano), int(mes), 1)
        for i in range(12, -1, -1):  # 13 meses (12 atrás até o atual)
            ref = (data_ref.replace(day=1) - timedelta(days=1)).replace(day=1)
            # Ajusta voltando i passos a partir do mês selecionado
        
        # Recalcula corretamente a sequência
        meses_anos = []
        ano_atual = int(ano)
        mes_atual = int(mes)
        for i in range(12, -1, -1):
            a = ano_atual
            m = mes_atual - (12 - i)
            while m <= 0:
                m += 12
                a -= 1
            meses_anos.append((a, m))

        # Busca os processamentos desses 13 meses
        proc_13m = (
            db.session.query(Processamento)
            .filter(
                Processamento.cliente_id == cliente_id,
                db.tuple_(Processamento.ano, Processamento.mes).in_(meses_anos)
            )
            .all()
        )

        # Indexa por (ano, mes) para preservar ordem de meses_anos
        chave = {(p.ano, p.mes): p for p in proc_13m}

        meses_hist = [f"{m:02d}/{a}" for (a, m) in meses_anos]
        fatur_hist = []
        imposto_hist = []
        aliq_hist = []
        for (a, m) in meses_anos:
            p = chave.get((a, m))
            if p is None:
                fatur_hist.append(0)
                imposto_hist.append(0)
                aliq_hist.append(0)
            else:
                fatur_hist.append(float(p.faturamento_total))
                imposto_hist.append(float(p.imposto_calculado))
                if p.faturamento_total and float(p.faturamento_total) > 0:
                    aliq_hist.append(float(p.imposto_calculado) / float(p.faturamento_total))
                else:
                    aliq_hist.append(0)

        response['historico_13_meses'] = {
            'meses': meses_hist,
            'faturamento': fatur_hist,
            'imposto': imposto_hist,
            'aliquotas': aliq_hist,
        }

        # Notas fiscais (detalhes) do mês selecionado
        proc_mes = db.session.query(Processamento).filter(
            Processamento.cliente_id == cliente_id,
            Processamento.ano == ano,
            Processamento.mes == mes
        ).first()

        if proc_mes:
            response['notas_fiscais_mes'] = [
                {
                    'descricao_servico': d.descricao_servico,
                    'valor': float(d.valor),
                }
                for d in proc_mes.detalhes
            ]
        else:
            response['notas_fiscais_mes'] = []

    return response
