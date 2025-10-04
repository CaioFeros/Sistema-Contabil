import pandas as pd
from flask import request, jsonify, Blueprint, current_app
import jwt
from datetime import datetime
from .models import db, Cliente, Processamento, FaturamentoDetalhe
from sqlalchemy.orm import joinedload
from .auth import token_required
from .services import processar_arquivo_faturamento, gerar_relatorio_faturamento

api_bp = Blueprint('api', __name__, url_prefix='/api') # Blueprint principal da API

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
    # Otimização: usa joinedload para evitar o problema N+1
    query = Processamento.query.options(joinedload(Processamento.cliente))
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

@api_bp.route("/relatorios/faturamento", methods=["GET"])
@token_required
def get_relatorio_faturamento(current_user):
    """
    Gera um relatório de faturamento consolidado para um cliente com base em diferentes filtros de período.
    Filtros possíveis: 'ano', 'mes', 'periodo', 'ultimos_12_meses'.
    """
    try:
        # Validação básica dos parâmetros de entrada
        if not request.args.get('cliente_id'):
            return jsonify({"erro": "O parâmetro 'cliente_id' é obrigatório."}), 400

        # Delega a lógica de geração do relatório para a camada de serviço
        relatorio = gerar_relatorio_faturamento(request.args.to_dict())

        if relatorio is None:
            return jsonify({"mensagem": "Nenhum faturamento processado para o período e cliente selecionados."}), 200

        return jsonify(relatorio)

    except ValueError as e:
        # Captura erros de validação da camada de serviço (ex: cliente não encontrado, data inválida)
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        # Captura erros inesperados
        current_app.logger.error(f"Erro inesperado ao gerar relatório: {e}")
        return jsonify({"erro": "Ocorreu um erro interno ao gerar o relatório."}), 500

@api_bp.route("/faturamento/processar", methods=["POST"])
@token_required
def processar_faturamento(current_user):
    try:
        # Validação inicial da requisição
        if 'arquivo' not in request.files:
            return jsonify({"erro": "Nenhum arquivo enviado"}), 400
        arquivo = request.files['arquivo']
        if arquivo.filename == '' or not arquivo.filename.endswith('.csv'):
            return jsonify({"erro": "Arquivo inválido ou não é um CSV"}), 400

        cliente_id = request.form.get('cliente_id')
        mes = request.form.get('mes')
        ano = request.form.get('ano')
        if not all([cliente_id, mes, ano]):
            return jsonify({"erro": "cliente_id, mes e ano são obrigatórios"}), 400

        # Delega o processamento para a camada de serviço
        novo_processamento = processar_arquivo_faturamento(
            arquivo=arquivo,
            cliente_id=int(cliente_id),
            mes=int(mes),
            ano=int(ano)
        )
        db.session.commit()

        return jsonify({
            "status": "sucesso",
            "mensagem": "Faturamento processado com sucesso.",
            "faturamento_total": float(novo_processamento.faturamento_total),
            "imposto_calculado": float(novo_processamento.imposto_calculado)
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 400 # Erros de negócio (cliente não existe, CSV inválido, etc.)
    except (TypeError, KeyError) as e:
        db.session.rollback()
        return jsonify({"erro": f"Dados de formulário inválidos ou ausentes: {e}"}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro inesperado ao processar faturamento: {e}")
        return jsonify({"erro": "Ocorreu um erro interno ao processar o arquivo."}), 500
