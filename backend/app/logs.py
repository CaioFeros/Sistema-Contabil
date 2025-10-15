"""
Módulo para gerenciar logs de auditoria
"""
from flask import Blueprint, jsonify, request
from .models import db, LogAuditoria, Usuario
from .auth import token_required, admin_required

logs_bp = Blueprint('logs', __name__, url_prefix='/api/logs')

@logs_bp.route("/", methods=["GET"])
@token_required
@admin_required
def listar_logs(current_user):
    """Lista logs de auditoria com paginação e filtros"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    acao = request.args.get('acao')
    entidade = request.args.get('entidade')
    usuario_id = request.args.get('usuario_id', type=int)
    
    # Query base
    query = LogAuditoria.query
    
    # Aplicar filtros
    if acao:
        query = query.filter(LogAuditoria.acao == acao)
    if entidade:
        query = query.filter(LogAuditoria.entidade == entidade)
    if usuario_id:
        query = query.filter(LogAuditoria.usuario_id == usuario_id)
    
    # Ordenar por data mais recente primeiro
    query = query.order_by(LogAuditoria.data_acao.desc())
    
    # Paginação
    logs_paginados = query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    return jsonify({
        'logs': [log.to_dict() for log in logs_paginados.items],
        'total': logs_paginados.total,
        'pages': logs_paginados.pages,
        'current_page': page,
        'per_page': per_page,
        'has_next': logs_paginados.has_next,
        'has_prev': logs_paginados.has_prev
    })

@logs_bp.route("/acoes", methods=["GET"])
@token_required
@admin_required
def listar_acoes(current_user):
    """Lista todas as ações disponíveis nos logs"""
    acoes = db.session.query(LogAuditoria.acao).distinct().all()
    return jsonify([acao[0] for acao in acoes])

@logs_bp.route("/entidades", methods=["GET"])
@token_required
@admin_required
def listar_entidades(current_user):
    """Lista todas as entidades disponíveis nos logs"""
    entidades = db.session.query(LogAuditoria.entidade).distinct().all()
    return jsonify([entidade[0] for entidade in entidades])

@logs_bp.route("/estatisticas", methods=["GET"])
@token_required
@admin_required
def estatisticas_logs(current_user):
    """Retorna estatísticas dos logs"""
    from sqlalchemy import func, desc
    
    # Logs por ação
    logs_por_acao = db.session.query(
        LogAuditoria.acao, 
        func.count(LogAuditoria.id).label('total')
    ).group_by(LogAuditoria.acao).order_by(desc('total')).all()
    
    # Logs por entidade
    logs_por_entidade = db.session.query(
        LogAuditoria.entidade, 
        func.count(LogAuditoria.id).label('total')
    ).group_by(LogAuditoria.entidade).order_by(desc('total')).all()
    
    # Logs por usuário (últimos 30 dias)
    from datetime import datetime, timedelta
    data_limite = datetime.utcnow() - timedelta(days=30)
    
    logs_por_usuario = db.session.query(
        LogAuditoria.usuario_id,
        func.count(LogAuditoria.id).label('total')
    ).filter(LogAuditoria.data_acao >= data_limite).group_by(LogAuditoria.usuario_id).order_by(desc('total')).limit(10).all()
    
    # Buscar nomes dos usuários
    usuarios_ativos = {}
    for log in logs_por_usuario:
        usuario = Usuario.query.get(log[0])
        if usuario:
            usuarios_ativos[log[0]] = usuario.nome
    
    return jsonify({
        'logs_por_acao': [{'acao': acao, 'total': total} for acao, total in logs_por_acao],
        'logs_por_entidade': [{'entidade': entidade, 'total': total} for entidade, total in logs_por_entidade],
        'logs_por_usuario_30_dias': [
            {
                'usuario_id': user_id, 
                'usuario_nome': usuarios_ativos.get(user_id, 'Usuário Removido'), 
                'total': total
            } 
            for user_id, total in logs_por_usuario
        ]
    })
