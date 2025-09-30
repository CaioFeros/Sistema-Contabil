import pandas as pd
from flask import request, jsonify, Blueprint
from .models import db, Cliente, Processamento, FaturamentoDetalhe
from sqlalchemy import func
from datetime import datetime, timedelta
from .auth import token_required
from .services import calcular_impostos # 1. Importe a nova função

api_bp = Blueprint('api', __name__, url_prefix='/api') # Blueprint principal da API

@api_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Apenas para fins de teste e desenvolvimento.
    # Em produção, você buscaria o usuário no banco de dados e verificaria a senha.
    if username == "admin" and password == "admin":
        # Gera um token JWT com validade de 24 horas
        expires = datetime.utcnow() + timedelta(hours=24)
        token = jwt.encode({'user': username, 'exp': expires}, current_app.config['JWT_SECRET_KEY'], algorithm="HS256")
        return jsonify({'access_token': token}), 200
    else:
        return jsonify({"erro": "Credenciais inválidas"}), 401

# Importe jwt e current_app no topo do arquivo
from flask import current_app
import jwt

@api_bp.route("/clientes", methods=["POST"])
@token_required
def create_cliente(current_user):
    data = request.get_json()
    if not data or not data.get('razao_social') or not data.get('cnpj') or not data.get('regime_tributario'):
        return jsonify({"erro": "razao_social, cnpj e regime_tributario são obrigatórios"}), 400

    cnpj = data['cnpj']
    if Cliente.query.filter_by(cnpj=cnpj).first():
        return jsonify({"erro": f"Cliente com CNPJ {cnpj} já existe"}), 409

    novo_cliente = Cliente(
        razao_social=data['razao_social'],
        cnpj=cnpj,
        regime_tributario=data['regime_tributario']
    )

    db.session.add(novo_cliente)
    db.session.commit()

    return jsonify({
        "mensagem": "Cliente criado com sucesso!",
        "cliente": {
            "id": novo_cliente.id,
            "razao_social": novo_cliente.razao_social,
            "cnpj": novo_cliente.cnpj,
            "regime_tributario": novo_cliente.regime_tributario
        }
    }), 201

@api_bp.route("/clientes", methods=["GET"])
@token_required
def get_clientes(current_user):
    clientes = Cliente.query.all()
    resultado = [{"id": c.id, "razao_social": c.razao_social, "cnpj": c.cnpj, "regime_tributario": c.regime_tributario} for c in clientes]
    return jsonify(resultado)

@api_bp.route("/faturamento/processamentos", methods=["GET"])
@token_required
def get_processamentos(current_user):
    # Inicia a query base
    query = Processamento.query

    # Obtém os parâmetros de filtro da URL (ex: ?cliente_id=1&ano=2024)
    cliente_id = request.args.get('cliente_id')
    mes = request.args.get('mes')
    ano = request.args.get('ano')

    # Aplica os filtros se eles forem fornecidos
    if cliente_id:
        query = query.filter_by(cliente_id=cliente_id)
    if mes:
        query = query.filter_by(mes=mes)
    if ano:
        query = query.filter_by(ano=ano)

    # Ordena os resultados para uma visualização consistente
    processamentos = query.order_by(Processamento.ano.desc(), Processamento.mes.desc()).all()

    resultado = [{
        "id": p.id,
        "cliente_id": p.cliente_id,
        "razao_social_cliente": p.cliente.razao_social, # Adicionando o nome do cliente para clareza
        "mes": p.mes,
        "ano": p.ano,
        "faturamento_total": float(p.faturamento_total),
        "imposto_calculado": float(p.imposto_calculado),
        "data_processamento": p.data_processamento.isoformat()
    } for p in processamentos]

    return jsonify(resultado)

@api_bp.route("/relatorios/anual", methods=["GET"])
@token_required
def get_relatorio_anual(current_user):
    """
    Gera um relatório anual consolidado para um cliente específico.
    """
    # 1. Obter e validar parâmetros da requisição
    cliente_id = request.args.get('cliente_id')
    ano = request.args.get('ano')

    if not cliente_id or not ano:
        return jsonify({"erro": "Os parâmetros 'cliente_id' e 'ano' são obrigatórios."}), 400

    try:
        cliente_id_int = int(cliente_id)
        ano_int = int(ano)
    except ValueError:
        return jsonify({"erro": "'cliente_id' e 'ano' devem ser números inteiros."}), 400

    # 2. Buscar o cliente para obter seus dados
    cliente = Cliente.query.get(cliente_id_int)
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado."}), 404

    # 3. Buscar todos os processamentos do cliente para o ano especificado
    processamentos_ano = Processamento.query.filter_by(
        cliente_id=cliente_id_int,
        ano=ano_int
    ).order_by(Processamento.mes).all()

    if not processamentos_ano:
        return jsonify({"mensagem": f"Nenhum faturamento processado para o cliente {cliente.razao_social} em {ano_int}."}), 200

    # 4. Calcular totais anuais e detalhamento mensal
    faturamento_anual_total = sum(p.faturamento_total for p in processamentos_ano)
    imposto_anual_total = sum(p.imposto_calculado for p in processamentos_ano)

    detalhamento_mensal = [{
        "mes": p.mes,
        "faturamento_total": float(p.faturamento_total),
        "imposto_calculado": float(p.imposto_calculado)
    } for p in processamentos_ano]

    # 5. Consolidar os serviços prestados no ano (agrupando por descrição)
    ids_processamentos = [p.id for p in processamentos_ano]
    
    servicos_agrupados = db.session.query(
        FaturamentoDetalhe.descricao_servico,
        func.sum(FaturamentoDetalhe.valor).label('valor_total')
    ).filter(
        FaturamentoDetalhe.processamento_id.in_(ids_processamentos)
    ).group_by(
        FaturamentoDetalhe.descricao_servico
    ).order_by(func.sum(FaturamentoDetalhe.valor).desc()).all()

    # 6. Montar a resposta final
    relatorio = {
        "cliente": {"razao_social": cliente.razao_social, "cnpj": cliente.cnpj},
        "ano_relatorio": ano_int,
        "faturamento_anual_total": float(faturamento_anual_total),
        "imposto_anual_total": float(imposto_anual_total),
        "detalhamento_mensal": detalhamento_mensal,
        "detalhamento_servicos": [{"servico": s.descricao_servico, "valor_total": float(s.valor_total)} for s in servicos_agrupados]
    }

    return jsonify(relatorio)

@api_bp.route("/faturamento/processar", methods=["POST"])
@token_required
def processar_faturamento(current_user):
    # Validação dos dados do formulário
    if 'arquivo' not in request.files:
        return jsonify({"erro": "Nenhum arquivo enviado"}), 400
    
    arquivo = request.files['arquivo']
    cliente_id = request.form.get('cliente_id')
    mes = request.form.get('mes')
    ano = request.form.get('ano')

    if not all([cliente_id, mes, ano]):
        return jsonify({"erro": "cliente_id, mes e ano são obrigatórios"}), 400
    
    if arquivo.filename == '' or not arquivo.filename.endswith('.csv'):
        return jsonify({"erro": "Arquivo inválido ou não é um CSV"}), 400

    try:
        # Conversão e validação de tipos
        cliente_id_int = int(cliente_id)
        mes_int = int(mes)
        ano_int = int(ano)
    except (ValueError, TypeError):
        return jsonify({"erro": "cliente_id, mes e ano devem ser números inteiros válidos."}), 400

    # 2. Busque o cliente para obter o regime tributário
    cliente = Cliente.query.get(cliente_id_int)
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404

    # Validação de duplicidade
    if Processamento.query.filter_by(cliente_id=cliente_id_int, mes=mes_int, ano=ano_int).first():
        return jsonify({"erro": f"Faturamento para o cliente no período {mes_int}/{ano_int} já foi processado."}), 409

    try:
        # Lógica de negócio com Pandas
        try:
            df = pd.read_csv(arquivo, sep=';', decimal=',', encoding='utf-8') # Adicionado encoding
        except (pd.errors.ParserError, UnicodeDecodeError) as e:
            return jsonify({"erro": f"Erro ao ler o CSV. Verifique o formato, separador (;) e codificação (UTF-8). Detalhe: {str(e)}"}), 400
        
        # --- LÓGICA DE CÁLCULO ---
        # Exemplo simples:
        # Validar se as colunas esperadas existem
        colunas_esperadas = {'Valor', 'Descrição'}
        if not colunas_esperadas.issubset(df.columns):
            return jsonify({"erro": f"O arquivo CSV deve conter as colunas: {', '.join(colunas_esperadas)}"}), 400

        faturamento_total = df['Valor'].sum()
        # 3. Use a função de serviço para o cálculo
        imposto_calculado = calcular_impostos(faturamento_total, cliente.regime_tributario)
        # -------------------------

        # Persistência no banco de dados
        novo_processamento = Processamento(
            cliente_id=cliente_id_int,
            mes=mes_int,
            ano=ano_int,
            faturamento_total=faturamento_total,
            imposto_calculado=imposto_calculado,
            nome_arquivo_original=arquivo.filename
        )
        db.session.add(novo_processamento)
        
        # Itera sobre o DataFrame e cria os detalhes
        for index, row in df.iterrows():
            detalhe = FaturamentoDetalhe(
                processamento=novo_processamento, # Associa ao processamento pai
                descricao_servico=row['Descrição'],
                valor=row['Valor']
            )
            db.session.add(detalhe)

        db.session.commit()

        return jsonify({
            "status": "sucesso",
            "mensagem": "Faturamento processado com sucesso.",
            "faturamento_total": float(faturamento_total),
            "imposto_calculado": float(imposto_calculado)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Ocorreu um erro ao processar o arquivo: {str(e)}"}), 500
