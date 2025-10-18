"""
Módulo para gerenciar histórico de atividades do sistema
"""
from flask import Blueprint, jsonify, request
from .models import db, LogAuditoria, Usuario, Cliente, Processamento, FaturamentoDetalhe, ItemExcluido
from .auth import token_required, admin_required
from .audit import log_action
from .lixeira import restaurar_da_lixeira
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
                # Verificar se existe na lixeira e não foi restaurado
                item_lixeira = ItemExcluido.query.filter_by(
                    tipo_entidade='CLIENTE',
                    entidade_id_original=log.entidade_id,
                    restaurado=False
                ).first()
                atividade['pode_desfazer'] = item_lixeira is not None
                if item_lixeira:
                    atividade['item_lixeira_id'] = item_lixeira.id
        
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
                # Verificar se existe na lixeira e não foi restaurado
                item_lixeira = ItemExcluido.query.filter_by(
                    tipo_entidade='PROCESSAMENTO',
                    entidade_id_original=log.entidade_id,
                    restaurado=False
                ).first()
                atividade['pode_desfazer'] = item_lixeira is not None
                if item_lixeira:
                    atividade['item_lixeira_id'] = item_lixeira.id
        
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
    """
    Desfaz uma atividade específica:
    - CREATE: Exclui o item criado (salva na lixeira)
    - DELETE: Restaura o item da lixeira
    """
    log = LogAuditoria.query.get(log_id)
    
    if not log:
        return jsonify({"erro": "Atividade não encontrada"}), 404
    
    # Verificar se pode desfazer
    if log.acao not in ['CREATE', 'DELETE']:
        return jsonify({"erro": "Apenas criações e exclusões podem ser desfeitas"}), 400
    
    try:
        detalhes = json.loads(log.detalhes) if log.detalhes else {}
        
        # ============ DESFAZER CRIAÇÃO (EXCLUIR ITEM) ============
        if log.acao == 'CREATE':
            return desfazer_create(log, current_user, detalhes)
        
        # ============ DESFAZER EXCLUSÃO (RESTAURAR DA LIXEIRA) ============
        elif log.acao == 'DELETE':
            return desfazer_delete(log, current_user, detalhes)
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Erro ao desfazer atividade: {str(e)}"}), 500


def desfazer_create(log, current_user, detalhes):
    """Desfaz uma criação (exclui o item criado e salva na lixeira)"""
    from .lixeira import salvar_na_lixeira
    
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
        
        # Salvar na lixeira antes de excluir
        salvar_na_lixeira('CLIENTE', cliente, current_user.id, 'Desfeita operação de cadastro')
        
        # Excluir cliente
        db.session.delete(cliente)
        db.session.commit()
        
        # Registrar log de exclusão
        log_action(current_user.id, 'DELETE', 'CLIENTE', log.entidade_id, {
            **dados_cliente,
            'motivo': 'Desfeita operação de cadastro',
            'log_original_id': log.id
        })
        
        return jsonify({
            "mensagem": "Cliente excluído com sucesso (salvo na lixeira)",
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
            'ano': processamento.ano
        }
        
        # Salvar na lixeira antes de excluir
        salvar_na_lixeira('PROCESSAMENTO', processamento, current_user.id, 'Desfeita operação de importação')
        
        # Excluir detalhes primeiro (relacionamento)
        FaturamentoDetalhe.query.filter_by(processamento_id=processamento.id).delete()
        
        # Excluir processamento
        db.session.delete(processamento)
        db.session.commit()
        
        # Registrar log de exclusão
        log_action(current_user.id, 'DELETE', 'FATURAMENTO', log.entidade_id, {
            **dados_faturamento,
            'motivo': 'Desfeita operação de importação',
            'log_original_id': log.id
        })
        
        return jsonify({
            "mensagem": f"Faturamento {dados_faturamento['mes']}/{dados_faturamento['ano']} excluído com sucesso (salvo na lixeira)",
            "tipo": "FATURAMENTO"
        })
    
    else:
        return jsonify({"erro": "Tipo de atividade não suportado para desfazer"}), 400


def desfazer_delete(log, current_user, detalhes):
    """Desfaz uma exclusão (restaura item da lixeira)"""
    # Buscar item na lixeira
    tipo_map = {
        'CLIENTE': 'CLIENTE',
        'FATURAMENTO': 'PROCESSAMENTO'  # No banco é salvo como PROCESSAMENTO
    }
    
    tipo_lixeira = tipo_map.get(log.entidade, log.entidade)
    
    item_lixeira = ItemExcluido.query.filter_by(
        tipo_entidade=tipo_lixeira,
        entidade_id_original=log.entidade_id,
        restaurado=False
    ).first()
    
    if not item_lixeira:
        return jsonify({"erro": "Item não encontrado na lixeira ou já foi restaurado"}), 404
    
    # Restaurar da lixeira
    sucesso, mensagem, obj_restaurado = restaurar_da_lixeira(item_lixeira.id, current_user.id)
    
    if not sucesso:
        return jsonify({"erro": mensagem}), 400
    
    # Registrar log de criação (item foi restaurado)
    if log.entidade == 'CLIENTE':
        log_action(current_user.id, 'CREATE', 'CLIENTE', obj_restaurado.id, {
            'razao_social': obj_restaurado.razao_social,
            'cnpj': obj_restaurado.cnpj,
            'regime_tributario': obj_restaurado.regime_tributario,
            'motivo': 'Restaurado da lixeira (exclusão desfeita)',
            'log_original_id': log.id
        })
    elif log.entidade == 'FATURAMENTO':
        log_action(current_user.id, 'CREATE', 'FATURAMENTO', obj_restaurado.id, {
            'cliente_id': obj_restaurado.cliente_id,
            'cliente_nome': obj_restaurado.cliente.razao_social if obj_restaurado.cliente else 'N/A',
            'mes': obj_restaurado.mes,
            'ano': obj_restaurado.ano,
            'motivo': 'Restaurado da lixeira (exclusão desfeita)',
            'log_original_id': log.id
        })
    
    return jsonify({
        "mensagem": mensagem,
        "tipo": log.entidade
    })


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


@atividades_bp.route("/estatisticas", methods=["GET"])
@token_required
@admin_required
def obter_estatisticas(current_user):
    """Retorna estatísticas sobre o banco de dados e lixeira"""
    import os
    from flask import current_app
    
    # Obter caminho do banco de dados
    database_uri = current_app.config['SQLALCHEMY_DATABASE_URI']
    if database_uri.startswith('sqlite:///'):
        db_path = database_uri.replace('sqlite:///', '')
        
        # Tamanho do banco de dados
        tamanho_banco = 0
        if os.path.exists(db_path):
            tamanho_banco = os.path.getsize(db_path)
        
        # Estatísticas da lixeira
        total_itens_lixeira = ItemExcluido.query.count()
        itens_nao_restaurados = ItemExcluido.query.filter_by(restaurado=False).count()
        itens_restaurados = ItemExcluido.query.filter_by(restaurado=True).count()
        
        # Calcular tamanho estimado dos dados JSON na lixeira
        itens = ItemExcluido.query.all()
        tamanho_backup = sum(len(item.dados_json.encode('utf-8')) for item in itens) if itens else 0
        
        # Estatísticas por tipo de entidade
        stats_por_tipo = db.session.query(
            ItemExcluido.tipo_entidade,
            db.func.count(ItemExcluido.id).label('total'),
            db.func.sum(db.case((ItemExcluido.restaurado == False, 1), else_=0)).label('nao_restaurados')
        ).group_by(ItemExcluido.tipo_entidade).all()
        
        tipos_entidade = [{
            'tipo': stat[0],
            'total': stat[1],
            'nao_restaurados': stat[2]
        } for stat in stats_por_tipo]
        
        return jsonify({
            'tamanho_banco_bytes': tamanho_banco,
            'tamanho_banco_mb': round(tamanho_banco / (1024 * 1024), 2),
            'tamanho_backup_bytes': tamanho_backup,
            'tamanho_backup_mb': round(tamanho_backup / (1024 * 1024), 2),
            'tamanho_backup_kb': round(tamanho_backup / 1024, 2),
            'total_itens_lixeira': total_itens_lixeira,
            'itens_nao_restaurados': itens_nao_restaurados,
            'itens_restaurados': itens_restaurados,
            'tipos_entidade': tipos_entidade,
            'caminho_banco': db_path
        })
    else:
        return jsonify({'erro': 'Apenas SQLite é suportado para esta funcionalidade'}), 400


@atividades_bp.route("/limpar-lixeira", methods=["POST"])
@token_required
@admin_required
def limpar_lixeira(current_user):
    """
    Limpa a lixeira removendo itens restaurados ou todos os itens
    """
    data = request.get_json() or {}
    tipo = data.get('tipo', 'restaurados')  # 'restaurados' ou 'todos'
    
    try:
        if tipo == 'restaurados':
            # Remove apenas itens já restaurados
            itens = ItemExcluido.query.filter_by(restaurado=True).all()
            count = len(itens)
            
            for item in itens:
                db.session.delete(item)
            
            db.session.commit()
            
            # Registrar ação
            log_action(current_user.id, 'DELETE', 'SISTEMA', None, {
                'acao': 'Limpeza da lixeira (itens restaurados)',
                'quantidade': count
            })
            
            return jsonify({
                'mensagem': f'{count} item(ns) restaurado(s) removido(s) da lixeira',
                'quantidade': count
            })
        
        elif tipo == 'todos':
            # Remove todos os itens da lixeira
            count = ItemExcluido.query.count()
            ItemExcluido.query.delete()
            db.session.commit()
            
            # Registrar ação
            log_action(current_user.id, 'DELETE', 'SISTEMA', None, {
                'acao': 'Limpeza completa da lixeira',
                'quantidade': count
            })
            
            return jsonify({
                'mensagem': f'Lixeira limpa! {count} item(ns) removido(s)',
                'quantidade': count
            })
        
        elif tipo == 'nao_restaurados':
            # Remove apenas itens não restaurados (cuidado!)
            itens = ItemExcluido.query.filter_by(restaurado=False).all()
            count = len(itens)
            
            for item in itens:
                db.session.delete(item)
            
            db.session.commit()
            
            # Registrar ação
            log_action(current_user.id, 'DELETE', 'SISTEMA', None, {
                'acao': 'Limpeza da lixeira (itens não restaurados)',
                'quantidade': count
            })
            
            return jsonify({
                'mensagem': f'{count} item(ns) não restaurado(s) removido(s) da lixeira',
                'quantidade': count
            })
        
        else:
            return jsonify({'erro': 'Tipo de limpeza inválido'}), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'erro': f'Erro ao limpar lixeira: {str(e)}'}), 500
