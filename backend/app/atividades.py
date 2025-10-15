"""
Módulo para gerenciar histórico de atividades do sistema
"""
from flask import Blueprint, jsonify, request
from .models import db, LogAuditoria, Usuario, Cliente, Processamento, FaturamentoDetalhe
from .auth import token_required, admin_required
from .audit import log_action
from sqlalchemy import desc
import json

atividades_bp = Blueprint('atividades', __name__, url_prefix='/api/atividades')

@atividades_bp.route("/", methods=["GET"])
@token_required
@admin_required
def listar_atividades(current_user):
    """Retorna o histórico de atividades relevantes (CLIENTE e FATURAMENTO)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Filtros opcionais
    tipo = request.args.get('tipo')  # CLIENTE ou FATURAMENTO
    usuario_id = request.args.get('usuario_id', type=int)
    
    # Query base - apenas CREATE e DELETE de CLIENTE e FATURAMENTO
    query = LogAuditoria.query.filter(
        LogAuditoria.entidade.in_(['CLIENTE', 'FATURAMENTO']),
        LogAuditoria.acao.in_(['CREATE', 'DELETE'])
    ).order_by(desc(LogAuditoria.data_acao))
    
    if tipo:
        query = query.filter_by(entidade=tipo)
    if usuario_id:
        query = query.filter_by(usuario_id=usuario_id)
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Formatar atividades
    atividades = []
    for log in pagination.items:
        atividade = log.to_dict()
        
        # Adicionar informações específicas baseadas no tipo
        detalhes = json.loads(log.detalhes) if log.detalhes else {}
        
        # Formatar descrição amigável
        if log.entidade == 'CLIENTE':
            if log.acao == 'CREATE':
                atividade['descricao'] = f"Cadastrou cliente: {detalhes.get('razao_social', 'N/A')}"
                atividade['pode_desfazer'] = True
            elif log.acao == 'DELETE':
                atividade['descricao'] = f"Excluiu cliente: {detalhes.get('razao_social', 'N/A')}"
                atividade['pode_desfazer'] = False  # Não pode restaurar cliente excluído
        
        elif log.entidade == 'FATURAMENTO':
            if log.acao == 'CREATE':
                cliente_nome = detalhes.get('cliente_nome', 'N/A')
                mes = detalhes.get('mes', 'N/A')
                ano = detalhes.get('ano', 'N/A')
                atividade['descricao'] = f"Importou competência {mes}/{ano} da empresa {cliente_nome}"
                atividade['pode_desfazer'] = True
            elif log.acao == 'DELETE':
                cliente_nome = detalhes.get('cliente_nome', 'N/A')
                mes = detalhes.get('mes', 'N/A')
                ano = detalhes.get('ano', 'N/A')
                atividade['descricao'] = f"Excluiu competência {mes}/{ano} da empresa {cliente_nome}"
                atividade['pode_desfazer'] = False
        
        atividades.append(atividade)
    
    return jsonify({
        'atividades': atividades,
        'total': pagination.total,
        'total_pages': pagination.pages,
        'current_page': pagination.page
    })


@atividades_bp.route("/<int:log_id>/desfazer", methods=["POST"])
@token_required
@admin_required
def desfazer_atividade(current_user, log_id):
    """Desfaz uma atividade específica"""
    log = LogAuditoria.query.get(log_id)
    
    if not log:
        return jsonify({"erro": "Atividade não encontrada"}), 404
    
    # Verificar se pode desfazer
    if log.acao != 'CREATE':
        return jsonify({"erro": "Apenas criações podem ser desfeitas"}), 400
    
    try:
        detalhes = json.loads(log.detalhes) if log.detalhes else {}
        
        # Desfazer criação de cliente
        if log.entidade == 'CLIENTE' and log.entidade_id:
            cliente = Cliente.query.get(log.entidade_id)
            if not cliente:
                return jsonify({"erro": "Cliente já foi removido"}), 404
            
            # Verificar se cliente tem faturamentos
            faturamentos = Processamento.query.filter_by(cliente_id=cliente.id).count()
            if faturamentos > 0:
                return jsonify({
                    "erro": f"Não é possível excluir. Cliente possui {faturamentos} faturamento(s) importado(s)."
                }), 400
            
            # Salvar dados para o log
            dados_cliente = {
                'razao_social': cliente.razao_social,
                'cnpj': cliente.cnpj,
                'regime_tributario': cliente.regime_tributario
            }
            
            # Excluir cliente
            db.session.delete(cliente)
            db.session.commit()
            
            # Registrar log de exclusão
            log_action(current_user.id, 'DELETE', 'CLIENTE', log.entidade_id, {
                **dados_cliente,
                'motivo': 'Desfeita operação de cadastro',
                'log_original_id': log_id
            })
            
            return jsonify({
                "mensagem": "Cliente excluído com sucesso",
                "tipo": "CLIENTE"
            })
        
        # Desfazer importação de faturamento
        elif log.entidade == 'FATURAMENTO' and log.entidade_id:
            processamento = Processamento.query.get(log.entidade_id)
            if not processamento:
                return jsonify({"erro": "Faturamento já foi removido"}), 404
            
            # Salvar dados para o log
            dados_faturamento = {
                'cliente_id': processamento.cliente_id,
                'cliente_nome': processamento.cliente.razao_social if processamento.cliente else 'N/A',
                'mes': processamento.mes,
                'ano': processamento.ano,
                'total_notas': processamento.total_notas
            }
            
            # Excluir detalhes primeiro (relacionamento)
            FaturamentoDetalhe.query.filter_by(processamento_id=processamento.id).delete()
            
            # Excluir processamento
            db.session.delete(processamento)
            db.session.commit()
            
            # Registrar log de exclusão
            log_action(current_user.id, 'DELETE', 'FATURAMENTO', log.entidade_id, {
                **dados_faturamento,
                'motivo': 'Desfeita operação de importação',
                'log_original_id': log_id
            })
            
            return jsonify({
                "mensagem": f"Faturamento {dados_faturamento['mes']}/{dados_faturamento['ano']} excluído com sucesso",
                "tipo": "FATURAMENTO"
            })
        
        else:
            return jsonify({"erro": "Tipo de atividade não suportado para desfazer"}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Erro ao desfazer atividade: {str(e)}"}), 500


@atividades_bp.route("/usuarios", methods=["GET"])
@token_required
@admin_required
def listar_usuarios_atividades(current_user):
    """Retorna lista de usuários que realizaram atividades"""
    usuarios = db.session.query(Usuario).join(
        LogAuditoria, Usuario.id == LogAuditoria.usuario_id
    ).filter(
        LogAuditoria.entidade.in_(['CLIENTE', 'FATURAMENTO']),
        LogAuditoria.acao.in_(['CREATE', 'DELETE'])
    ).distinct().all()
    
    return jsonify([{
        'id': u.id,
        'nome': u.nome,
        'username': u.username
    } for u in usuarios])

