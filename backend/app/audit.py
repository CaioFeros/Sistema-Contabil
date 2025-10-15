"""
Módulo de auditoria para registrar logs de ações dos usuários
"""
import json
from flask import request
from .models import db, LogAuditoria

def log_action(usuario_id, acao, entidade, entidade_id=None, detalhes=None, ip_address=None):
    """
    Registra uma ação no log de auditoria
    
    Args:
        usuario_id (int): ID do usuário que realizou a ação
        acao (str): Tipo de ação (CREATE, UPDATE, DELETE, LOGIN, etc.)
        entidade (str): Tipo de entidade afetada (CLIENTE, USUARIO, FATURAMENTO, etc.)
        entidade_id (int, optional): ID da entidade afetada
        detalhes (dict, optional): Detalhes adicionais da operação
        ip_address (str, optional): Endereço IP do usuário
    """
    try:
        # Se não foi fornecido IP, tenta pegar do request
        if ip_address is None and request:
            ip_address = request.remote_addr
        
        # Converte detalhes para JSON se for um dict
        detalhes_json = None
        if detalhes:
            if isinstance(detalhes, dict):
                detalhes_json = json.dumps(detalhes, ensure_ascii=False)
            else:
                detalhes_json = str(detalhes)
        
        log = LogAuditoria(
            usuario_id=usuario_id,
            acao=acao,
            entidade=entidade,
            entidade_id=entidade_id,
            detalhes=detalhes_json,
            ip_address=ip_address
        )
        
        db.session.add(log)
        db.session.commit()
        
    except Exception as e:
        # Se falhar ao registrar o log, não deve quebrar a operação principal
        print(f"Erro ao registrar log de auditoria: {e}")
        db.session.rollback()

def log_cliente_action(usuario_id, acao, cliente_id, cliente_nome, detalhes=None):
    """Log específico para ações em clientes"""
    log_details = {
        'cliente_nome': cliente_nome,
        **(detalhes or {})
    }
    log_action(usuario_id, acao, 'CLIENTE', cliente_id, log_details)

def log_usuario_action(usuario_id, acao, usuario_afetado_id, usuario_nome, detalhes=None):
    """Log específico para ações em usuários"""
    log_details = {
        'usuario_nome': usuario_nome,
        **(detalhes or {})
    }
    log_action(usuario_id, acao, 'USUARIO', usuario_afetado_id, log_details)

def log_faturamento_action(usuario_id, acao, processamento_id, cliente_nome, detalhes=None):
    """Log específico para ações em faturamento"""
    log_details = {
        'cliente_nome': cliente_nome,
        **(detalhes or {})
    }
    log_action(usuario_id, acao, 'FATURAMENTO', processamento_id, log_details)

def log_login(usuario_id, sucesso=True, motivo=None):
    """Log específico para login"""
    acao = 'LOGIN_SUCCESS' if sucesso else 'LOGIN_FAILED'
    detalhes = {}
    if motivo:
        detalhes['motivo'] = motivo
    
    log_action(usuario_id, acao, 'SISTEMA', detalhes=detalhes)
