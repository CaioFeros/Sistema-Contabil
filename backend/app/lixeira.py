"""
Módulo para gerenciar a lixeira (backup de itens excluídos)
Permite salvar e restaurar itens excluídos
"""
import json
from datetime import datetime
from .models import db, ItemExcluido, Cliente, Processamento, FaturamentoDetalhe, Recibo, Contador, Contrato


def salvar_na_lixeira(tipo_entidade, entidade_obj, usuario_id, motivo=None):
    """
    Salva um item na lixeira antes de excluí-lo
    
    Args:
        tipo_entidade: Tipo da entidade ('CLIENTE', 'PROCESSAMENTO', 'RECIBO', etc.)
        entidade_obj: Objeto da entidade a ser salvo
        usuario_id: ID do usuário que está excluindo
        motivo: Motivo da exclusão (opcional)
    
    Returns:
        ItemExcluido: Objeto criado na lixeira
    """
    # Serializar dados do objeto
    dados = serializar_entidade(tipo_entidade, entidade_obj)
    
    # Criar registro na lixeira
    item_lixeira = ItemExcluido(
        tipo_entidade=tipo_entidade,
        entidade_id_original=entidade_obj.id,
        dados_json=json.dumps(dados, ensure_ascii=False),
        usuario_exclusao_id=usuario_id,
        motivo_exclusao=motivo,
        restaurado=False
    )
    
    db.session.add(item_lixeira)
    db.session.flush()  # Para obter o ID antes do commit
    
    return item_lixeira


def restaurar_da_lixeira(item_lixeira_id, usuario_id):
    """
    Restaura um item da lixeira
    
    Args:
        item_lixeira_id: ID do item na tabela itens_excluidos
        usuario_id: ID do usuário que está restaurando
    
    Returns:
        tuple: (sucesso: bool, mensagem: str, objeto_restaurado ou None)
    """
    # Buscar item na lixeira
    item = ItemExcluido.query.get(item_lixeira_id)
    
    if not item:
        return False, "Item não encontrado na lixeira", None
    
    if item.restaurado:
        return False, "Este item já foi restaurado anteriormente", None
    
    try:
        # Desserializar dados
        dados = json.loads(item.dados_json)
        
        # Restaurar baseado no tipo
        if item.tipo_entidade == 'CLIENTE':
            obj_restaurado = restaurar_cliente(dados)
        elif item.tipo_entidade == 'PROCESSAMENTO':
            obj_restaurado = restaurar_processamento(dados)
        elif item.tipo_entidade == 'RECIBO':
            obj_restaurado = restaurar_recibo(dados)
        else:
            return False, f"Tipo de entidade '{item.tipo_entidade}' não suportado para restauração", None
        
        # Marcar item como restaurado
        item.restaurado = True
        item.data_restauracao = datetime.utcnow()
        item.usuario_restauracao_id = usuario_id
        
        db.session.commit()
        
        return True, f"{item.tipo_entidade.capitalize()} restaurado com sucesso", obj_restaurado
    
    except Exception as e:
        db.session.rollback()
        return False, f"Erro ao restaurar: {str(e)}", None


def serializar_entidade(tipo_entidade, entidade_obj):
    """
    Serializa uma entidade para JSON
    
    Args:
        tipo_entidade: Tipo da entidade
        entidade_obj: Objeto da entidade
    
    Returns:
        dict: Dados serializados
    """
    if tipo_entidade == 'CLIENTE':
        return serializar_cliente(entidade_obj)
    elif tipo_entidade == 'PROCESSAMENTO':
        return serializar_processamento(entidade_obj)
    elif tipo_entidade == 'RECIBO':
        return serializar_recibo(entidade_obj)
    elif tipo_entidade == 'CONTRATO':
        return serializar_contrato(entidade_obj)
    else:
        # Fallback: tentar usar to_dict() se existir
        if hasattr(entidade_obj, 'to_dict'):
            return entidade_obj.to_dict()
        else:
            raise ValueError(f"Tipo de entidade '{tipo_entidade}' não suportado para serialização")


def serializar_cliente(cliente):
    """Serializa um cliente para JSON"""
    return {
        'id': cliente.id,
        'razao_social': cliente.razao_social,
        'cnpj': cliente.cnpj,
        'regime_tributario': cliente.regime_tributario,
        'nome_fantasia': cliente.nome_fantasia,
        'data_abertura': cliente.data_abertura,
        'situacao_cadastral': cliente.situacao_cadastral,
        'data_situacao': cliente.data_situacao,
        'motivo_situacao': cliente.motivo_situacao,
        'natureza_juridica': cliente.natureza_juridica,
        'cnae_principal': cliente.cnae_principal,
        'cnae_secundarias': cliente.cnae_secundarias,
        'logradouro': cliente.logradouro,
        'numero': cliente.numero,
        'complemento': cliente.complemento,
        'bairro': cliente.bairro,
        'cep': cliente.cep,
        'municipio': cliente.municipio,
        'uf': cliente.uf,
        'telefone1': cliente.telefone1,
        'telefone2': cliente.telefone2,
        'email': cliente.email,
        'capital_social': cliente.capital_social,
        'porte': cliente.porte,
        'opcao_simples': cliente.opcao_simples,
        'data_opcao_simples': cliente.data_opcao_simples,
        'opcao_mei': cliente.opcao_mei,
        'data_exclusao_simples': cliente.data_exclusao_simples,
        'situacao_especial': cliente.situacao_especial,
        'data_situacao_especial': cliente.data_situacao_especial,
        'valor_honorarios': float(cliente.valor_honorarios) if cliente.valor_honorarios else None
    }


def serializar_processamento(processamento):
    """Serializa um processamento (faturamento) com seus detalhes"""
    # Buscar detalhes associados
    detalhes = FaturamentoDetalhe.query.filter_by(processamento_id=processamento.id).all()
    
    return {
        'id': processamento.id,
        'cliente_id': processamento.cliente_id,
        'mes': processamento.mes,
        'ano': processamento.ano,
        'faturamento_total': float(processamento.faturamento_total),
        'imposto_calculado': float(processamento.imposto_calculado),
        'nome_arquivo_original': processamento.nome_arquivo_original,
        'data_processamento': processamento.data_processamento.isoformat() if processamento.data_processamento else None,
        # Salvar detalhes também
        'detalhes': [{
            'descricao_servico': d.descricao_servico,
            'valor': float(d.valor)
        } for d in detalhes]
    }


def serializar_recibo(recibo):
    """Serializa um recibo"""
    return {
        'id': recibo.id,
        'cliente_id': recibo.cliente_id,
        'contador_id': recibo.contador_id,
        'mes': recibo.mes,
        'ano': recibo.ano,
        'valor': float(recibo.valor),
        'tipo_servico': recibo.tipo_servico,
        'descricao_servico': recibo.descricao_servico,
        'numero_recibo': recibo.numero_recibo,
        'data_emissao': recibo.data_emissao.isoformat() if recibo.data_emissao else None,
        'usuario_emitente_id': recibo.usuario_emitente_id
    }


def serializar_contrato(contrato):
    """Serializa um contrato"""
    return contrato.to_dict()


def restaurar_cliente(dados):
    """Restaura um cliente a partir dos dados salvos"""
    # Verificar se já existe um cliente com mesmo CNPJ
    cliente_existente = Cliente.query.filter_by(cnpj=dados['cnpj']).first()
    if cliente_existente:
        raise ValueError(f"Já existe um cliente cadastrado com o CNPJ {dados['cnpj']}")
    
    # Criar novo cliente (não usar o ID original para evitar conflitos)
    cliente = Cliente(
        razao_social=dados['razao_social'],
        cnpj=dados['cnpj'],
        regime_tributario=dados['regime_tributario'],
        nome_fantasia=dados.get('nome_fantasia'),
        data_abertura=dados.get('data_abertura'),
        situacao_cadastral=dados.get('situacao_cadastral'),
        data_situacao=dados.get('data_situacao'),
        motivo_situacao=dados.get('motivo_situacao'),
        natureza_juridica=dados.get('natureza_juridica'),
        cnae_principal=dados.get('cnae_principal'),
        cnae_secundarias=dados.get('cnae_secundarias'),
        logradouro=dados.get('logradouro'),
        numero=dados.get('numero'),
        complemento=dados.get('complemento'),
        bairro=dados.get('bairro'),
        cep=dados.get('cep'),
        municipio=dados.get('municipio'),
        uf=dados.get('uf'),
        telefone1=dados.get('telefone1'),
        telefone2=dados.get('telefone2'),
        email=dados.get('email'),
        capital_social=dados.get('capital_social'),
        porte=dados.get('porte'),
        opcao_simples=dados.get('opcao_simples'),
        data_opcao_simples=dados.get('data_opcao_simples'),
        opcao_mei=dados.get('opcao_mei'),
        data_exclusao_simples=dados.get('data_exclusao_simples'),
        situacao_especial=dados.get('situacao_especial'),
        data_situacao_especial=dados.get('data_situacao_especial'),
        valor_honorarios=dados.get('valor_honorarios')
    )
    
    db.session.add(cliente)
    db.session.flush()
    
    return cliente


def restaurar_processamento(dados):
    """Restaura um processamento (faturamento) com seus detalhes"""
    # Verificar se cliente ainda existe
    cliente = Cliente.query.get(dados['cliente_id'])
    if not cliente:
        raise ValueError(f"Cliente ID {dados['cliente_id']} não encontrado. Não é possível restaurar o faturamento.")
    
    # Verificar se já existe processamento para este cliente/mês/ano
    proc_existente = Processamento.query.filter_by(
        cliente_id=dados['cliente_id'],
        mes=dados['mes'],
        ano=dados['ano']
    ).first()
    
    if proc_existente:
        raise ValueError(f"Já existe um faturamento para {dados['mes']}/{dados['ano']} deste cliente")
    
    # Criar processamento
    from datetime import datetime
    processamento = Processamento(
        cliente_id=dados['cliente_id'],
        mes=dados['mes'],
        ano=dados['ano'],
        faturamento_total=dados['faturamento_total'],
        imposto_calculado=dados['imposto_calculado'],
        nome_arquivo_original=dados['nome_arquivo_original'],
        data_processamento=datetime.utcnow()  # Usar data atual da restauração
    )
    
    db.session.add(processamento)
    db.session.flush()
    
    # Restaurar detalhes
    for detalhe_dados in dados.get('detalhes', []):
        detalhe = FaturamentoDetalhe(
            processamento_id=processamento.id,
            descricao_servico=detalhe_dados['descricao_servico'],
            valor=detalhe_dados['valor']
        )
        db.session.add(detalhe)
    
    return processamento


def restaurar_recibo(dados):
    """Restaura um recibo"""
    # Verificar se cliente e contador ainda existem
    cliente = Cliente.query.get(dados['cliente_id'])
    if not cliente:
        raise ValueError(f"Cliente ID {dados['cliente_id']} não encontrado")
    
    contador = Contador.query.get(dados['contador_id'])
    if not contador:
        raise ValueError(f"Contador ID {dados['contador_id']} não encontrado")
    
    # Verificar se número do recibo já existe (se foi salvo)
    if dados.get('numero_recibo'):
        recibo_existente = Recibo.query.filter_by(numero_recibo=dados['numero_recibo']).first()
        if recibo_existente:
            raise ValueError(f"Já existe um recibo com o número {dados['numero_recibo']}")
    
    # Criar recibo
    from datetime import datetime
    recibo = Recibo(
        cliente_id=dados['cliente_id'],
        contador_id=dados['contador_id'],
        mes=dados['mes'],
        ano=dados['ano'],
        valor=dados['valor'],
        tipo_servico=dados.get('tipo_servico', 'honorarios'),
        descricao_servico=dados.get('descricao_servico'),
        numero_recibo=dados.get('numero_recibo'),
        data_emissao=datetime.utcnow(),  # Usar data atual da restauração
        usuario_emitente_id=dados['usuario_emitente_id']
    )
    
    db.session.add(recibo)
    db.session.flush()
    
    return recibo


def listar_itens_lixeira(tipo_entidade=None, apenas_nao_restaurados=True):
    """
    Lista itens na lixeira
    
    Args:
        tipo_entidade: Filtrar por tipo (opcional)
        apenas_nao_restaurados: Se True, lista apenas não restaurados
    
    Returns:
        list: Lista de itens na lixeira
    """
    query = ItemExcluido.query
    
    if tipo_entidade:
        query = query.filter_by(tipo_entidade=tipo_entidade)
    
    if apenas_nao_restaurados:
        query = query.filter_by(restaurado=False)
    
    return query.order_by(ItemExcluido.data_exclusao.desc()).all()

