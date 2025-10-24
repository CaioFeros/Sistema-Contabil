import pandas as pd
from flask import request, jsonify, Blueprint, current_app
import jwt
from datetime import datetime
import requests
import json
from .models import db, Cliente, Processamento, FaturamentoDetalhe, Contador, Recibo, ItemExcluido, CNAE, Socio, TemplateContrato, Contrato, PessoaJuridica, PessoaFisica, TemplateRelatorio
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, func
from .auth import token_required
from .services import processar_arquivo_faturamento, gerar_relatorio_faturamento, calcular_imposto_simples_nacional
from .audit import log_action
from .lixeira import salvar_na_lixeira
from .validators import validar_cpf, validar_cnpj, formatar_cpf, formatar_cnpj, limpar_documento, validar_email, validar_telefone
from .pdf_generator import gerar_pdf_contrato
import unicodedata
import re

api_bp = Blueprint('api', __name__, url_prefix='/api') # Blueprint principal da API

@api_bp.route("/test", methods=["GET"])
def test_endpoint():
    """Endpoint de teste para verificar se o backend está funcionando"""
    return jsonify({
        "mensagem": "Backend funcionando perfeitamente!",
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    })

# ===== ROTAS PARA PESSOA JURÍDICA (EMPRESAS) =====

@api_bp.route("/empresas", methods=["GET"])
@token_required
def listar_empresas(current_user):
    """Lista todas as empresas (pessoas jurídicas)"""
    try:
        empresas = PessoaJuridica.query.filter_by(ativo=True).all()
        resultado = [empresa.to_dict() for empresa in empresas]
        
        current_app.logger.info(f"Listadas {len(resultado)} empresas")
        return jsonify(resultado)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao listar empresas: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar empresas"}), 500

@api_bp.route("/empresas/<int:empresa_id>", methods=["GET"])
@token_required
def obter_empresa(current_user, empresa_id):
    """Obtém dados de uma empresa específica"""
    try:
        empresa = PessoaJuridica.query.filter_by(id=empresa_id, ativo=True).first()
        
        if not empresa:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        
        current_app.logger.info(f"Empresa obtida: {empresa.razao_social} (ID: {empresa.id})")
        return jsonify(empresa.to_dict())
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter empresa {empresa_id}: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar empresa"}), 500

# ===== ROTAS PARA PESSOA FÍSICA =====

@api_bp.route("/pessoas-fisicas", methods=["GET"])
@token_required
def listar_pessoas_fisicas(current_user):
    """Lista todas as pessoas físicas"""
    try:
        pessoas_fisicas = PessoaFisica.query.filter_by(ativo=True).all()
        resultado = [pf.to_dict() for pf in pessoas_fisicas]
        
        current_app.logger.info(f"Listadas {len(resultado)} pessoas físicas")
        return jsonify(resultado)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao listar pessoas físicas: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar pessoas físicas"}), 500

@api_bp.route("/pessoas-fisicas/<int:pessoa_id>", methods=["GET"])
@token_required
def obter_pessoa_fisica(current_user, pessoa_id):
    """Obtém dados de uma pessoa física específica"""
    try:
        pessoa = PessoaFisica.query.filter_by(id=pessoa_id, ativo=True).first()
        
        if not pessoa:
            return jsonify({"erro": "Pessoa física não encontrada"}), 404
        
        current_app.logger.info(f"Pessoa física obtida: {pessoa.nome_completo} (ID: {pessoa.id})")
        return jsonify(pessoa.to_dict())
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter pessoa física {pessoa_id}: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar pessoa física"}), 500

def normalizar_texto(texto):
    """
    Remove acentos e normaliza caracteres especiais para facilitar busca
    Exemplos: 
    - "construção" -> "construcao"
    - "elétrico" -> "eletrico"
    - "açúcar" -> "acucar"
    """
    if not texto:
        return texto
    
    # Remove acentos usando unicodedata
    texto_nfd = unicodedata.normalize('NFD', texto)
    texto_sem_acento = ''.join(char for char in texto_nfd if unicodedata.category(char) != 'Mn')
    
    # Converte para minúsculas
    texto_normalizado = texto_sem_acento.lower()
    
    return texto_normalizado

def limpar_codigo(codigo):
    """
    Remove pontuações e espaços de códigos CNAE
    Exemplo: "69.20-6/01" -> "6920601"
    """
    if not codigo:
        return codigo
    return codigo.replace('.', '').replace('-', '').replace('/', '').replace(' ', '')

def calcular_similaridade(str1, str2):
    """
    Calcula similaridade entre duas strings usando distância de Levenshtein
    Retorna um valor de 0 a 100 (100 = idênticas)
    """
    if not str1 or not str2:
        return 0
    
    # Normaliza ambas as strings
    s1 = normalizar_texto(str1).lower()
    s2 = normalizar_texto(str2).lower()
    
    # Se são idênticas após normalização
    if s1 == s2:
        return 100
    
    # Se uma está contida na outra
    if s1 in s2 or s2 in s1:
        return 90
    
    # Calcula distância de Levenshtein
    len1, len2 = len(s1), len(s2)
    if len1 > len2:
        s1, s2 = s2, s1
        len1, len2 = len2, len1
    
    current_row = range(len1 + 1)
    for i in range(1, len2 + 1):
        previous_row, current_row = current_row, [i] + [0] * len1
        for j in range(1, len1 + 1):
            add, delete, change = previous_row[j] + 1, current_row[j - 1] + 1, previous_row[j - 1]
            if s1[j - 1] != s2[i - 1]:
                change += 1
            current_row[j] = min(add, delete, change)
    
    # Converte distância em porcentagem de similaridade
    distancia = current_row[len1]
    max_len = max(len(s1), len(s2))
    similaridade = ((max_len - distancia) / max_len) * 100
    
    return similaridade

def extrair_radical(palavra):
    """
    Extrai o radical básico de uma palavra (stemming simplificado)
    Exemplos:
    - "odontológico" -> "odont"
    - "odontologia" -> "odont"
    - "construção" -> "constru"
    """
    palavra_norm = normalizar_texto(palavra).lower()
    
    # Remove sufixos comuns em português
    sufixos = [
        'mente', 'acao', 'icao', 'ador', 'ante', 'ancia', 'encia', 
        'ismo', 'ista', 'oso', 'osa', 'ivo', 'iva', 'logico', 'logica',
        'logia', 'vel', 'dor', 'dora', 'ao', 'oes', 'ico', 'ica',
        'eiro', 'eira', 'agem', 'ncia', 'rio', 'ria', 'torio', 'toria'
    ]
    
    for sufixo in sorted(sufixos, key=len, reverse=True):
        if len(palavra_norm) > len(sufixo) + 3 and palavra_norm.endswith(sufixo):
            return palavra_norm[:-len(sufixo)]
    
    # Retorna pelo menos as primeiras 5 letras (ou menos se a palavra for curta)
    return palavra_norm[:max(5, len(palavra_norm) - 3)] if len(palavra_norm) > 3 else palavra_norm

@api_bp.route("/clientes", methods=["POST"])
@token_required
def create_cliente(current_user):
    import json
    
    data = request.get_json()
    if not data or not data.get('razao_social') or not data.get('cnpj') or not data.get('regime_tributario'):
        return jsonify({"erro": "razao_social, cnpj e regime_tributario são obrigatórios"}), 400

    cnpj = data['cnpj']
    if Cliente.query.filter_by(cnpj=cnpj).first():
        return jsonify({"erro": f"Cliente com CNPJ {cnpj} já existe"}), 409

    # Cria o cliente com todos os campos disponíveis
    novo_cliente = Cliente(
        razao_social=data['razao_social'],
        cnpj=cnpj,
        regime_tributario=data['regime_tributario'],
        nome_fantasia=data.get('nome_fantasia'),
        data_abertura=data.get('data_abertura'),
        situacao_cadastral=data.get('situacao_cadastral'),
        data_situacao=data.get('data_situacao'),
        motivo_situacao=data.get('motivo_situacao'),
        natureza_juridica=data.get('natureza_juridica'),
        cnae_principal=data.get('cnae_principal'),
        cnae_secundarias=json.dumps(data.get('cnae_secundarias', [])) if data.get('cnae_secundarias') else None,
        logradouro=data.get('logradouro'),
        numero=data.get('numero'),
        complemento=data.get('complemento'),
        bairro=data.get('bairro'),
        cep=data.get('cep'),
        municipio=data.get('municipio'),
        uf=data.get('uf'),
        telefone1=data.get('telefone1'),
        telefone2=data.get('telefone2'),
        email=data.get('email'),
        capital_social=data.get('capital_social'),
        porte=data.get('porte'),
        opcao_simples=data.get('opcao_simples'),
        data_opcao_simples=data.get('data_opcao_simples'),
        opcao_mei=data.get('opcao_mei'),
        data_exclusao_simples=data.get('data_exclusao_simples'),
        situacao_especial=data.get('situacao_especial'),
        data_situacao_especial=data.get('data_situacao_especial'),
        valor_honorarios=data.get('valor_honorarios')
    )

    db.session.add(novo_cliente)
    db.session.commit()

    # Log de auditoria
    log_action(current_user.id, 'CREATE', 'CLIENTE', novo_cliente.id, {
        'razao_social': novo_cliente.razao_social,
        'cnpj': novo_cliente.cnpj,
        'regime_tributario': novo_cliente.regime_tributario
    })

    return jsonify({
        "mensagem": "Cliente criado com sucesso!",
        "cliente": novo_cliente.to_dict()
    }), 201

@api_bp.route("/clientes", methods=["GET"])
@token_required
def get_clientes(current_user):
    """Retorna lista de todos os clientes (PJ e PF) com campos básicos"""
    clientes = Cliente.query.all()
    resultado = []
    
    for c in clientes:
        cliente_data = {
            "id": c.id,
            "tipo_pessoa": c.tipo_pessoa or 'PJ',
            "valor_honorarios": float(c.valor_honorarios) if c.valor_honorarios else None
        }
        
        # Adiciona campos específicos de PF ou PJ
        if c.tipo_pessoa == 'PF':
            cliente_data.update({
                "nome_completo": c.nome_completo,
                "cpf": c.cpf,
                "email": c.email,
                "telefone1": c.telefone1
            })
        else:
            cliente_data.update({
                "razao_social": c.razao_social,
                "cnpj": c.cnpj,
                "regime_tributario": c.regime_tributario
            })
        
        resultado.append(cliente_data)
    
    return jsonify(resultado)

@api_bp.route("/clientes/<int:cliente_id>", methods=["GET"])
@token_required
def get_cliente(current_user, cliente_id):
    """Busca um cliente específico com todos os seus dados"""
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    return jsonify(cliente.to_dict())

@api_bp.route("/clientes/<int:cliente_id>", methods=["DELETE"])
@token_required
def delete_cliente(current_user, cliente_id):
    """
    Move o cliente para a lixeira (soft delete).
    Os processamentos relacionados são mantidos temporariamente.
    """
    import json
    
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    try:
        # Identifica se é PF ou PJ
        tipo_cliente = cliente.tipo_pessoa if cliente.tipo_pessoa else 'PJ'
        identificacao = cliente.nome_completo if tipo_cliente == 'PF' else cliente.razao_social
        documento = cliente.cpf if tipo_cliente == 'PF' else cliente.cnpj
        regime_tributario = cliente.regime_tributario
        
        # Conta processamentos relacionados
        processamentos = Processamento.query.filter_by(cliente_id=cliente_id).all()
        num_processamentos = len(processamentos)
        
        # Remove processamentos relacionados primeiro (salva cada um na lixeira)
        for proc in processamentos:
            # Conta o número de notas (detalhes) do processamento
            total_notas = len(proc.detalhes) if proc.detalhes else 0
            
            # Salva processamento na lixeira
            salvar_na_lixeira('PROCESSAMENTO', proc, current_user.id, 'Excluído junto com o cliente')
            
            # Registra log de exclusão
            log_action(current_user.id, 'DELETE', 'FATURAMENTO', proc.id, {
                'cliente_id': cliente_id,
                'cliente_nome': identificacao,
                'mes': proc.mes,
                'ano': proc.ano,
                'total_notas': total_notas,
                'motivo': 'Excluído junto com o cliente (salvo na lixeira)'
            })
            
            # Remove do banco
            db.session.delete(proc)
        
        # Salva o cliente na lixeira
        item_lixeira = salvar_na_lixeira(f'CLIENTE_{tipo_cliente}', cliente, current_user.id, 
                                         f'Cliente {tipo_cliente} excluído com {num_processamentos} processamentos relacionados')
        
        # Deleta o cliente do banco principal
        db.session.delete(cliente)
        db.session.commit()
        
        # Registra log de exclusão do cliente
        log_action(current_user.id, 'DELETE', f'CLIENTE_{tipo_cliente}', cliente_id, {
            'identificacao': identificacao,
            'documento': documento,
            'tipo_pessoa': tipo_cliente,
            'regime_tributario': regime_tributario,
            'num_processamentos': num_processamentos,
            'movido_para_lixeira': True,
            'lixeira_id': item_lixeira.id
        })
        
        current_app.logger.info(f"Cliente {tipo_cliente} movido para lixeira: {identificacao} ({documento}) - {num_processamentos} processamentos removidos")
        
        return jsonify({
            "mensagem": f"Cliente '{identificacao}' deletado com sucesso!",
            "processamentos_removidos": num_processamentos
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao deletar cliente {cliente_id}: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao deletar cliente. Tente novamente."}), 500

@api_bp.route("/clientes/<int:cliente_id>", methods=["PUT"])
@token_required
def update_cliente(current_user, cliente_id):
    """Atualiza os dados de um cliente"""
    import json
    
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    data = request.get_json()
    
    # Atualiza apenas os campos que foram enviados
    # Campos Pessoa Jurídica
    if 'razao_social' in data:
        cliente.razao_social = data['razao_social']
    if 'regime_tributario' in data:
        cliente.regime_tributario = data['regime_tributario']
    if 'nome_fantasia' in data:
        cliente.nome_fantasia = data['nome_fantasia']
    if 'data_abertura' in data:
        cliente.data_abertura = data['data_abertura']
    
    # Campos Pessoa Física
    if 'nome_completo' in data:
        cliente.nome_completo = data['nome_completo']
    if 'cpf' in data:
        # Valida CPF se for fornecido
        cpf_limpo = limpar_documento(data['cpf'])
        cpf_valido, msg_erro = validar_cpf(cpf_limpo)
        if not cpf_valido:
            return jsonify({"erro": f"CPF inválido: {msg_erro}"}), 400
        cliente.cpf = formatar_cpf(cpf_limpo)
    if 'rg' in data:
        cliente.rg = data['rg']
    if 'data_nascimento' in data:
        cliente.data_nascimento = data['data_nascimento']
    
    # Situação Cadastral
    if 'situacao_cadastral' in data:
        cliente.situacao_cadastral = data['situacao_cadastral']
    if 'data_situacao' in data:
        cliente.data_situacao = data['data_situacao']
    if 'motivo_situacao' in data:
        cliente.motivo_situacao = data['motivo_situacao']
    
    # Natureza Jurídica
    if 'natureza_juridica' in data:
        cliente.natureza_juridica = data['natureza_juridica']
    
    # Atividade Econômica
    if 'cnae_principal' in data:
        cliente.cnae_principal = data['cnae_principal']
    if 'cnae_secundarias' in data:
        # Converte array para JSON string
        cliente.cnae_secundarias = json.dumps(data['cnae_secundarias']) if data['cnae_secundarias'] else None
    
    # Endereço
    if 'logradouro' in data:
        cliente.logradouro = data['logradouro']
    if 'numero' in data:
        cliente.numero = data['numero']
    if 'complemento' in data:
        cliente.complemento = data['complemento']
    if 'bairro' in data:
        cliente.bairro = data['bairro']
    if 'cep' in data:
        cliente.cep = data['cep']
    if 'municipio' in data:
        cliente.municipio = data['municipio']
    if 'uf' in data:
        cliente.uf = data['uf']
    
    # Contato
    if 'telefone1' in data:
        cliente.telefone1 = data['telefone1']
    if 'telefone2' in data:
        cliente.telefone2 = data['telefone2']
    if 'email' in data:
        cliente.email = data['email']
    
    # Informações Empresariais
    if 'capital_social' in data:
        cliente.capital_social = data['capital_social']
    if 'porte' in data:
        cliente.porte = data['porte']
    
    # Opções Fiscais
    if 'opcao_simples' in data:
        cliente.opcao_simples = data['opcao_simples']
    if 'data_opcao_simples' in data:
        cliente.data_opcao_simples = data['data_opcao_simples']
    if 'opcao_mei' in data:
        cliente.opcao_mei = data['opcao_mei']
    if 'data_exclusao_simples' in data:
        cliente.data_exclusao_simples = data['data_exclusao_simples']
    
    # Situação Especial
    if 'situacao_especial' in data:
        cliente.situacao_especial = data['situacao_especial']
    if 'data_situacao_especial' in data:
        cliente.data_situacao_especial = data['data_situacao_especial']
    
    # Honorários
    if 'valor_honorarios' in data:
        cliente.valor_honorarios = data['valor_honorarios']
    
    try:
        db.session.commit()
        
        # Log de auditoria
        tipo_cliente = 'PF' if cliente.tipo_pessoa == 'PF' else 'PJ'
        identificacao = cliente.nome_completo if cliente.tipo_pessoa == 'PF' else cliente.razao_social
        documento = cliente.cpf if cliente.tipo_pessoa == 'PF' else cliente.cnpj
        
        log_action(
            usuario_id=current_user.id,
            acao='UPDATE',
            entidade=f'CLIENTE_{tipo_cliente}',
            entidade_id=cliente.id,
            detalhes={
                'identificacao': identificacao,
                'documento': documento,
                'campos_atualizados': list(data.keys())
            },
            ip_address=request.remote_addr
        )
        
        current_app.logger.info(f"Cliente {tipo_cliente} atualizado: {identificacao} (ID: {cliente.id})")
        
        return jsonify({
            "mensagem": "Cliente atualizado com sucesso!",
            "cliente": cliente.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar cliente: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao atualizar cliente"}), 500

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

@api_bp.route("/cnpj/<string:cnpj>", methods=["GET"])
@token_required
def consultar_cnpj(current_user, cnpj):
    """
    Consulta dados de um CNPJ na API BrasilAPI da Receita Federal.
    Remove pontuação do CNPJ antes de consultar.
    """
    try:
        # Remove pontuação do CNPJ (apenas números)
        cnpj_limpo = ''.join(filter(str.isdigit, cnpj))
        
        current_app.logger.info(f"Consultando CNPJ: {cnpj_limpo}")
        
        # Valida se o CNPJ tem 14 dígitos
        if len(cnpj_limpo) != 14:
            current_app.logger.warning(f"CNPJ inválido (tamanho): {cnpj_limpo}")
            return jsonify({"erro": "CNPJ inválido. Deve conter 14 dígitos."}), 400
        
        # Consulta a BrasilAPI
        url = f"https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}"
        current_app.logger.info(f"Fazendo requisição para: {url}")
        
        response = requests.get(url, timeout=15)
        
        current_app.logger.info(f"Status da resposta: {response.status_code}")
        
        if response.status_code == 404:
            current_app.logger.warning(f"CNPJ não encontrado: {cnpj_limpo}")
            return jsonify({"erro": "CNPJ não encontrado na Receita Federal."}), 404
        
        if response.status_code != 200:
            current_app.logger.error(f"Erro da BrasilAPI - Status {response.status_code}: {response.text}")
            return jsonify({"erro": f"Erro ao consultar a Receita Federal (Status: {response.status_code}). Tente novamente."}), 502
        
        dados_receita = response.json()
        current_app.logger.info(f"Dados recebidos da API para CNPJ {cnpj_limpo}: {dados_receita}")
        
        # Valida se os dados não estão vazios
        if not dados_receita:
            current_app.logger.error(f"Resposta vazia da BrasilAPI para CNPJ: {cnpj_limpo}")
            return jsonify({"erro": "A API retornou dados vazios. Tente novamente."}), 502
        
        # Mapeia os dados da BrasilAPI para o formato do nosso sistema
        dados_formatados = mapear_dados_receita(dados_receita)
        
        return jsonify(dados_formatados), 200
        
    except requests.exceptions.Timeout:
        current_app.logger.error(f"Timeout ao consultar CNPJ: {cnpj_limpo}")
        return jsonify({"erro": "Timeout ao consultar a Receita Federal. A API está demorando muito. Tente novamente em alguns segundos."}), 504
    except requests.exceptions.ConnectionError as e:
        current_app.logger.error(f"Erro de conexão ao consultar BrasilAPI: {e}")
        return jsonify({"erro": "Erro de conexão com a BrasilAPI. Verifique sua internet ou tente novamente."}), 502
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Erro ao consultar BrasilAPI: {e}")
        return jsonify({"erro": f"Erro de requisição: {str(e)}"}), 502
    except ValueError as e:
        current_app.logger.error(f"Erro ao parsear JSON da BrasilAPI: {e}", exc_info=True)
        return jsonify({"erro": f"Resposta inválida da API: {str(e)}"}), 502
    except KeyError as e:
        current_app.logger.error(f"Campo esperado não encontrado na resposta da API: {e}", exc_info=True)
        return jsonify({"erro": f"Dados incompletos da API. Campo faltando: {str(e)}"}), 502
    except AttributeError as e:
        current_app.logger.error(f"Erro ao processar dados da API (AttributeError): {e}", exc_info=True)
        return jsonify({"erro": "Erro ao processar resposta da API. Formato inesperado."}), 502
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao consultar CNPJ: {e}", exc_info=True)
        return jsonify({"erro": f"Erro interno: {str(e)}"}), 500

def mapear_dados_receita(dados_api):
    """
    Mapeia os dados da BrasilAPI para o formato usado pelo nosso frontend.
    """
    import json
    
    # Valida se dados_api não é None
    if not dados_api or not isinstance(dados_api, dict):
        raise ValueError("Dados da API inválidos ou vazios")
    
    # Formata o CNPJ com máscara
    cnpj = dados_api.get('cnpj', '')
    cnpj_formatado = f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:14]}" if len(cnpj) == 14 else cnpj
    
    # Formata a data de abertura (de YYYY-MM-DD para DD/MM/YYYY)
    data_abertura = dados_api.get('data_inicio_atividade', '')
    if data_abertura and len(data_abertura) == 10:
        partes = data_abertura.split('-')
        data_abertura = f"{partes[2]}/{partes[1]}/{partes[0]}"
    
    # Formata datas de situação
    data_situacao = dados_api.get('data_situacao_cadastral', '')
    if data_situacao and len(data_situacao) == 10:
        partes = data_situacao.split('-')
        data_situacao = f"{partes[2]}/{partes[1]}/{partes[0]}"
    
    # Formata data da situação especial
    data_situacao_especial = dados_api.get('data_situacao_especial', '')
    if data_situacao_especial and len(data_situacao_especial) == 10:
        partes = data_situacao_especial.split('-')
        data_situacao_especial = f"{partes[2]}/{partes[1]}/{partes[0]}"
    
    # Formata data de opção pelo Simples
    # Verifica se opcao_pelo_simples é um dicionário antes de acessar
    opcao_simples_obj = dados_api.get('opcao_pelo_simples') or {}
    data_opcao_simples = opcao_simples_obj.get('data_opcao', '') if isinstance(opcao_simples_obj, dict) else ''
    if data_opcao_simples and len(data_opcao_simples) == 10:
        partes = data_opcao_simples.split('-')
        data_opcao_simples = f"{partes[2]}/{partes[1]}/{partes[0]}"
    # Se não tem data, tenta pegar do campo alternativo
    if not data_opcao_simples:
        data_opcao_simples = dados_api.get('data_opcao_pelo_simples', '')
    
    # Monta lista de CNAEs secundários
    cnaes_secundarios = [
        f"{cnae.get('codigo', '')} - {cnae.get('descricao', '')}"
        for cnae in dados_api.get('cnaes_secundarios', [])
    ]
    
    # Formata o capital social
    capital_social = dados_api.get('capital_social', 0)
    capital_social_formatado = f"R$ {float(capital_social):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    
    return {
        'cnpj': cnpj_formatado,
        'razao_social': dados_api.get('razao_social', ''),
        'nome_fantasia': dados_api.get('nome_fantasia', ''),
        'data_abertura': data_abertura,
        'situacao_cadastral': dados_api.get('descricao_situacao_cadastral', ''),
        'data_situacao': data_situacao,
        'motivo_situacao': dados_api.get('descricao_motivo_situacao_cadastral', ''),
        'natureza_juridica': f"{dados_api.get('codigo_natureza_juridica', '')} - {dados_api.get('natureza_juridica', '')}",
        'cnae_principal': f"{dados_api.get('cnae_fiscal', '')} - {dados_api.get('cnae_fiscal_descricao', '')}",
        'cnae_secundarias': cnaes_secundarios,
        'logradouro': dados_api.get('logradouro', ''),
        'numero': dados_api.get('numero', ''),
        'complemento': dados_api.get('complemento', ''),
        'bairro': dados_api.get('bairro', ''),
        'cep': dados_api.get('cep', ''),
        'municipio': dados_api.get('municipio', ''),
        'uf': dados_api.get('uf', ''),
        'telefone1': dados_api.get('ddd_telefone_1', ''),
        'telefone2': dados_api.get('ddd_telefone_2', ''),
        'email': dados_api.get('email', ''),
        'capital_social': capital_social_formatado,
        'porte': dados_api.get('porte', ''),
        'opcao_simples': 'SIM' if (isinstance(opcao_simples_obj, dict) and opcao_simples_obj.get('optante', False)) else 'NÃO',
        'data_opcao_simples': data_opcao_simples,
        'opcao_mei': 'SIM' if dados_api.get('opcao_pelo_mei') else 'NÃO',
        'situacao_especial': dados_api.get('situacao_especial', ''),
        'data_situacao_especial': data_situacao_especial
    }

# ==========================
# CONSULTA CEP (ViaCEP)
# ==========================

@api_bp.route("/cep/<string:cep>", methods=["GET"])
@token_required
def consultar_cep(current_user, cep):
    """
    Consulta dados de um CEP na API ViaCEP.
    Remove pontuação do CEP antes de consultar.
    """
    try:
        # Remove pontuação do CEP (apenas números)
        cep_limpo = ''.join(filter(str.isdigit, cep))
        
        current_app.logger.info(f"Consultando CEP: {cep_limpo}")
        
        # Valida se o CEP tem 8 dígitos
        if len(cep_limpo) != 8:
            current_app.logger.warning(f"CEP inválido (tamanho): {cep_limpo}")
            return jsonify({"erro": "CEP inválido. Deve conter 8 dígitos."}), 400
        
        # Consulta a ViaCEP
        url = f"https://viacep.com.br/ws/{cep_limpo}/json/"
        current_app.logger.info(f"Fazendo requisição para: {url}")
        
        response = requests.get(url, timeout=10)
        
        current_app.logger.info(f"Status da resposta: {response.status_code}")
        
        if response.status_code != 200:
            current_app.logger.error(f"Erro da ViaCEP - Status {response.status_code}: {response.text}")
            return jsonify({"erro": f"Erro ao consultar o CEP (Status: {response.status_code}). Tente novamente."}), 502
        
        dados_cep = response.json()
        current_app.logger.info(f"Dados recebidos da API para CEP {cep_limpo}: {dados_cep}")
        
        # Verifica se o CEP foi encontrado
        if dados_cep.get('erro'):
            current_app.logger.warning(f"CEP não encontrado: {cep_limpo}")
            return jsonify({"erro": "CEP não encontrado."}), 404
        
        # Formata o CEP com máscara
        cep_formatado = f"{cep_limpo[:5]}-{cep_limpo[5:]}"
        
        # Retorna dados formatados
        return jsonify({
            'cep': cep_formatado,
            'logradouro': dados_cep.get('logradouro', ''),
            'complemento': dados_cep.get('complemento', ''),
            'bairro': dados_cep.get('bairro', ''),
            'municipio': dados_cep.get('localidade', ''),
            'uf': dados_cep.get('uf', ''),
            'ibge': dados_cep.get('ibge', ''),
            'ddd': dados_cep.get('ddd', '')
        }), 200
        
    except requests.exceptions.Timeout:
        current_app.logger.error(f"Timeout ao consultar CEP: {cep_limpo}")
        return jsonify({"erro": "Timeout ao consultar o CEP. Tente novamente."}), 504
    except requests.exceptions.ConnectionError as e:
        current_app.logger.error(f"Erro de conexão ao consultar ViaCEP: {e}")
        return jsonify({"erro": "Erro de conexão com a ViaCEP. Verifique sua internet."}), 502
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Erro ao consultar ViaCEP: {e}")
        return jsonify({"erro": f"Erro de requisição: {str(e)}"}), 502
    except ValueError as e:
        current_app.logger.error(f"Erro ao parsear JSON da ViaCEP: {e}", exc_info=True)
        return jsonify({"erro": f"Resposta inválida da API: {str(e)}"}), 502
    except Exception as e:
        current_app.logger.error(f"Erro inesperado ao consultar CEP: {e}", exc_info=True)
        return jsonify({"erro": f"Erro interno: {str(e)}"}), 500

# ==========================
# CADASTRO PESSOA FÍSICA
# ==========================

@api_bp.route("/clientes/pessoa-fisica", methods=["POST"])
@token_required
def cadastrar_cliente_pessoa_fisica(current_user):
    """
    Cadastra um novo cliente pessoa física com validação completa.
    """
    try:
        data = request.get_json()
        
        # Validações de campos obrigatórios (PF não precisa de regime tributário)
        campos_obrigatorios = ['nome_completo', 'cpf']
        for campo in campos_obrigatorios:
            if not data.get(campo):
                return jsonify({"erro": f"Campo obrigatório ausente: {campo}"}), 400
        
        # Limpa e valida CPF
        cpf_limpo = limpar_documento(data['cpf'])
        cpf_valido, msg_erro = validar_cpf(cpf_limpo)
        if not cpf_valido:
            return jsonify({"erro": f"CPF inválido: {msg_erro}"}), 400
        
        # Formata CPF
        cpf_formatado = formatar_cpf(cpf_limpo)
        
        # Verifica se já existe um cliente com este CPF
        cliente_existente = Cliente.query.filter_by(cpf=cpf_formatado).first()
        if cliente_existente:
            nome_cliente = cliente_existente.nome_completo if cliente_existente.tipo_pessoa == 'PF' else cliente_existente.razao_social
            return jsonify({
                "erro": f"CPF {cpf_formatado} já cadastrado no sistema.",
                "detalhes": f"Cliente: {nome_cliente}",
                "cliente_id": cliente_existente.id
            }), 409
        
        # Valida email se fornecido
        if data.get('email'):
            email_valido, msg_erro = validar_email(data['email'])
            if not email_valido:
                return jsonify({"erro": msg_erro}), 400
        
        # Valida telefones se fornecidos
        for campo_tel in ['telefone1', 'telefone2']:
            if data.get(campo_tel):
                tel_valido, msg_erro = validar_telefone(data[campo_tel])
                if not tel_valido:
                    return jsonify({"erro": f"{campo_tel}: {msg_erro}"}), 400
        
        # Cria novo cliente pessoa física
        novo_cliente = Cliente(
            tipo_pessoa='PF',
            nome_completo=data['nome_completo'],
            cpf=cpf_formatado,
            data_nascimento=data.get('data_nascimento'),
            rg=data.get('rg'),
            estado_civil=data.get('estado_civil'),
            regime_comunhao=data.get('regime_comunhao'),
            # Endereço
            logradouro=data.get('logradouro'),
            numero=data.get('numero'),
            complemento=data.get('complemento'),
            bairro=data.get('bairro'),
            cep=data.get('cep'),
            municipio=data.get('municipio'),
            uf=data.get('uf'),
            # Contato
            telefone1=data.get('telefone1'),
            telefone2=data.get('telefone2'),
            email=data.get('email'),
            # Honorários
            valor_honorarios=data.get('valor_honorarios')
        )
        
        db.session.add(novo_cliente)
        db.session.commit()
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='CREATE',
            entidade='CLIENTE_PF',
            entidade_id=novo_cliente.id,
            detalhes={
                'nome_completo': novo_cliente.nome_completo,
                'cpf': novo_cliente.cpf
            },
            ip_address=request.remote_addr
        )
        
        current_app.logger.info(f"Cliente PF cadastrado com sucesso: {novo_cliente.nome_completo} (ID: {novo_cliente.id})")
        
        return jsonify({
            "mensagem": "Cliente pessoa física cadastrado com sucesso!",
            "cliente": novo_cliente.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao cadastrar cliente pessoa física: {e}", exc_info=True)
        return jsonify({"erro": f"Erro ao cadastrar cliente: {str(e)}"}), 500


# ==========================
# GERENCIAMENTO DE SÓCIOS
# ==========================

@api_bp.route("/empresas/<int:empresa_id>/socios", methods=["GET"])
@token_required
def listar_socios_empresa(current_user, empresa_id):
    """
    Lista todos os sócios de uma empresa (cliente PJ) com dados completos.
    """
    try:
        # Verifica se a empresa existe e é PJ
        empresa = Cliente.query.get(empresa_id)
        if not empresa:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        
        if empresa.tipo_pessoa == 'PF':
            return jsonify({"erro": "Este cliente é Pessoa Física, não pode ter sócios"}), 400
        
        # Parâmetro para incluir dados completos
        incluir_completos = request.args.get('completos', 'false').lower() == 'true'
        
        # Busca os sócios
        socios = Socio.query.filter_by(empresa_id=empresa_id).all()
        
        return jsonify([s.to_dict(incluir_dados_completos=incluir_completos) for s in socios]), 200
        
    except Exception as e:
        current_app.logger.error(f"Erro ao listar sócios da empresa {empresa_id}: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar sócios"}), 500


@api_bp.route("/empresas/<int:empresa_id>/socios", methods=["POST"])
@token_required
def adicionar_socio(current_user, empresa_id):
    """
    Adiciona um sócio (PF) a uma empresa (PJ).
    """
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('socio_id'):
            return jsonify({"erro": "ID do sócio é obrigatório"}), 400
        
        # Verifica se a empresa existe e é PJ
        empresa = Cliente.query.get(empresa_id)
        if not empresa:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        
        if empresa.tipo_pessoa == 'PF':
            return jsonify({"erro": "Este cliente é Pessoa Física, não pode ter sócios"}), 400
        
        # Verifica se o sócio existe e é PF
        socio = Cliente.query.get(data['socio_id'])
        if not socio:
            return jsonify({"erro": "Sócio não encontrado"}), 404
        
        if socio.tipo_pessoa != 'PF':
            return jsonify({"erro": "Apenas clientes Pessoa Física podem ser sócios"}), 400
        
        # Verifica se já não é sócio
        socio_existente = Socio.query.filter_by(
            empresa_id=empresa_id,
            socio_id=data['socio_id']
        ).first()
        
        if socio_existente:
            return jsonify({"erro": f"{socio.nome_completo} já é sócio desta empresa"}), 409
        
        # Cria o relacionamento
        novo_socio = Socio(
            empresa_id=empresa_id,
            socio_id=data['socio_id'],
            percentual_participacao=data.get('percentual_participacao'),
            data_entrada=data.get('data_entrada'),
            cargo=data.get('cargo', 'Sócio')
        )
        
        db.session.add(novo_socio)
        db.session.commit()
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='CREATE',
            entidade='SOCIO',
            entidade_id=novo_socio.id,
            detalhes={
                'empresa': empresa.razao_social,
                'socio': socio.nome_completo,
                'cpf': socio.cpf
            },
            ip_address=request.remote_addr
        )
        
        current_app.logger.info(f"Sócio adicionado: {socio.nome_completo} à empresa {empresa.razao_social}")
        
        return jsonify({
            "mensagem": "Sócio adicionado com sucesso!",
            "socio": novo_socio.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao adicionar sócio: {e}", exc_info=True)
        return jsonify({"erro": f"Erro ao adicionar sócio: {str(e)}"}), 500


@api_bp.route("/empresas/<int:empresa_id>/socios/<int:socio_id>", methods=["DELETE"])
@token_required
def remover_socio(current_user, empresa_id, socio_id):
    """
    Remove um sócio de uma empresa.
    """
    try:
        # Busca o relacionamento
        socio_rel = Socio.query.filter_by(
            empresa_id=empresa_id,
            socio_id=socio_id
        ).first()
        
        if not socio_rel:
            return jsonify({"erro": "Relacionamento não encontrado"}), 404
        
        # Salva informações para o log
        empresa = Cliente.query.get(empresa_id)
        socio = Cliente.query.get(socio_id)
        
        # Remove o relacionamento
        db.session.delete(socio_rel)
        db.session.commit()
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='DELETE',
            entidade='SOCIO',
            entidade_id=socio_rel.id,
            detalhes={
                'empresa': empresa.razao_social if empresa else 'N/A',
                'socio': socio.nome_completo if socio else 'N/A',
                'cpf': socio.cpf if socio else 'N/A'
            },
            ip_address=request.remote_addr
        )
        
        current_app.logger.info(f"Sócio removido: {socio.nome_completo} da empresa {empresa.razao_social}")
        
        return jsonify({"mensagem": "Sócio removido com sucesso!"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao remover sócio: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao remover sócio"}), 500


@api_bp.route("/clientes/pessoa-fisica", methods=["GET"])
@token_required
def listar_todos_clientes_pf(current_user):
    """
    Retorna lista completa de clientes Pessoa Física com todos os dados.
    """
    try:
        clientes_pf = Cliente.query.filter_by(tipo_pessoa='PF').all()
        
        resultado = [c.to_dict() for c in clientes_pf]
        
        return jsonify(resultado), 200
        
    except Exception as e:
        current_app.logger.error(f"Erro ao listar todos clientes PF: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar clientes PF"}), 500


@api_bp.route("/clientes/pessoa-fisica/lista", methods=["GET"])
@token_required
def listar_clientes_pf(current_user):
    """
    Retorna lista simplificada de clientes Pessoa Física para seleção de sócios.
    """
    try:
        clientes_pf = Cliente.query.filter_by(tipo_pessoa='PF').all()
        
        resultado = [{
            'id': c.id,
            'nome_completo': c.nome_completo,
            'cpf': c.cpf,
            'email': c.email
        } for c in clientes_pf]
        
        return jsonify(resultado), 200
        
    except Exception as e:
        current_app.logger.error(f"Erro ao listar clientes PF: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar clientes PF"}), 500


# ============================================
# ROTAS DE IMPORTAÇÃO CSV
# ============================================

@api_bp.route('/faturamento/upload-preview', methods=['POST'])
@token_required
def upload_preview_csv(current_user):
    """
    Recebe múltiplos arquivos CSV e retorna preview dos dados
    sem salvar no banco
    """
    from .csv_parser import processar_multiplos_arquivos
    import uuid
    
    try:
        # Verifica se há arquivos no request
        if 'arquivos' not in request.files:
            return jsonify({
                'erro': '❌ Nenhum arquivo foi enviado.\n\n💡 Solução: Selecione pelo menos um arquivo CSV e tente novamente.'
            }), 400
        
        arquivos = request.files.getlist('arquivos')
        
        if len(arquivos) == 0:
            return jsonify({
                'erro': '❌ Nenhum arquivo válido foi enviado.\n\n💡 Solução: Certifique-se de selecionar arquivos no formato CSV.'
            }), 400
        
        # Processa cada arquivo
        arquivos_para_processar = []
        for arquivo in arquivos:
            if arquivo.filename == '':
                continue
            
            # Lê o conteúdo do arquivo
            arquivo_bytes = arquivo.read()
            arquivos_para_processar.append((arquivo_bytes, arquivo.filename))
        
        if len(arquivos_para_processar) == 0:
            return jsonify({
                'erro': '❌ Nenhum arquivo válido foi encontrado.\n\nVerifique se:\n• Os arquivos são do tipo CSV\n• Os arquivos não estão vazios\n• Os arquivos têm conteúdo válido'
            }), 400
        
        # Processa todos os arquivos
        resultado = processar_multiplos_arquivos(arquivos_para_processar)
        
        # Para cada arquivo processado com sucesso, verifica se o cliente existe
        # e se a competência já existe no banco
        for arquivo_result in resultado['arquivos_processados']:
            if arquivo_result['status'] != 'ok':
                continue
            
            cnpj = arquivo_result['cnpj']
            
            # Busca o cliente no banco (sem formatação, apenas dígitos)
            # Remove qualquer formatação do CNPJ para comparação
            import re
            cnpj_limpo = re.sub(r'[^\d]', '', cnpj)
            
            # Busca compatível com SQLite e PostgreSQL
            # Busca todos e filtra no Python (mais compatível)
            cliente = None
            for c in Cliente.query.all():
                cnpj_db_limpo = re.sub(r'[^\d]', '', c.cnpj or '')
                if cnpj_db_limpo == cnpj_limpo:
                    cliente = c
                    break
            
            if not cliente:
                arquivo_result['status'] = 'nao_cadastrado'
                arquivo_result['avisos'].append(
                    f"Cliente com CNPJ {cnpj_limpo} não está cadastrado."
                )
                arquivo_result['cliente_info'] = None
                arquivo_result['precisa_cadastrar'] = True
                continue
            
            # Adiciona informações do cliente
            arquivo_result['cliente_info'] = {
                'id': cliente.id,
                'razao_social': cliente.razao_social,
                'cnpj_formatado': cliente.cnpj
            }
            
            # Para cada competência, verifica se já existe no banco
            for competencia in arquivo_result['competencias']:
                mes = competencia['mes']
                ano = competencia['ano']
                
                processamento_existente = Processamento.query.filter_by(
                    cliente_id=cliente.id,
                    mes=mes,
                    ano=ano
                ).first()
                
                competencia['ja_existe'] = processamento_existente is not None
                
                if processamento_existente:
                    arquivo_result['avisos'].append(
                        f"Competência {mes:02d}/{ano} já existe no sistema"
                    )
                    competencia['faturamento_anterior'] = float(processamento_existente.faturamento_total)
                    
                    # Verifica notas duplicadas
                    notas_duplicadas = []
                    for nota in competencia['notas']:
                        numero_nf = nota.get('numero_nf', '')
                        if numero_nf:
                            # Busca se esta NF já existe para este cliente e competência
                            detalhe_existente = db.session.query(FaturamentoDetalhe).join(
                                Processamento
                            ).filter(
                                Processamento.cliente_id == cliente.id,
                                Processamento.mes == mes,
                                Processamento.ano == ano,
                                FaturamentoDetalhe.descricao_servico.contains(f"NF {numero_nf}")
                            ).first()
                            
                            if detalhe_existente:
                                notas_duplicadas.append({
                                    'numero_nf': numero_nf,
                                    'valor': nota['valor'],
                                    'tomador': nota.get('razao_social_tomador', '')
                                })
                    
                    if notas_duplicadas:
                        competencia['notas_duplicadas'] = notas_duplicadas
                        competencia['total_duplicadas'] = len(notas_duplicadas)
                        arquivo_result['avisos'].append(
                            f"⚠️ {len(notas_duplicadas)} nota(s) duplicada(s) encontrada(s) em {mes:02d}/{ano}"
                        )
                    else:
                        competencia['notas_duplicadas'] = []
                        competencia['total_duplicadas'] = 0
                else:
                    competencia['faturamento_anterior'] = 0
                    competencia['notas_duplicadas'] = []
                    competencia['total_duplicadas'] = 0
        
        # Gera IDs temporários para cada arquivo
        for arquivo_result in resultado['arquivos_processados']:
            arquivo_result['id_temporario'] = str(uuid.uuid4())
        
        return jsonify(resultado), 200
        
    except Exception as e:
        current_app.logger.error(f"Erro no upload preview: {str(e)}", exc_info=True)
        return jsonify({'erro': f"Erro ao processar arquivos: {str(e)}"}), 500


@api_bp.route('/faturamento/cadastrar-cliente-csv', methods=['POST'])
@token_required
def cadastrar_cliente_csv(current_user):
    """
    Cadastra um cliente automaticamente durante a importação CSV
    Busca dados na API da Receita Federal
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('cnpj'):
            return jsonify({'erro': 'CNPJ é obrigatório'}), 400
        
        cnpj = data['cnpj']
        
        # Limpa o CNPJ
        import re
        cnpj_limpo = re.sub(r'[^\d]', '', cnpj)
        
        # Verifica se já existe (compatível com SQLite e PostgreSQL)
        cliente_existente = None
        for c in Cliente.query.all():
            cnpj_db_limpo = re.sub(r'[^\d]', '', c.cnpj or '')
            if cnpj_db_limpo == cnpj_limpo:
                cliente_existente = c
                break
        
        if cliente_existente:
            return jsonify({
                'sucesso': True,
                'cliente': {
                    'id': cliente_existente.id,
                    'razao_social': cliente_existente.razao_social,
                    'cnpj': cliente_existente.cnpj
                },
                'mensagem': 'Cliente já cadastrado'
            }), 200
        
        # Busca na API da Receita Federal
        try:
            response = requests.get(
                f'https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}',
                timeout=15
            )
            
            if response.status_code == 404:
                return jsonify({
                    'erro': f'❌ CNPJ {cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]} não encontrado na Receita Federal.\n\n💡 Solução: Verifique se o CNPJ está correto e ativo.'
                }), 404
            
            if response.status_code != 200:
                return jsonify({
                    'erro': f'❌ Erro ao consultar a Receita Federal (Status {response.status_code}).\n\n💡 Solução: A Receita Federal pode estar fora do ar. Tente novamente em alguns minutos.'
                }), 502
            
            dados_api = response.json()
            
            # Cria o cliente com dados da API
            import json
            
            cnaes_secundarios = [
                f"{cnae.get('codigo', '')} - {cnae.get('descricao', '')}"
                for cnae in dados_api.get('cnaes_secundarios', [])
            ]
            
            novo_cliente = Cliente(
                razao_social=dados_api.get('razao_social', ''),
                cnpj=cnpj_limpo,
                regime_tributario='SIMPLES_NACIONAL',  # Padrão
                nome_fantasia=dados_api.get('nome_fantasia'),
                data_abertura=dados_api.get('data_inicio_atividade'),
                situacao_cadastral=dados_api.get('descricao_situacao_cadastral'),
                natureza_juridica=f"{dados_api.get('codigo_natureza_juridica', '')} - {dados_api.get('natureza_juridica', '')}",
                cnae_principal=f"{dados_api.get('cnae_fiscal', '')} - {dados_api.get('cnae_fiscal_descricao', '')}",
                cnae_secundarias=json.dumps(cnaes_secundarios) if cnaes_secundarios else None,
                logradouro=dados_api.get('logradouro'),
                numero=dados_api.get('numero'),
                complemento=dados_api.get('complemento'),
                bairro=dados_api.get('bairro'),
                cep=dados_api.get('cep'),
                municipio=dados_api.get('municipio'),
                uf=dados_api.get('uf'),
                telefone1=dados_api.get('ddd_telefone_1'),
                email=dados_api.get('email'),
                capital_social=str(dados_api.get('capital_social', 0)),
                porte=dados_api.get('porte')
            )
            
            db.session.add(novo_cliente)
            db.session.commit()
            
            # Log de auditoria
            log_action(current_user.id, 'CREATE', 'CLIENTE', novo_cliente.id, {
                'razao_social': novo_cliente.razao_social,
                'cnpj': novo_cliente.cnpj,
                'regime_tributario': novo_cliente.regime_tributario,
                'origem': 'CSV'
            })
            
            return jsonify({
                'sucesso': True,
                'cliente': {
                    'id': novo_cliente.id,
                    'razao_social': novo_cliente.razao_social,
                    'cnpj': novo_cliente.cnpj
                },
                'mensagem': 'Cliente cadastrado com sucesso'
            }), 201
            
        except requests.Timeout:
            return jsonify({
                'erro': '⏱️ Timeout ao consultar a Receita Federal.\n\nA API está demorando muito para responder.\n\n💡 Solução: Aguarde 30 segundos e tente novamente.'
            }), 504
        except requests.ConnectionError:
            return jsonify({
                'erro': '🌐 Erro de conexão ao consultar a Receita Federal.\n\n💡 Solução: Verifique sua conexão com a internet e tente novamente.'
            }), 503
        except Exception as e:
            current_app.logger.error(f"Erro ao cadastrar cliente via CSV: {str(e)}", exc_info=True)
            return jsonify({
                'erro': f'❌ Erro ao processar dados da Receita Federal.\n\nDetalhes técnicos: {str(e)}\n\n💡 Solução: Tente novamente ou cadastre o cliente manualmente.'
            }), 500
            
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro no cadastro via CSV: {str(e)}", exc_info=True)
        return jsonify({'erro': f'Erro ao cadastrar cliente: {str(e)}'}), 500


@api_bp.route('/faturamento/consolidar', methods=['POST'])
@token_required
def consolidar_csv(current_user):
    """
    Consolida os dados do CSV no banco de dados
    Recebe os dados já processados do preview
    """
    try:
        data = request.get_json()
        
        if not data or 'arquivos' not in data:
            return jsonify({'erro': 'Dados inválidos'}), 400
        
        arquivos_para_consolidar = data['arquivos']
        # Agora recebe substituicoes por competência
        substituicoes = data.get('substituicoes', {})  # Dict: {arquivo_id: {mes_ano: bool}}
        
        resultados = []
        
        for arquivo_data in arquivos_para_consolidar:
            try:
                cnpj = arquivo_data['cnpj']
                cliente_id = arquivo_data['cliente_info']['id']
                
                # Busca o cliente
                cliente = Cliente.query.get(cliente_id)
                if not cliente:
                    resultados.append({
                        'arquivo': arquivo_data['nome_arquivo'],
                        'status': 'erro',
                        'mensagem': f"Cliente ID {cliente_id} não encontrado"
                    })
                    continue
                
                # Processa cada competência
                for competencia in arquivo_data['competencias']:
                    mes = competencia['mes']
                    ano = competencia['ano']
                    chave_competencia = f"{mes}_{ano}"
                    
                    # Verifica se já existe
                    processamento_existente = Processamento.query.filter_by(
                        cliente_id=cliente_id,
                        mes=mes,
                        ano=ano
                    ).first()
                    
                    if processamento_existente:
                        # Verifica se deve substituir esta competência específica
                        arquivo_id = arquivo_data.get('id_temporario')
                        deve_substituir = substituicoes.get(arquivo_id, {}).get(chave_competencia, False)
                        
                        if deve_substituir:
                            # Conta o número de notas antes de deletar
                            total_notas_antigo = len(processamento_existente.detalhes) if processamento_existente.detalhes else 0
                            
                            # Salva o processamento na lixeira antes de substituir
                            salvar_na_lixeira('PROCESSAMENTO', processamento_existente, current_user.id, 
                                            'Substituído por nova importação')
                            
                            # Registra log da exclusão (substituição)
                            log_action(current_user.id, 'DELETE', 'FATURAMENTO', processamento_existente.id, {
                                'cliente_id': cliente_id,
                                'cliente_nome': cliente.razao_social,
                                'mes': mes,
                                'ano': ano,
                                'total_notas': total_notas_antigo,
                                'motivo': 'Substituído por nova importação (salvo na lixeira)'
                            })
                            
                            # Remove o processamento antigo e suas notas
                            FaturamentoDetalhe.query.filter_by(
                                processamento_id=processamento_existente.id
                            ).delete()
                            db.session.delete(processamento_existente)
                            db.session.flush()
                            
                            current_app.logger.info(f"Competência {mes:02d}/{ano} substituída para cliente {cliente_id}")
                        else:
                            # Pula esta competência
                            resultados.append({
                                'arquivo': arquivo_data['nome_arquivo'],
                                'competencia': f"{mes:02d}/{ano}",
                                'status': 'ignorado',
                                'mensagem': 'Competência já existe e não foi marcada para substituição'
                            })
                            continue
                    
                    # Cria novo processamento seguindo o padrão do seed
                    from decimal import Decimal
                    
                    faturamento_total = sum(nota['valor'] for nota in competencia['notas'])
                    
                    # Prepara as notas detalhadas (usando descricao_servico, igual ao seed)
                    detalhes_mes = []
                    for nota in competencia['notas']:
                        # Inclui número da NF na descrição para verificação de duplicatas
                        numero_nf = nota.get('numero_nf', '')
                        tomador = nota.get('razao_social_tomador', 'Serviço Prestado')
                        
                        if numero_nf:
                            descricao = f"NF {numero_nf} - {tomador}"[:200]
                        else:
                            descricao = tomador[:200]
                        
                        detalhe = FaturamentoDetalhe(
                            descricao_servico=descricao,
                            valor=Decimal(str(nota['valor']))
                        )
                        detalhes_mes.append(detalhe)
                    
                    # Calcula o imposto usando a função do services (igual ao seed)
                    # A função retorna um Decimal diretamente
                    try:
                        imposto_calculado_valor = calcular_imposto_simples_nacional(
                            cliente_id=cliente_id,
                            mes_calculo=mes,
                            ano_calculo=ano,
                            faturamento_mes_atual=float(faturamento_total)
                        )
                        
                        imposto_calculado = Decimal(str(imposto_calculado_valor)).quantize(Decimal('0.01'))
                        
                        current_app.logger.info(f"Imposto calculado para competência {mes:02d}/{ano}: R$ {imposto_calculado}")
                    except Exception as e:
                        current_app.logger.error(f"Erro ao calcular imposto: {str(e)}", exc_info=True)
                        imposto_calculado = Decimal('0.00')
                    
                    # Cria o processamento com os detalhes (igual ao seed)
                    novo_processamento = Processamento(
                        cliente_id=cliente_id,
                        mes=mes,
                        ano=ano,
                        faturamento_total=Decimal(str(faturamento_total)),
                        imposto_calculado=imposto_calculado,
                        nome_arquivo_original=arquivo_data['nome_arquivo'],
                        detalhes=detalhes_mes  # Relationship do SQLAlchemy
                    )
                    
                    db.session.add(novo_processamento)
                    # Commit individual para que o próximo cálculo tenha os dados corretos (igual ao seed)
                    db.session.commit()
                    
                    # Registra log de auditoria da importação
                    log_action(current_user.id, 'CREATE', 'FATURAMENTO', novo_processamento.id, {
                        'cliente_id': cliente_id,
                        'cliente_nome': cliente.razao_social,
                        'mes': mes,
                        'ano': ano,
                        'total_notas': len(competencia['notas']),
                        'faturamento_total': float(faturamento_total)
                    })
                    
                    resultados.append({
                        'arquivo': arquivo_data['nome_arquivo'],
                        'competencia': f"{mes:02d}/{ano}",
                        'status': 'sucesso',
                        'mensagem': f"{competencia['total_notas']} notas importadas",
                        'faturamento_total': faturamento_total
                    })
                
            except Exception as e:
                current_app.logger.error(f"Erro ao consolidar arquivo {arquivo_data.get('nome_arquivo')}: {str(e)}", exc_info=True)
                resultados.append({
                    'arquivo': arquivo_data.get('nome_arquivo', 'desconhecido'),
                    'status': 'erro',
                    'mensagem': str(e)
                })
                # Não faz rollback ainda, continua processando outros arquivos
        
        # Commit de tudo de uma vez
        db.session.commit()
        
        # Conta sucessos e erros
        total_sucesso = len([r for r in resultados if r['status'] == 'sucesso'])
        total_erro = len([r for r in resultados if r['status'] == 'erro'])
        total_ignorado = len([r for r in resultados if r['status'] == 'ignorado'])
        
        return jsonify({
            'resultados': resultados,
            'resumo': {
                'total_processado': len(resultados),
                'sucesso': total_sucesso,
                'erro': total_erro,
                'ignorado': total_ignorado
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro na consolidação: {str(e)}", exc_info=True)
        return jsonify({'erro': f"Erro ao consolidar dados: {str(e)}"}), 500

# ==================== ROTAS DE CONTADOR ====================

@api_bp.route("/contadores", methods=["GET"])
@token_required
def get_contadores(current_user):
    """Lista todos os contadores (apenas ativos)"""
    contadores = Contador.query.filter_by(ativo=True).all()
    return jsonify([contador.to_dict() for contador in contadores])

@api_bp.route("/contadores/<int:contador_id>", methods=["GET"])
@token_required
def get_contador(current_user, contador_id):
    """Busca um contador específico"""
    contador = Contador.query.get(contador_id)
    if not contador:
        return jsonify({"erro": "Contador não encontrado"}), 404
    return jsonify(contador.to_dict())

@api_bp.route("/contadores", methods=["POST"])
@token_required
def create_contador(current_user):
    """Cria um novo contador (apenas admin)"""
    if current_user.papel != 'ADMIN':
        return jsonify({"erro": "Acesso negado. Apenas administradores podem criar contadores."}), 403
    
    data = request.get_json()
    
    # Validação de campos obrigatórios
    campos_obrigatorios = ['nome', 'cpf', 'crc', 'pix', 'banco', 'agencia', 'conta_corrente']
    for campo in campos_obrigatorios:
        if not data.get(campo):
            return jsonify({"erro": f"O campo '{campo}' é obrigatório"}), 400
    
    # Verifica se já existe contador com esse CPF
    if Contador.query.filter_by(cpf=data['cpf']).first():
        return jsonify({"erro": f"Já existe um contador cadastrado com o CPF {data['cpf']}"}), 409
    
    novo_contador = Contador(
        nome=data['nome'],
        cpf=data['cpf'],
        crc=data['crc'],
        pix=data['pix'],
        banco=data['banco'],
        agencia=data['agencia'],
        conta_corrente=data['conta_corrente'],
        imagem_assinatura=data.get('imagem_assinatura'),
        imagem_logo=data.get('imagem_logo')
    )
    
    db.session.add(novo_contador)
    db.session.commit()
    
    # Log de auditoria
    log_action(current_user.id, 'CREATE', 'CONTADOR', novo_contador.id, {
        'nome': novo_contador.nome,
        'cpf': novo_contador.cpf,
        'crc': novo_contador.crc
    })
    
    return jsonify({
        "mensagem": "Contador criado com sucesso!",
        "contador": novo_contador.to_dict()
    }), 201

@api_bp.route("/contadores/<int:contador_id>", methods=["PUT"])
@token_required
def update_contador(current_user, contador_id):
    """Atualiza um contador (apenas admin)"""
    if current_user.papel != 'ADMIN':
        return jsonify({"erro": "Acesso negado. Apenas administradores podem editar contadores."}), 403
    
    contador = Contador.query.get(contador_id)
    if not contador:
        return jsonify({"erro": "Contador não encontrado"}), 404
    
    data = request.get_json()
    
    # Atualiza os campos
    campos_atualizaveis = ['nome', 'cpf', 'crc', 'pix', 'banco', 'agencia', 'conta_corrente', 
                           'imagem_assinatura', 'imagem_logo', 'ativo']
    
    dados_alterados = {}
    for campo in campos_atualizaveis:
        if campo in data:
            valor_antigo = getattr(contador, campo)
            valor_novo = data[campo]
            if valor_antigo != valor_novo:
                dados_alterados[campo] = {'de': valor_antigo, 'para': valor_novo}
                setattr(contador, campo, valor_novo)
    
    db.session.commit()
    
    # Log de auditoria
    if dados_alterados:
        log_action(current_user.id, 'UPDATE', 'CONTADOR', contador.id, dados_alterados)
    
    return jsonify({
        "mensagem": "Contador atualizado com sucesso!",
        "contador": contador.to_dict()
    })

@api_bp.route("/contadores/<int:contador_id>", methods=["DELETE"])
@token_required
def delete_contador(current_user, contador_id):
    """Desativa um contador (soft delete - apenas admin)"""
    if current_user.papel != 'ADMIN':
        return jsonify({"erro": "Acesso negado. Apenas administradores podem excluir contadores."}), 403
    
    contador = Contador.query.get(contador_id)
    if not contador:
        return jsonify({"erro": "Contador não encontrado"}), 404
    
    # Soft delete
    contador.ativo = False
    db.session.commit()
    
    # Log de auditoria
    log_action(current_user.id, 'DELETE', 'CONTADOR', contador.id, {
        'nome': contador.nome,
        'cpf': contador.cpf
    })
    
    return jsonify({"mensagem": "Contador desativado com sucesso!"})

# ==================== ROTAS DE RECIBO ====================

@api_bp.route("/recibos", methods=["GET"])
@token_required
def get_recibos(current_user):
    """Lista todos os recibos"""
    recibos = Recibo.query.order_by(Recibo.data_emissao.desc()).all()
    return jsonify([recibo.to_dict() for recibo in recibos])

@api_bp.route("/recibos/<int:recibo_id>", methods=["GET"])
@token_required
def get_recibo(current_user, recibo_id):
    """Busca um recibo específico com todos os dados relacionados"""
    recibo = Recibo.query.get(recibo_id)
    if not recibo:
        return jsonify({"erro": "Recibo não encontrado"}), 404
    return jsonify(recibo.to_dict())

@api_bp.route("/recibos", methods=["POST"])
@token_required
def create_recibo(current_user):
    """Cria um novo recibo"""
    data = request.get_json()
    
    # Validação de campos obrigatórios
    campos_obrigatorios = ['cliente_id', 'contador_id', 'mes', 'ano', 'valor', 'tipo_servico']
    for campo in campos_obrigatorios:
        if campo not in data:
            return jsonify({"erro": f"O campo '{campo}' é obrigatório"}), 400
    
    # Validações
    if data['tipo_servico'] not in ['honorarios', 'outros']:
        return jsonify({"erro": "tipo_servico deve ser 'honorarios' ou 'outros'"}), 400
    
    if data['tipo_servico'] == 'outros' and not data.get('descricao_servico'):
        return jsonify({"erro": "descricao_servico é obrigatório quando tipo_servico é 'outros'"}), 400
    
    # Verifica se cliente existe
    cliente = Cliente.query.get(data['cliente_id'])
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    # Verifica se contador existe
    contador = Contador.query.get(data['contador_id'])
    if not contador:
        return jsonify({"erro": "Contador não encontrado"}), 404
    
    # Gera número do recibo (formato: REC-YYYYMMDD-NNNN)
    from datetime import datetime
    hoje = datetime.now()
    ultimo_recibo_hoje = Recibo.query.filter(
        Recibo.numero_recibo.like(f"REC-{hoje.strftime('%Y%m%d')}-%")
    ).order_by(Recibo.numero_recibo.desc()).first()
    
    if ultimo_recibo_hoje:
        ultimo_numero = int(ultimo_recibo_hoje.numero_recibo.split('-')[-1])
        proximo_numero = ultimo_numero + 1
    else:
        proximo_numero = 1
    
    numero_recibo = f"REC-{hoje.strftime('%Y%m%d')}-{proximo_numero:04d}"
    
    novo_recibo = Recibo(
        cliente_id=data['cliente_id'],
        contador_id=data['contador_id'],
        mes=data['mes'],
        ano=data['ano'],
        valor=data['valor'],
        tipo_servico=data['tipo_servico'],
        descricao_servico=data.get('descricao_servico'),
        numero_recibo=numero_recibo,
        usuario_emitente_id=current_user.id
    )
    
    db.session.add(novo_recibo)
    db.session.commit()
    
    # Log de auditoria
    log_action(current_user.id, 'CREATE', 'RECIBO', novo_recibo.id, {
        'numero_recibo': numero_recibo,
        'cliente': cliente.razao_social,
        'valor': float(data['valor']),
        'mes': data['mes'],
        'ano': data['ano']
    })
    
    return jsonify({
        "mensagem": "Recibo criado com sucesso!",
        "recibo": novo_recibo.to_dict()
    }), 201

# ==================== ROTAS DA LIXEIRA ====================

@api_bp.route("/lixeira", methods=["GET"])
@token_required
def get_lixeira(current_user):
    """Lista todos os itens na lixeira (não restaurados)"""
    # Filtros opcionais
    tipo_entidade = request.args.get('tipo_entidade')  # CLIENTE, PROCESSAMENTO, RECIBO
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    
    # Query base
    query = ItemExcluido.query.filter_by(restaurado=False)
    
    # Aplicar filtro de tipo se fornecido
    if tipo_entidade:
        query = query.filter_by(tipo_entidade=tipo_entidade.upper())
    
    # Ordenar por data de exclusão (mais recentes primeiro)
    query = query.order_by(ItemExcluido.data_exclusao.desc())
    
    # Paginação
    itens_paginados = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'itens': [item.to_dict() for item in itens_paginados.items],
        'total': itens_paginados.total,
        'pages': itens_paginados.pages,
        'current_page': page,
        'per_page': per_page
    })

@api_bp.route("/lixeira/<int:item_id>/restaurar", methods=["POST"])
@token_required
def restaurar_item(current_user, item_id):
    """Restaura um item da lixeira"""
    import json
    
    item = ItemExcluido.query.get(item_id)
    if not item:
        return jsonify({"erro": "Item não encontrado na lixeira"}), 404
    
    if item.restaurado:
        return jsonify({"erro": "Este item já foi restaurado"}), 400
    
    try:
        dados = json.loads(item.dados_json)
        
        # Restaurar conforme o tipo de entidade
        if item.tipo_entidade == 'CLIENTE':
            # Verificar se já existe um cliente com este CNPJ
            if Cliente.query.filter_by(cnpj=dados.get('cnpj')).first():
                return jsonify({"erro": "Já existe um cliente com este CNPJ cadastrado"}), 409
            
            # Criar novo cliente com os dados salvos
            cliente_restaurado = Cliente(
                razao_social=dados.get('razao_social'),
                cnpj=dados.get('cnpj'),
                regime_tributario=dados.get('regime_tributario'),
                nome_fantasia=dados.get('nome_fantasia'),
                data_abertura=dados.get('data_abertura'),
                situacao_cadastral=dados.get('situacao_cadastral'),
                data_situacao=dados.get('data_situacao'),
                motivo_situacao=dados.get('motivo_situacao'),
                natureza_juridica=dados.get('natureza_juridica'),
                cnae_principal=dados.get('cnae_principal'),
                cnae_secundarias=json.dumps(dados.get('cnae_secundarias', [])) if dados.get('cnae_secundarias') else None,
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
            db.session.add(cliente_restaurado)
            
        elif item.tipo_entidade == 'PROCESSAMENTO':
            return jsonify({"erro": "Restauração de processamentos ainda não implementada"}), 501
            
        elif item.tipo_entidade == 'RECIBO':
            return jsonify({"erro": "Restauração de recibos ainda não implementada"}), 501
        
        else:
            return jsonify({"erro": f"Tipo de entidade desconhecido: {item.tipo_entidade}"}), 400
        
        # Marcar item como restaurado
        item.restaurado = True
        item.data_restauracao = datetime.utcnow()
        item.usuario_restauracao_id = current_user.id
        
        db.session.commit()
        
        # Log de auditoria
        log_action(current_user.id, 'RESTORE', item.tipo_entidade, item_id, {
            'entidade_id_original': item.entidade_id_original,
            'tipo': item.tipo_entidade
        })
        
        return jsonify({
            "mensagem": f"{item.tipo_entidade} restaurado com sucesso!",
            "item": item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao restaurar item: {e}")
        return jsonify({"erro": f"Erro ao restaurar item: {str(e)}"}), 500

@api_bp.route("/lixeira/<int:item_id>", methods=["DELETE"])
@token_required
def deletar_permanente_item(current_user, item_id):
    """Deleta permanentemente um item da lixeira"""
    item = ItemExcluido.query.get(item_id)
    if not item:
        return jsonify({"erro": "Item não encontrado na lixeira"}), 404
    
    tipo = item.tipo_entidade
    entidade_id = item.entidade_id_original
    
    db.session.delete(item)
    db.session.commit()
    
    # Log de auditoria
    log_action(current_user.id, 'DELETE_PERMANENT', tipo, entidade_id, {
        'lixeira_id': item_id
    })
    
    return jsonify({
        "mensagem": "Item deletado permanentemente da lixeira"
    }), 200

@api_bp.route("/lixeira/tipos", methods=["GET"])
@token_required
def get_tipos_lixeira(current_user):
    """Retorna os tipos de entidades disponíveis na lixeira"""
    tipos = db.session.query(ItemExcluido.tipo_entidade).filter_by(restaurado=False).distinct().all()
    return jsonify([tipo[0] for tipo in tipos])

# ==================== ROTAS DE CNAE ====================

@api_bp.route("/cnae/listar-todos", methods=["GET"])
@token_required
def listar_todos_cnaes(current_user):
    """Lista todos os CNAEs do banco (ou limitado por página)"""
    try:
        pagina = int(request.args.get('pagina', 1))
        por_pagina = int(request.args.get('por_pagina', 50))
        
        # Limitar máximo por página
        if por_pagina > 100:
            por_pagina = 100
        
        # Paginar resultados
        paginacao = CNAE.query.order_by(CNAE.codigo).paginate(
            page=pagina,
            per_page=por_pagina,
            error_out=False
        )
        
        current_app.logger.info(f"[CNAE] Listar todos - Página {pagina}, {len(paginacao.items)} resultados")
        
        return jsonify({
            "total": paginacao.total,
            "pagina_atual": paginacao.page,
            "total_paginas": paginacao.pages,
            "por_pagina": por_pagina,
            "resultados": [cnae.to_dict() for cnae in paginacao.items]
        })
    except Exception as e:
        current_app.logger.error(f"[CNAE] Erro ao listar todos: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"erro": f"Erro ao listar CNAEs: {str(e)}"}), 500

@api_bp.route("/cnae/buscar", methods=["GET"])
@token_required
def buscar_cnae(current_user):
    """
    Busca CNAEs por código ou descrição com normalização de texto e busca fuzzy
    Parâmetros de query:
    - q: Termo de busca (código ou descrição)
    - limite: Número máximo de resultados (padrão: 50)
    """
    try:
        termo_busca = request.args.get('q', '').strip()
        limite = int(request.args.get('limite', 50))
        
        current_app.logger.info(f"[CNAE] Busca recebida: termo='{termo_busca}', limite={limite}")
        
        if not termo_busca:
            return jsonify({"erro": "Parâmetro 'q' é obrigatório"}), 400
        
        # Limitar o limite máximo para evitar sobrecarga
        if limite > 100:
            limite = 100
        
        # Limpar código (remove pontuações)
        termo_limpo = limpar_codigo(termo_busca)
        
        # Busca inteligente:
        # 1. Se o termo contém apenas números, busca por código (ignorando formatação)
        # 2. Se contém letras, busca por descrição (ignorando acentos e com similaridade)
        
        if termo_limpo.isdigit():
            current_app.logger.info(f"[CNAE] Busca por código numérico: {termo_limpo}")
            
            # Busca por código ignorando pontuações
            # Usa REPLACE do SQLite para remover formatação do banco também
            resultados = CNAE.query.filter(
                func.replace(
                    func.replace(
                        func.replace(CNAE.codigo, '.', ''),
                        '-', ''
                    ),
                    '/', ''
                ).like(f'%{termo_limpo}%')
            ).limit(limite).all()
            
        else:
            current_app.logger.info(f"[CNAE] Busca por descrição: {termo_busca}")
            
            # Normalizar o termo de busca (remove acentos)
            termo_normalizado = normalizar_texto(termo_busca).lower()
            
            current_app.logger.info(f"[CNAE] Termo normalizado: {termo_normalizado}")
            
            # Extrai radical do termo para buscar palavras relacionadas
            radical_termo = extrair_radical(termo_normalizado)
            current_app.logger.info(f"[CNAE] Radical extraído: {radical_termo}")
            
            # Busca todos os CNAEs e calcula score de relevância
            todos_cnaes = CNAE.query.all()
            
            resultados_com_score = []
            
            for cnae in todos_cnaes:
                score = 0
                descricao_norm = normalizar_texto(cnae.descricao or '').lower()
                desc_grupo_norm = normalizar_texto(cnae.descricao_grupo or '').lower()
                desc_divisao_norm = normalizar_texto(cnae.descricao_divisao or '').lower()
                desc_secao_norm = normalizar_texto(cnae.descricao_secao or '').lower()
                
                # 1. MATCH EXATO (score mais alto: 100)
                if termo_normalizado in descricao_norm:
                    score = 100
                elif termo_normalizado in desc_grupo_norm:
                    score = 95
                elif termo_normalizado in desc_divisao_norm:
                    score = 90
                elif termo_normalizado in desc_secao_norm:
                    score = 85
                
                # 2. MATCH POR RADICAL (score alto: 80-70)
                elif radical_termo and len(radical_termo) >= 4:
                    # Verifica se o radical está presente
                    if radical_termo in descricao_norm:
                        score = 80
                    elif radical_termo in desc_grupo_norm:
                        score = 75
                    elif radical_termo in desc_divisao_norm or radical_termo in desc_secao_norm:
                        score = 70
                
                # 3. BUSCA POR PALAVRAS INDIVIDUAIS (score médio: 60-50)
                if score == 0:
                    palavras_termo = [p for p in termo_normalizado.split() if len(p) >= 3]
                    for palavra in palavras_termo:
                        radical_palavra = extrair_radical(palavra)
                        if palavra in descricao_norm or (radical_palavra and radical_palavra in descricao_norm):
                            score = max(score, 60)
                        elif palavra in desc_grupo_norm or (radical_palavra and radical_palavra in desc_grupo_norm):
                            score = max(score, 55)
                        elif palavra in desc_divisao_norm or palavra in desc_secao_norm:
                            score = max(score, 50)
                
                # 4. FUZZY MATCHING - SIMILARIDADE (score baixo: 40-30)
                if score == 0 and len(termo_normalizado) >= 5:
                    # Calcula similaridade com as palavras da descrição
                    palavras_desc = descricao_norm.split()
                    max_similaridade = 0
                    
                    for palavra_desc in palavras_desc:
                        if len(palavra_desc) >= 4:
                            similaridade = calcular_similaridade(termo_normalizado, palavra_desc)
                            max_similaridade = max(max_similaridade, similaridade)
                            
                            # Similaridade alta (80%+) - provavelmente erro de digitação
                            if similaridade >= 80:
                                score = 40
                                break
                            # Similaridade média (70%+) - palavras parecidas
                            elif similaridade >= 70:
                                score = max(score, 35)
                            # Similaridade razoável (60%+)
                            elif similaridade >= 60:
                                score = max(score, 30)
                
                # Se teve algum match, adiciona aos resultados
                if score > 0:
                    resultados_com_score.append((cnae, score))
            
            # Ordena por score (maior primeiro) e depois por código
            resultados_com_score.sort(key=lambda x: (-x[1], x[0].codigo))
            
            # Pega apenas os CNAEs (remove o score) limitando ao número solicitado
            resultados = [cnae for cnae, score in resultados_com_score[:limite]]
            
            current_app.logger.info(f"[CNAE] Top 5 scores: {[(c.codigo, s) for c, s in resultados_com_score[:5]]}")
        
        current_app.logger.info(f"[CNAE] Encontrados {len(resultados)} resultados")
        
        resposta = {
            "total": len(resultados),
            "resultados": [cnae.to_dict() for cnae in resultados]
        }
        
        current_app.logger.info(f"[CNAE] Resposta: total={resposta['total']}, resultados_count={len(resposta['resultados'])}")
        
        return jsonify(resposta)
    except Exception as e:
        current_app.logger.error(f"[CNAE] Erro ao buscar: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"erro": f"Erro ao buscar CNAEs: {str(e)}"}), 500

@api_bp.route("/cnae/<string:codigo>", methods=["GET"])
@token_required
def get_cnae_detalhe(current_user, codigo):
    """Retorna detalhes de um CNAE específico"""
    cnae = CNAE.query.filter_by(codigo=codigo).first()
    
    if not cnae:
        return jsonify({"erro": "CNAE não encontrado"}), 404
    
    return jsonify(cnae.to_dict())

@api_bp.route("/cnae/secoes", methods=["GET"])
@token_required
def get_cnae_secoes(current_user):
    """Retorna todas as seções CNAE disponíveis"""
    secoes = db.session.query(
        CNAE.codigo_secao,
        CNAE.descricao_secao
    ).distinct().order_by(CNAE.codigo_secao).all()
    
    return jsonify([
        {"codigo": secao[0], "descricao": secao[1]}
        for secao in secoes
    ])

@api_bp.route("/cnae/divisoes", methods=["GET"])
@token_required
def get_cnae_divisoes(current_user):
    """
    Retorna divisões CNAE
    Parâmetros opcionais:
    - secao: Filtrar por código de seção
    """
    secao = request.args.get('secao')
    
    query = db.session.query(
        CNAE.codigo_divisao,
        CNAE.descricao_divisao
    ).distinct()
    
    if secao:
        query = query.filter(CNAE.codigo_secao == secao)
    
    divisoes = query.order_by(CNAE.codigo_divisao).all()
    
    return jsonify([
        {"codigo": div[0], "descricao": div[1]}
        for div in divisoes
    ])

@api_bp.route("/cnae/grupos", methods=["GET"])
@token_required
def get_cnae_grupos(current_user):
    """
    Retorna grupos CNAE
    Parâmetros opcionais:
    - divisao: Filtrar por código de divisão
    """
    divisao = request.args.get('divisao')
    
    query = db.session.query(
        CNAE.codigo_grupo,
        CNAE.descricao_grupo
    ).distinct()
    
    if divisao:
        query = query.filter(CNAE.codigo_divisao == divisao)
    
    grupos = query.order_by(CNAE.codigo_grupo).all()
    
    return jsonify([
        {"codigo": grupo[0], "descricao": grupo[1]}
        for grupo in grupos
    ])

@api_bp.route("/cnae/estatisticas", methods=["GET"])
@token_required
def get_cnae_estatisticas(current_user):
    """Retorna estatísticas sobre a base de CNAEs"""
    try:
        total = CNAE.query.count()
        total_secoes = db.session.query(CNAE.codigo_secao).distinct().count()
        total_divisoes = db.session.query(CNAE.codigo_divisao).distinct().count()
        total_grupos = db.session.query(CNAE.codigo_grupo).distinct().count()
        
        return jsonify({
            "total_cnaes": total,
            "total_secoes": total_secoes,
            "total_divisoes": total_divisoes,
            "total_grupos": total_grupos
        })
    except Exception as e:
        current_app.logger.error(f"Erro ao buscar estatísticas CNAE: {str(e)}")
        return jsonify({"erro": f"Erro ao buscar estatísticas: {str(e)}"}), 500


# ============================================
# ROTAS DE CONTRATOS
# ============================================

@api_bp.route('/contratos/templates', methods=['GET'])
@token_required
def listar_templates_contratos(current_user):
    """Lista todos os templates de contratos ativos"""
    try:
        tipo_filtro = request.args.get('tipo')
        
        query = TemplateContrato.query.filter_by(ativo=True)
        
        if tipo_filtro:
            query = query.filter_by(tipo=tipo_filtro)
        
        templates = query.order_by(TemplateContrato.nome).all()
        
        return jsonify([t.to_dict() for t in templates]), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar templates: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar templates"}), 500


@api_bp.route('/contratos/templates/<int:template_id>', methods=['GET'])
@token_required
def obter_template_contrato(current_user, template_id):
    """Obtém um template específico"""
    try:
        template = TemplateContrato.query.get(template_id)
        if not template:
            return jsonify({"erro": "Template não encontrado"}), 404
        
        return jsonify(template.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter template: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar template"}), 500


@api_bp.route('/contratos', methods=['GET'])
@token_required
def listar_contratos(current_user):
    """Lista todos os contratos com filtros opcionais"""
    try:
        tipo_filtro = request.args.get('tipo')
        status_filtro = request.args.get('status')
        empresa_id = request.args.get('empresa_id')
        busca = request.args.get('busca', '').strip()
        
        query = Contrato.query
        
        if tipo_filtro:
            query = query.filter_by(tipo=tipo_filtro)
        
        if status_filtro:
            query = query.filter_by(status=status_filtro)
        
        if empresa_id:
            query = query.filter_by(empresa_id=empresa_id)
        
        if busca:
            query = query.filter(
                or_(
                    Contrato.titulo.ilike(f'%{busca}%'),
                    Contrato.numero_contrato.ilike(f'%{busca}%')
                )
            )
        
        contratos = query.order_by(Contrato.data_criacao.desc()).all()
        
        return jsonify([c.to_dict() for c in contratos]), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao listar contratos: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar contratos"}), 500


@api_bp.route('/contratos/<int:contrato_id>', methods=['GET'])
@token_required
def obter_contrato(current_user, contrato_id):
    """Obtém um contrato específico"""
    try:
        contrato = Contrato.query.get(contrato_id)
        if not contrato:
            return jsonify({"erro": "Contrato não encontrado"}), 404
        
        return jsonify(contrato.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Erro ao obter contrato: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar contrato"}), 500


def substituir_variaveis(template_texto, dados):
    """Substitui variáveis no formato {{variavel}} pelos dados fornecidos"""
    import re
    
    texto_final = template_texto
    
    # Função para formatar datas
    def formatar_data_extenso(data_str):
        if not data_str:
            return ""
        try:
            from datetime import datetime
            data = datetime.strptime(data_str, "%Y-%m-%d")
            meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
            return f"{data.day} de {meses[data.month-1]} de {data.year}"
        except:
            return data_str
    
    # Função para formatar moeda
    def formatar_moeda(valor):
        if not valor:
            return "0,00"
        try:
            return f"{float(valor):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        except:
            return str(valor)
    
    # Função para formatar estado civil por extenso
    def formatar_estado_civil(estado):
        estados = {
            'solteiro': 'solteiro(a)',
            'casado': 'casado(a)',
            'divorciado': 'divorciado(a)',
            'viuvo': 'viúvo(a)'
        }
        return estados.get(estado, estado)
    
    # Função para formatar regime de comunhão por extenso
    def formatar_regime(regime):
        regimes = {
            'comunhao_parcial': 'Comunhão Parcial de Bens',
            'comunhao_universal': 'Comunhão Universal de Bens',
            'separacao_total': 'Separação Total de Bens',
            'separacao_obrigatoria': 'Separação Obrigatória de Bens',
            'participacao_final': 'Participação Final nos Aquestos'
        }
        return regimes.get(regime, regime)
    
    # Substitui cada variável
    for chave, valor in dados.items():
        placeholder = f"{{{{{chave}}}}}"
        
        # Tratamentos especiais
        if valor is None:
            valor = ""
        elif 'data' in chave and valor and len(str(valor)) == 10:
            valor = formatar_data_extenso(str(valor))
        elif 'valor' in chave or 'capital' in chave:
            valor = formatar_moeda(valor)
        elif 'estado_civil' in chave:
            valor = formatar_estado_civil(str(valor))
        elif 'regime' in chave:
            valor = formatar_regime(str(valor))
        
        texto_final = texto_final.replace(placeholder, str(valor))
    
    return texto_final


def gerar_numero_contrato():
    """Gera número único para o contrato"""
    from datetime import datetime
    ano_atual = datetime.now().year
    
    # Conta quantos contratos existem no ano
    count = Contrato.query.filter(
        func.strftime('%Y', Contrato.data_criacao) == str(ano_atual)
    ).count()
    
    numero = f"CONT-{ano_atual}-{(count + 1):04d}"
    return numero


@api_bp.route('/contratos/opcoes-motivo-extincao', methods=['GET'])
@token_required
def obter_opcoes_motivo_extincao(current_user):
    """
    Retorna as opções disponíveis para motivo de extinção em contratos de distrato
    """
    opcoes = [
        "Extinção, pelo encerramento da liquidação voluntária",
        "Incorporação",
        "Fusão",
        "Cisão Total",
        "Encerramento do processo de falência",
        "Encerramento do processo de liquidação extrajudicial",
        "Extinção, por unificação da inscrição da filial",
        "Transformação do órgão regional à condição de matriz",
        "Transformação do órgão local à condição de filial do órgão regional"
    ]
    
    return jsonify({
        "opcoes": opcoes,
        "total": len(opcoes)
    }), 200

@api_bp.route('/contratos', methods=['POST'])
@token_required
def criar_contrato(current_user):
    """Cria um novo contrato a partir de um template"""
    try:
        data = request.get_json()
        
        # Validações
        if not data.get('template_id'):
            return jsonify({"erro": "Template é obrigatório"}), 400
        
        if not data.get('titulo'):
            return jsonify({"erro": "Título é obrigatório"}), 400
        
        # Busca template
        template = TemplateContrato.query.get(data['template_id'])
        if not template:
            return jsonify({"erro": "Template não encontrado"}), 404
        
        # Prepara dados para substituição
        dados_variaveis = data.get('dados_variaveis', {})
        
        # 🎯 DETECÇÃO AUTOMÁTICA DE CONTRATOS INTELIGENTES
        # Se for contrato de alteração contratual ou distrato, aplica lógica inteligente
        if template.tipo in ['alteracao_contratual', 'distrato'] and data.get('empresa_id'):
            current_app.logger.info(f"[CONTRATO] Detectado contrato de alteração para empresa_id={data['empresa_id']}")
            
            empresa = Cliente.query.get(data['empresa_id'])
            if empresa and empresa.tipo_pessoa == 'PJ':
                # Busca sócios existentes automaticamente
                socios_existentes = []
                capital_social_atual = 0
                socios_atual_descricao = ""
                
                try:
                    socios_db = Socio.query.filter_by(empresa_id=data['empresa_id']).all()
                    current_app.logger.info(f"[CONTRATO] Buscando sócios para empresa_id={data['empresa_id']}, encontrados: {len(socios_db)}")
                    
                    for socio in socios_db:
                        cliente_socio = Cliente.query.get(socio.socio_id)
                        if cliente_socio:
                            # Monta endereço completo do sócio
                            endereco_parts = []
                            if cliente_socio.logradouro:
                                endereco_parts.append(cliente_socio.logradouro)
                            if cliente_socio.numero:
                                endereco_parts.append(cliente_socio.numero)
                            if cliente_socio.complemento:
                                endereco_parts.append(cliente_socio.complemento)
                            if cliente_socio.bairro:
                                endereco_parts.append(cliente_socio.bairro)
                            if cliente_socio.municipio:
                                endereco_parts.append(cliente_socio.municipio)
                            if cliente_socio.uf:
                                endereco_parts.append(cliente_socio.uf)
                            if cliente_socio.cep:
                                endereco_parts.append(f"CEP {cliente_socio.cep}")
                            
                            endereco_completo = ", ".join(endereco_parts) if endereco_parts else ""
                            
                            socios_existentes.append({
                                'id': socio.id,
                                'cliente_id': cliente_socio.id,
                                'nome': cliente_socio.nome_completo,
                                'cpf': cliente_socio.cpf,
                                'rg': cliente_socio.rg,
                                'email': cliente_socio.email,
                                'telefone': cliente_socio.telefone1,
                                'endereco_completo': endereco_completo,
                                'participacao_percentual': float(socio.percentual_participacao or 0),
                                'cargo': socio.cargo
                            })
                            
                            # Calcula capital social (R$ 1000 por 1% como placeholder)
                            valor_participacao = (socio.percentual_participacao or 0) * 1000
                            capital_social_atual += valor_participacao
                            
                            current_app.logger.info(f"[CONTRATO] Sócio encontrado: {cliente_socio.nome_completo} ({cliente_socio.cpf}) - {socio.percentual_participacao}%")
                        else:
                            current_app.logger.warning(f"[CONTRATO] Cliente não encontrado para socio_id: {socio.socio_id}")
                    
                    # Gera descrição dos sócios para o contrato
                    socios_descricao = []
                    for socio in socios_existentes:
                        socios_descricao.append(f"SÓCIO - {socio['nome'].upper()}, nacionalidade Brasileira, {socio.get('estado_civil', 'Não Informado')}, nascido em {socio.get('data_nascimento', 'Não Informado')}, {socio.get('profissao', 'Não Informado')}, inscrito no CPF no. {socio['cpf']}, Identidade no. {socio.get('rg', 'Não Informado')}, residente e domiciliado no(a) {socio['endereco_completo']}")
                    
                    socios_atual_descricao = " e;\n".join(socios_descricao) + " e;" if socios_descricao else ""
                    
                    # Monta endereço completo da empresa
                    endereco_parts = []
                    if empresa.logradouro:
                        endereco_parts.append(empresa.logradouro)
                    if empresa.numero:
                        endereco_parts.append(empresa.numero)
                    if empresa.complemento:
                        endereco_parts.append(empresa.complemento)
                    if empresa.bairro:
                        endereco_parts.append(empresa.bairro)
                    if empresa.municipio:
                        endereco_parts.append(empresa.municipio)
                    if empresa.uf:
                        endereco_parts.append(empresa.uf)
                    if empresa.cep:
                        endereco_parts.append(f"CEP {empresa.cep}")
                    
                    endereco_completo_empresa = ", ".join(endereco_parts) if endereco_parts else ""
                    
                    # Preenche automaticamente os dados que estavam vazios
                    dados_comuns = {
                        'empresa_endereco_completo': endereco_completo_empresa,
                        'empresa_razao_social': empresa.razao_social,
                        'empresa_cnpj': empresa.cnpj,
                        'empresa_nome_fantasia': empresa.nome_fantasia or '',
                        'objeto_social_atualizado': empresa.cnae_principal or '',
                        'valor_quota': "1,00",
                        'valor_quota_extenso': "UM REAL"
                    }
                    
                    # Dados específicos para alteração contratual
                    if template.tipo == 'alteracao_contratual':
                        dados_comuns.update({
                            'socios_atual_descricao': socios_atual_descricao,
                            'capital_social_valor': f"{capital_social_atual:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
                            'capital_social_quotas': int(capital_social_atual)
                        })
                    
                    # Dados específicos para distrato/dissolução
                    elif template.tipo == 'distrato':
                        # Gera lista de sócios qualificados para distrato
                        lista_socios_qualificacao = []
                        distribuicao_patrimonio = []
                        
                        for socio in socios_existentes:
                            # Lista de qualificação dos sócios
                            lista_socios_qualificacao.append(f"{socio['nome'].upper()}, inscrito no CPF no. {socio['cpf']}, residente e domiciliado no(a) {socio['endereco_completo']}")
                            
                            # Distribuição do patrimônio (assumindo patrimônio líquido de R$ 5.000)
                            patrimonio_liquido = 5000  # Valor padrão, pode ser ajustado
                            valor_socio = (socio['participacao_percentual'] / 100) * patrimonio_liquido
                            distribuicao_patrimonio.append(f"{socio['nome'].upper()}: {socio['participacao_percentual']:.0f}% = R$ {valor_socio:.2f}")
                        
                        # Assinaturas dos sócios
                        assinaturas_socios = []
                        for socio in socios_existentes:
                            assinaturas_socios.append(f"_____________________________________________________\n{socio['nome'].upper()}\nCPF – {socio['cpf']}")
                        
                        # Opções de motivo de extinção
                        opcoes_motivo_extincao = [
                            "Extinção, pelo encerramento da liquidação voluntária",
                            "Incorporação",
                            "Fusão",
                            "Cisão Total",
                            "Encerramento do processo de falência",
                            "Encerramento do processo de liquidação extrajudicial",
                            "Extinção, por unificação da inscrição da filial",
                            "Transformação do órgão regional à condição de matriz",
                            "Transformação do órgão local à condição de filial do órgão regional"
                        ]
                        
                        # Motivo padrão se não especificado
                        motivo_extincao = dados_variaveis.get('motivo_extincao', opcoes_motivo_extincao[0])
                        
                        dados_comuns.update({
                            'lista_socios_qualificacao': "\n".join(lista_socios_qualificacao),
                            'distribuicao_patrimonio': "\n".join(distribuicao_patrimonio),
                            'assinaturas_socios': "\n\n".join(assinaturas_socios),
                            'motivo_extincao': motivo_extincao,
                            'opcoes_motivo_extincao': opcoes_motivo_extincao,
                            'valor_ativo': "5.000,00",
                            'valor_passivo': "0,00", 
                            'valor_patrimonio_liquido': "5.000,00",
                            'data_balanco': "2025-10-22",
                            'cidade_contrato': empresa.municipio or "RIO DE JANEIRO",
                            'uf_contrato': empresa.uf or "RJ",
                            'responsavel_documentacao': "Contador responsável"
                        })
                    
                    dados_variaveis.update(dados_comuns)
                    
                    current_app.logger.info(f"[CONTRATO] Dados automáticos aplicados: sócios={len(socios_existentes)}, capital=R${capital_social_atual:,.2f}")
                    
                except Exception as e:
                    current_app.logger.error(f"[CONTRATO] Erro ao buscar dados automáticos: {e}")
        
        # Adiciona data atual se não fornecida
        if 'data_atual' not in dados_variaveis:
            from datetime import datetime
            dados_variaveis['data_atual'] = datetime.now().strftime("%Y-%m-%d")
        
        # Gera conteúdo substituindo variáveis
        conteudo_gerado = substituir_variaveis(template.conteudo, dados_variaveis)
        
        # Cria contrato
        novo_contrato = Contrato(
            template_id=data['template_id'],
            empresa_id=data.get('empresa_id'),
            numero_contrato=gerar_numero_contrato(),
            titulo=data['titulo'],
            tipo=template.tipo,
            conteudo_gerado=conteudo_gerado,
            dados_variaveis=json.dumps(dados_variaveis, ensure_ascii=False),
            socios_envolvidos=json.dumps(data.get('socios_envolvidos', []), ensure_ascii=False),
            status=data.get('status', 'rascunho'),
            observacoes=data.get('observacoes'),
            usuario_criacao_id=current_user.id
        )
        
        db.session.add(novo_contrato)
        db.session.commit()
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='CREATE',
            entidade='CONTRATO',
            entidade_id=novo_contrato.id,
            detalhes={
                'titulo': novo_contrato.titulo,
                'tipo': novo_contrato.tipo,
                'numero_contrato': novo_contrato.numero_contrato
            },
            ip_address=request.remote_addr
        )
        
        current_app.logger.info(f"Contrato criado: {novo_contrato.titulo} (ID: {novo_contrato.id})")
        
        return jsonify({
            "mensagem": "Contrato criado com sucesso!",
            "contrato": novo_contrato.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao criar contrato: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao criar contrato"}), 500


@api_bp.route('/contratos/<int:contrato_id>', methods=['PUT'])
@token_required
def atualizar_contrato(current_user, contrato_id):
    """Atualiza um contrato existente"""
    try:
        contrato = Contrato.query.get(contrato_id)
        if not contrato:
            return jsonify({"erro": "Contrato não encontrado"}), 404
        
        data = request.get_json()
        
        # Campos atualizáveis
        if 'titulo' in data:
            contrato.titulo = data['titulo']
        
        if 'conteudo_gerado' in data:
            contrato.conteudo_gerado = data['conteudo_gerado']
        
        if 'dados_variaveis' in data:
            contrato.dados_variaveis = json.dumps(data['dados_variaveis'], ensure_ascii=False)
        
        if 'status' in data:
            contrato.status = data['status']
            if data['status'] == 'finalizado' and not contrato.data_finalizacao:
                contrato.data_finalizacao = datetime.utcnow()
        
        if 'observacoes' in data:
            contrato.observacoes = data['observacoes']
        
        db.session.commit()
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='UPDATE',
            entidade='CONTRATO',
            entidade_id=contrato.id,
            detalhes={
                'titulo': contrato.titulo,
                'campos_atualizados': list(data.keys())
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            "mensagem": "Contrato atualizado com sucesso!",
            "contrato": contrato.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar contrato: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao atualizar contrato"}), 500


@api_bp.route('/contratos/<int:contrato_id>', methods=['DELETE'])
@token_required
def deletar_contrato(current_user, contrato_id):
    """Deleta um contrato (move para lixeira)"""
    try:
        contrato = Contrato.query.get(contrato_id)
        if not contrato:
            return jsonify({"erro": "Contrato não encontrado"}), 404
        
        # Salva na lixeira antes de deletar
        salvar_na_lixeira(
            tipo_entidade='CONTRATO',
            entidade_obj=contrato,
            usuario_id=current_user.id,
            motivo=request.args.get('motivo', 'Exclusão manual')
        )
        
        db.session.delete(contrato)
        db.session.commit()
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='DELETE',
            entidade='CONTRATO',
            entidade_id=contrato_id,
            detalhes={
                'titulo': contrato.titulo,
                'numero_contrato': contrato.numero_contrato
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({"mensagem": "Contrato excluído com sucesso!"}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao deletar contrato: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao excluir contrato"}), 500


@api_bp.route('/contratos/<int:contrato_id>/pdf', methods=['GET'])
@token_required
def gerar_pdf_contrato_endpoint(current_user, contrato_id):
    """Gera PDF profissional do contrato"""
    try:
        contrato = Contrato.query.get(contrato_id)
        if not contrato:
            return jsonify({"erro": "Contrato não encontrado"}), 404
        
        # Parâmetro para preview ou download
        preview = request.args.get('preview', 'false').lower() == 'true'
        
        # Gera o PDF
        pdf_buffer = gerar_pdf_contrato(contrato)
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='PREVIEW_PDF' if preview else 'DOWNLOAD_PDF',
            entidade='CONTRATO',
            entidade_id=contrato.id,
            detalhes={
                'titulo': contrato.titulo,
                'numero_contrato': contrato.numero_contrato,
                'modo': 'preview' if preview else 'download'
            },
            ip_address=request.remote_addr
        )
        
        # Prepara nome do arquivo
        nome_arquivo = f"{contrato.numero_contrato}.pdf"
        
        # Retorna o PDF
        from flask import send_file
        if preview:
            # Para preview, retorna inline (abre no navegador)
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=False,
                download_name=nome_arquivo
            )
        else:
            # Para download, retorna como attachment
            return send_file(
                pdf_buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=nome_arquivo
            )
        
    except Exception as e:
        current_app.logger.error(f"Erro ao gerar PDF do contrato: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao gerar PDF"}), 500


@api_bp.route('/clientes/buscar-cpf', methods=['GET'])
@token_required
def buscar_cliente_por_cpf(current_user):
    """
    Busca clientes por CPF para seleção em contratos de alteração
    Parâmetros de query:
    - cpf: CPF para busca (com ou sem formatação)
    - limite: Número máximo de resultados (padrão: 10)
    """
    try:
        cpf_busca = request.args.get('cpf', '').strip()
        limite = int(request.args.get('limite', 10))
        
        current_app.logger.info(f"[CLIENTE] Busca por CPF: '{cpf_busca}', limite={limite}")
        
        if not cpf_busca:
            return jsonify({"erro": "Parâmetro 'cpf' é obrigatório"}), 400
        
        # Limpar CPF (remove pontuações)
        cpf_limpo = limpar_documento(cpf_busca)
        
        # Validar CPF
        if not validar_cpf(cpf_limpo):
            return jsonify({"erro": "CPF inválido"}), 400
        
        # Limitar o limite máximo para evitar sobrecarga
        if limite > 50:
            limite = 50
        
        # Buscar clientes por CPF (busca exata)
        clientes = Cliente.query.filter(
            func.replace(
                func.replace(Cliente.cpf, '.', ''),
                '-', ''
            ) == cpf_limpo
        ).limit(limite).all()
        
        # Converter para formato de resposta
        resultados = []
        for cliente in clientes:
            # Monta endereço completo
            endereco_parts = []
            if cliente.logradouro:
                endereco_parts.append(cliente.logradouro)
            if cliente.numero:
                endereco_parts.append(cliente.numero)
            if cliente.complemento:
                endereco_parts.append(cliente.complemento)
            if cliente.bairro:
                endereco_parts.append(cliente.bairro)
            if cliente.municipio:
                endereco_parts.append(cliente.municipio)
            if cliente.uf:
                endereco_parts.append(cliente.uf)
            if cliente.cep:
                endereco_parts.append(f"CEP {cliente.cep}")
            
            endereco_completo = ", ".join(endereco_parts) if endereco_parts else ""
            
            resultados.append({
                'id': cliente.id,
                'nome': cliente.nome_completo if cliente.tipo_pessoa == 'PF' else cliente.razao_social,
                'cpf': cliente.cpf,
                'email': cliente.email,
                'telefone': cliente.telefone1,
                'endereco_completo': endereco_completo,
                'tipo_pessoa': cliente.tipo_pessoa,
                'ativo': cliente.ativo
            })
        
        current_app.logger.info(f"[CLIENTE] Encontrados {len(resultados)} clientes para CPF {cpf_busca}")
        
        return jsonify({
            "resultados": resultados,
            "total": len(resultados),
            "cpf_buscado": cpf_busca
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"[CLIENTE] Erro ao buscar por CPF: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"erro": f"Erro ao buscar cliente por CPF: {str(e)}"}), 500


@api_bp.route('/empresas/<int:empresa_id>/socios', methods=['GET'])
@token_required
def buscar_socios_empresa(current_user, empresa_id):
    """
    Busca todos os sócios existentes de uma empresa específica
    """
    try:
        # Busca a empresa
        empresa = Cliente.query.get(empresa_id)
        if not empresa:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        
        if empresa.tipo_pessoa != 'PJ':
            return jsonify({"erro": "Cliente deve ser uma pessoa jurídica"}), 400
        
        # Busca sócios relacionados à empresa
        # Assumindo que existe uma tabela de relacionamento ou campo que indica sócios
        # Por enquanto, vou buscar todos os clientes PF que podem ser sócios
        # Em um sistema real, você teria uma tabela específica de sócios
        
        # Busca sócios na tabela Socio
        socios = []
        try:
            socios_db = Socio.query.filter_by(empresa_id=empresa_id).all()
            current_app.logger.info(f"[EMPRESA] Buscando sócios para empresa_id={empresa_id}, encontrados: {len(socios_db)}")
            
            for socio in socios_db:
                # Busca dados completos do cliente
                cliente_socio = Cliente.query.get(socio.socio_id)
                if cliente_socio:
                    # Monta endereço completo do sócio
                    endereco_parts = []
                    if cliente_socio.logradouro:
                        endereco_parts.append(cliente_socio.logradouro)
                    if cliente_socio.numero:
                        endereco_parts.append(cliente_socio.numero)
                    if cliente_socio.complemento:
                        endereco_parts.append(cliente_socio.complemento)
                    if cliente_socio.bairro:
                        endereco_parts.append(cliente_socio.bairro)
                    if cliente_socio.municipio:
                        endereco_parts.append(cliente_socio.municipio)
                    if cliente_socio.uf:
                        endereco_parts.append(cliente_socio.uf)
                    if cliente_socio.cep:
                        endereco_parts.append(f"CEP {cliente_socio.cep}")
                    
                    endereco_completo = ", ".join(endereco_parts) if endereco_parts else ""
                    
                    socios.append({
                        'id': socio.id,
                        'cliente_id': cliente_socio.id,
                        'nome': cliente_socio.nome_completo,
                        'cpf': cliente_socio.cpf,
                        'rg': cliente_socio.rg,
                        'email': cliente_socio.email,
                        'telefone': cliente_socio.telefone1,
                        'endereco_completo': endereco_completo,
                        'participacao_percentual': float(socio.percentual_participacao or 0),
                        'data_entrada': socio.data_entrada,
                        'cargo': socio.cargo
                    })
                    current_app.logger.info(f"[EMPRESA] Sócio encontrado: {cliente_socio.nome_completo} ({cliente_socio.cpf})")
                else:
                    current_app.logger.warning(f"[EMPRESA] Cliente não encontrado para socio_id: {socio.socio_id}")
        except Exception as e:
            current_app.logger.error(f"[EMPRESA] Erro ao buscar sócios: {e}")
            socios = []
        
        # Se não há sócios na tabela específica, busca clientes PF relacionados
        if not socios:
            # Busca clientes PF que podem estar relacionados à empresa
            # Por enquanto, retorna uma lista vazia - em um sistema real você teria
            # uma lógica para identificar sócios existentes
            pass
        
        return jsonify({
            "empresa": {
                "id": empresa.id,
                "razao_social": empresa.razao_social,
                "cnpj": empresa.cnpj,
                "nome_fantasia": empresa.nome_fantasia,
                "endereco_completo": f"{empresa.logradouro}, {empresa.numero}, {empresa.bairro}, {empresa.municipio}, {empresa.uf}",
                "cnae_principal": empresa.cnae_principal,
                "regime_tributario": empresa.regime_tributario,
                "data_abertura": empresa.data_abertura,
                "natureza_juridica": empresa.natureza_juridica
            },
            "socios": socios,
            "total_socios": len(socios)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"[EMPRESA] Erro ao buscar sócios: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"erro": f"Erro ao buscar sócios da empresa: {str(e)}"}), 500


@api_bp.route('/empresas/<int:empresa_id>/dados-completos', methods=['GET'])
@token_required
def buscar_dados_completos_empresa(current_user, empresa_id):
    """
    Busca dados completos da empresa incluindo informações para contratos
    """
    try:
        # Busca a empresa
        empresa = Cliente.query.get(empresa_id)
        if not empresa:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        
        if empresa.tipo_pessoa != 'PJ':
            return jsonify({"erro": "Cliente deve ser uma pessoa jurídica"}), 400
        
        # Monta endereço completo
        endereco_parts = []
        if empresa.logradouro:
            endereco_parts.append(empresa.logradouro)
        if empresa.numero:
            endereco_parts.append(empresa.numero)
        if empresa.complemento:
            endereco_parts.append(empresa.complemento)
        if empresa.bairro:
            endereco_parts.append(empresa.bairro)
        if empresa.municipio:
            endereco_parts.append(empresa.municipio)
        if empresa.uf:
            endereco_parts.append(empresa.uf)
        if empresa.cep:
            endereco_parts.append(f"CEP {empresa.cep}")
        
        endereco_completo = ", ".join(endereco_parts) if endereco_parts else ""
        
        # Busca sócios existentes
        socios_existentes = []
        try:
            socios_db = Socio.query.filter_by(empresa_id=empresa_id).all()
            current_app.logger.info(f"[EMPRESA] Buscando sócios para empresa_id={empresa_id}, encontrados: {len(socios_db)}")
            
            for socio in socios_db:
                cliente_socio = Cliente.query.get(socio.socio_id)
                if cliente_socio:
                    # Monta endereço completo do sócio
                    endereco_parts = []
                    if cliente_socio.logradouro:
                        endereco_parts.append(cliente_socio.logradouro)
                    if cliente_socio.numero:
                        endereco_parts.append(cliente_socio.numero)
                    if cliente_socio.complemento:
                        endereco_parts.append(cliente_socio.complemento)
                    if cliente_socio.bairro:
                        endereco_parts.append(cliente_socio.bairro)
                    if cliente_socio.municipio:
                        endereco_parts.append(cliente_socio.municipio)
                    if cliente_socio.uf:
                        endereco_parts.append(cliente_socio.uf)
                    if cliente_socio.cep:
                        endereco_parts.append(f"CEP {cliente_socio.cep}")
                    
                    endereco_completo = ", ".join(endereco_parts) if endereco_parts else ""
                    
                    socios_existentes.append({
                        'id': socio.id,
                        'cliente_id': cliente_socio.id,
                        'nome': cliente_socio.nome_completo,
                        'cpf': cliente_socio.cpf,
                        'rg': cliente_socio.rg,
                        'email': cliente_socio.email,
                        'telefone': cliente_socio.telefone1,
                        'endereco_completo': endereco_completo,
                        'participacao_percentual': float(socio.percentual_participacao or 0),
                        'data_entrada': socio.data_entrada,
                        'cargo': socio.cargo
                    })
                    current_app.logger.info(f"[EMPRESA] Sócio encontrado: {cliente_socio.nome_completo} ({cliente_socio.cpf})")
                else:
                    current_app.logger.warning(f"[EMPRESA] Cliente não encontrado para socio_id: {socio.socio_id}")
        except Exception as e:
            current_app.logger.error(f"[EMPRESA] Erro ao buscar sócios: {e}")
        
        # Calcula dados do capital social
        total_participacao = sum(s.get('participacao_percentual', 0) for s in socios_existentes)
        capital_social_atual = sum(s.get('valor_participacao', 0) for s in socios_existentes)
        
        # Gera descrição dos sócios atuais
        socios_descricao = []
        for socio in socios_existentes:
            socios_descricao.append(f"SÓCIO - {socio['nome'].upper()}, inscrito no CPF no. {socio['cpf']}")
        
        socios_atual_descricao = " e;\n".join(socios_descricao) + " e;" if socios_descricao else ""
        
        # Monta tabela de distribuição de capital
        distribuicao_capital = []
        for socio in socios_existentes:
            distribuicao_capital.append({
                'nome': socio['nome'],
                'percentual': socio['participacao_percentual'],
                'quotas': int((socio['participacao_percentual'] / 100) * (capital_social_atual or 1000)),
                'valor': socio['valor_participacao']
            })
        
        return jsonify({
            "empresa": {
                "id": empresa.id,
                "razao_social": empresa.razao_social,
                "cnpj": empresa.cnpj,
                "nome_fantasia": empresa.nome_fantasia,
                "endereco_completo": endereco_completo,
                "cnae_principal": empresa.cnae_principal,
                "regime_tributario": empresa.regime_tributario,
                "data_abertura": empresa.data_abertura,
                "natureza_juridica": empresa.natureza_juridica,
                "situacao_cadastral": empresa.situacao_cadastral,
                "data_situacao": empresa.data_situacao,
                "motivo_situacao": empresa.motivo_situacao
            },
            "socios_existentes": socios_existentes,
            "capital_social": {
                "valor_atual": capital_social_atual,
                "total_participacao": total_participacao,
                "distribuicao": distribuicao_capital
            },
            "dados_contrato": {
                "socios_atual_descricao": socios_atual_descricao,
                "capital_social_valor": f"{capital_social_atual:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
                "capital_social_extenso": "",  # Seria preenchido com função de extenso
                "capital_social_quotas": int(capital_social_atual or 1000),
                "valor_quota": "1,00",
                "valor_quota_extenso": "UM REAL"
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"[EMPRESA] Erro ao buscar dados completos: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({"erro": f"Erro ao buscar dados completos da empresa: {str(e)}"}), 500


@api_bp.route('/contratos/alteracao-socios', methods=['POST'])
@token_required
def criar_contrato_alteracao_socios(current_user):
    """
    Cria um contrato de alteração específico para mudanças no quadro societário
    com busca automática de dados dos sócios por CPF e uso de dados existentes da empresa
    """
    try:
        data = request.get_json()
        
        # Validações obrigatórias
        if not data.get('empresa_id'):
            return jsonify({"erro": "ID da empresa é obrigatório"}), 400
        
        # Busca a empresa e seus dados completos
        empresa = Cliente.query.get(data['empresa_id'])
        if not empresa:
            return jsonify({"erro": "Empresa não encontrada"}), 404
        
        if empresa.tipo_pessoa != 'PJ':
            return jsonify({"erro": "Cliente deve ser uma pessoa jurídica"}), 400
        
        # Busca dados completos da empresa (sócios existentes, capital social, etc)
        socios_existentes = []
        capital_social_atual = 0
        socios_atual_descricao = ""
        
        try:
            socios_db = Socio.query.filter_by(empresa_id=data['empresa_id']).all()
            current_app.logger.info(f"[CONTRATO] Buscando sócios para empresa_id={data['empresa_id']}, encontrados: {len(socios_db)}")
            
            for socio in socios_db:
                cliente_socio = Cliente.query.get(socio.socio_id)
                if cliente_socio:
                    # Monta endereço completo do sócio
                    endereco_parts = []
                    if cliente_socio.logradouro:
                        endereco_parts.append(cliente_socio.logradouro)
                    if cliente_socio.numero:
                        endereco_parts.append(cliente_socio.numero)
                    if cliente_socio.complemento:
                        endereco_parts.append(cliente_socio.complemento)
                    if cliente_socio.bairro:
                        endereco_parts.append(cliente_socio.bairro)
                    if cliente_socio.municipio:
                        endereco_parts.append(cliente_socio.municipio)
                    if cliente_socio.uf:
                        endereco_parts.append(cliente_socio.uf)
                    if cliente_socio.cep:
                        endereco_parts.append(f"CEP {cliente_socio.cep}")
                    
                    endereco_completo = ", ".join(endereco_parts) if endereco_parts else ""
                    
                    socios_existentes.append({
                        'id': socio.id,
                        'cliente_id': cliente_socio.id,
                        'nome': cliente_socio.nome_completo,
                        'cpf': cliente_socio.cpf,
                        'rg': cliente_socio.rg,
                        'email': cliente_socio.email,
                        'telefone': cliente_socio.telefone1,
                        'endereco_completo': endereco_completo,
                        'participacao_percentual': float(socio.percentual_participacao or 0),
                        'cargo': socio.cargo
                    })
                    # Calcula valor baseado no percentual (assumindo capital social padrão)
                    valor_participacao = (socio.percentual_participacao or 0) * 1000  # R$ 1000 por 1%
                    capital_social_atual += valor_participacao
                    current_app.logger.info(f"[CONTRATO] Sócio encontrado: {cliente_socio.nome_completo} ({cliente_socio.cpf}) - {socio.percentual_participacao}%")
                else:
                    current_app.logger.warning(f"[CONTRATO] Cliente não encontrado para socio_id: {socio.socio_id}")
            
            # Gera descrição dos sócios atuais
            socios_descricao = []
            for socio in socios_existentes:
                socios_descricao.append(f"SÓCIO - {socio['nome'].upper()}, inscrito no CPF no. {socio['cpf']}")
            
            socios_atual_descricao = " e;\n".join(socios_descricao) + " e;" if socios_descricao else ""
            
        except Exception as e:
            current_app.logger.warning(f"Erro ao buscar sócios existentes: {e}")
        
        # Busca o template de alteração contratual
        template = TemplateContrato.query.filter_by(tipo='alteracao_contratual').first()
        if not template:
            return jsonify({"erro": "Template de alteração contratual não encontrado"}), 404
        
        # Processa as alterações de sócios
        alteracoes_socios = data.get('alteracoes_socios', {})
        socios_envolvidos = []
        alteracoes_conteudo = []
        
        # Processa sócios que saem
        for socio_sai in alteracoes_socios.get('socios_saem', []):
            if socio_sai.get('cpf'):
                # Busca dados do sócio pelo CPF
                cliente_socio = Cliente.query.filter(
                    func.replace(
                        func.replace(Cliente.cpf, '.', ''),
                        '-', ''
                    ) == limpar_documento(socio_sai['cpf'])
                ).first()
                
                if cliente_socio:
                    socios_envolvidos.append({
                        'tipo': 'socio_sai',
                        'cliente_id': cliente_socio.id,
                        'nome': cliente_socio.nome_completo,
                        'cpf': cliente_socio.cpf,
                        'percentual': socio_sai.get('percentual', 0),
                        'valor_cessao': socio_sai.get('valor_cessao', 0)
                    })
                    
                    # Gera cláusula de saída
                    alteracoes_conteudo.append(f"""
Cláusula {len(alteracoes_conteudo) + 1}° - O SÓCIO {cliente_socio.nome_completo.upper()}, inscrito no CPF no. {cliente_socio.cpf}, se retira da sociedade, cede e transfere {socio_sai.get('percentual', 0)}% das quotas de capital social da sociedade para os Sócios remanescentes.
""")
        
        # Processa sócios que entram
        for socio_entra in alteracoes_socios.get('socios_entram', []):
            if socio_entra.get('cpf'):
                # Busca dados do sócio pelo CPF
                cliente_socio = Cliente.query.filter(
                    func.replace(
                        func.replace(Cliente.cpf, '.', ''),
                        '-', ''
                    ) == limpar_documento(socio_entra['cpf'])
                ).first()
                
                if cliente_socio:
                    socios_envolvidos.append({
                        'tipo': 'socio_entra',
                        'cliente_id': cliente_socio.id,
                        'nome': cliente_socio.nome_completo,
                        'cpf': cliente_socio.cpf,
                        'percentual': socio_entra.get('percentual', 0),
                        'valor_integralizacao': socio_entra.get('valor_integralizacao', 0)
                    })
                    
                    # Gera cláusula de entrada
                    alteracoes_conteudo.append(f"""
Cláusula {len(alteracoes_conteudo) + 1}° - Admitir-se como sócio da sociedade {cliente_socio.nome_completo.upper()}, inscrito no CPF no. {cliente_socio.cpf}, que subscreve {socio_entra.get('percentual', 0)}% das quotas de capital social, integralizando o valor de R$ {socio_entra.get('valor_integralizacao', 0):,.2f}.
""")
        
        # Monta endereço completo da empresa
        endereco_parts = []
        if empresa.logradouro:
            endereco_parts.append(empresa.logradouro)
        if empresa.numero:
            endereco_parts.append(empresa.numero)
        if empresa.complemento:
            endereco_parts.append(empresa.complemento)
        if empresa.bairro:
            endereco_parts.append(empresa.bairro)
        if empresa.municipio:
            endereco_parts.append(empresa.municipio)
        if empresa.uf:
            endereco_parts.append(empresa.uf)
        if empresa.cep:
            endereco_parts.append(f"CEP {empresa.cep}")
        
        endereco_completo = ", ".join(endereco_parts) if endereco_parts else ""
        
        # Calcula novo capital social baseado nas alterações
        novo_capital_social = capital_social_atual
        
        # Subtrai valores dos sócios que saem
        for socio_sai in alteracoes_socios.get('socios_saem', []):
            novo_capital_social -= socio_sai.get('valor_cessao', 0)
        
        # Adiciona valores dos sócios que entram
        for socio_entra in alteracoes_socios.get('socios_entram', []):
            novo_capital_social += socio_entra.get('valor_integralizacao', 0)
        
        # Monta tabela de distribuição de capital atualizada
        distribuicao_capital_tabela = []
        
        # Adiciona sócios remanescentes (existentes que não saem)
        socios_que_saem_cpf = [s.get('cpf', '') for s in alteracoes_socios.get('socios_saem', [])]
        for socio_existente in socios_existentes:
            if socio_existente['cpf'] not in socios_que_saem_cpf:
                distribuicao_capital_tabela.append({
                    'nome': socio_existente['nome'],
                    'percentual': socio_existente['participacao_percentual'],
                    'quotas': int((socio_existente['participacao_percentual'] / 100) * novo_capital_social),
                    'valor': socio_existente['valor_participacao']
                })
        
        # Adiciona novos sócios
        for socio_entra in alteracoes_socios.get('socios_entram', []):
            if socio_entra.get('cpf'):
                cliente_socio = Cliente.query.filter(
                    func.replace(
                        func.replace(Cliente.cpf, '.', ''),
                        '-', ''
                    ) == limpar_documento(socio_entra['cpf'])
                ).first()
                
                if cliente_socio:
                    distribuicao_capital_tabela.append({
                        'nome': cliente_socio.nome_completo,
                        'percentual': socio_entra.get('percentual', 0),
                        'quotas': int((socio_entra.get('percentual', 0) / 100) * novo_capital_social),
                        'valor': socio_entra.get('valor_integralizacao', 0)
                    })
        
        # Prepara dados para substituição no template
        dados_variaveis = {
            'numero_alteracao': data.get('numero_alteracao', '1ª'),
            'empresa_razao_social': empresa.razao_social,
            'empresa_cnpj': empresa.cnpj,
            'empresa_nire': data.get('empresa_nire', ''),
            'data_registro_nire': data.get('data_registro_nire', ''),
            'empresa_nome_fantasia': empresa.nome_fantasia or data.get('empresa_nome_fantasia', ''),
            'empresa_endereco_completo': endereco_completo,
            'alteracoes_conteudo': '\n'.join(alteracoes_conteudo),
            'objeto_social_atualizado': data.get('objeto_social_atualizado', empresa.cnae_principal or ''),
            'codificacao_cnaes': data.get('codificacao_cnaes', ''),
            'capital_social_valor': f"{novo_capital_social:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
            'capital_social_extenso': data.get('capital_social_extenso', ''),
            'capital_social_quotas': int(novo_capital_social),
            'capital_social_quotas_extenso': data.get('capital_social_quotas_extenso', ''),
            'valor_quota': "1,00",
            'valor_quota_extenso': "UM REAL",
            'distribuicao_capital_tabela': "\n".join([
                f"{item['nome']:<50} {item['percentual']:>5}% {item['quotas']:>8} R$: {item['valor']:>10,.2f}"
                for item in distribuicao_capital_tabela
            ]),
            'administrador_nome': data.get('administrador_nome', ''),
            'cidade_foro': data.get('cidade_foro', empresa.municipio or ''),
            'uf_foro': data.get('uf_foro', empresa.uf or ''),
            'numero_vias': data.get('numero_vias', '1'),
            'cidade_contrato': data.get('cidade_contrato', empresa.municipio or ''),
            'data_atual': datetime.now().strftime("%d de %B de %Y"),
            'assinaturas_socios': data.get('assinaturas_socios', ''),
            'socios_atual_descricao': socios_atual_descricao
        }
        
        # Gera conteúdo substituindo variáveis
        conteudo_gerado = substituir_variaveis(template.conteudo, dados_variaveis)
        
        # Cria contrato
        novo_contrato = Contrato(
            template_id=template.id,
            empresa_id=data['empresa_id'],
            numero_contrato=gerar_numero_contrato(),
            titulo=f"Alteração Contratual - Quadro Societário - {empresa.razao_social}",
            tipo='alteracao_contratual',
            conteudo_gerado=conteudo_gerado,
            dados_variaveis=json.dumps(dados_variaveis, ensure_ascii=False),
            socios_envolvidos=json.dumps(socios_envolvidos, ensure_ascii=False),
            status=data.get('status', 'rascunho'),
            observacoes=data.get('observacoes'),
            usuario_criacao_id=current_user.id
        )
        
        db.session.add(novo_contrato)
        db.session.commit()
        
        # Log de auditoria
        log_action(
            usuario_id=current_user.id,
            acao='CREATE',
            entidade='CONTRATO_ALTERACAO_SOCIOS',
            entidade_id=novo_contrato.id,
            detalhes={
                'titulo': novo_contrato.titulo,
                'empresa': empresa.razao_social,
                'socios_envolvidos': len(socios_envolvidos),
                'capital_social_atual': capital_social_atual,
                'novo_capital_social': novo_capital_social
            },
            ip_address=request.remote_addr
        )
        
        current_app.logger.info(f"Contrato de alteração de sócios criado: {novo_contrato.titulo} (ID: {novo_contrato.id})")
        
        return jsonify({
            "mensagem": "Contrato de alteração de sócios criado com sucesso!",
            "contrato": novo_contrato.to_dict(),
            "socios_processados": len(socios_envolvidos),
            "dados_empresa": {
                "socios_existentes": len(socios_existentes),
                "capital_social_atual": capital_social_atual,
                "novo_capital_social": novo_capital_social
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao criar contrato de alteração de sócios: {e}", exc_info=True)
        return jsonify({"erro": f"Erro ao criar contrato de alteração de sócios: {str(e)}"}), 500

# ===== ROTAS PARA TEMPLATES DE RELATÓRIO =====

@api_bp.route("/templates-relatorio", methods=["GET"])
@token_required
def listar_templates_relatorio(current_user):
    """Lista todos os templates de relatório"""
    try:
        templates = TemplateRelatorio.query.filter_by(ativo=True).order_by(TemplateRelatorio.data_criacao.desc()).all()
        resultado = [template.to_dict() for template in templates]
        
        current_app.logger.info(f"Listados {len(resultado)} templates de relatório")
        return jsonify(resultado)
        
    except Exception as e:
        current_app.logger.error(f"Erro ao listar templates de relatório: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar templates de relatório"}), 500

@api_bp.route("/templates-relatorio/<int:template_id>", methods=["GET"])
@token_required
def obter_template_relatorio(current_user, template_id):
    """Obtém um template de relatório específico"""
    try:
        template = TemplateRelatorio.query.filter_by(id=template_id, ativo=True).first()
        
        if not template:
            return jsonify({"erro": "Template de relatório não encontrado"}), 404
            
        current_app.logger.info(f"Template de relatório obtido: {template.titulo} (ID: {template.id})")
        return jsonify(template.to_dict())
        
    except Exception as e:
        current_app.logger.error(f"Erro ao obter template de relatório {template_id}: {e}", exc_info=True)
        return jsonify({"erro": "Erro ao buscar template de relatório"}), 500

@api_bp.route("/templates-relatorio", methods=["POST"])
@token_required
def criar_template_relatorio(current_user):
    """Cria um novo template de relatório"""
    try:
        dados = request.get_json()
        
        # Validações
        if not dados.get('titulo'):
            return jsonify({"erro": "Título é obrigatório"}), 400
            
        if not dados.get('conteudo'):
            return jsonify({"erro": "Conteúdo é obrigatório"}), 400
        
        # Criar template
        template = TemplateRelatorio(
            titulo=dados['titulo'],
            conteudo=dados['conteudo'],
            tipo=dados.get('tipo', 'relatorio_custom'),
            status=dados.get('status', 'ativo'),
            usuario_criador_id=current_user.id
        )
        
        db.session.add(template)
        db.session.commit()
        
        # Log da ação
        log_action(
            usuario_id=current_user.id,
            acao='CREATE',
            entidade='TemplateRelatorio',
            entidade_id=template.id,
            detalhes=f"Template criado: {template.titulo}"
        )
        
        current_app.logger.info(f"Template de relatório criado: {template.titulo} (ID: {template.id})")
        return jsonify(template.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao criar template de relatório: {e}", exc_info=True)
        return jsonify({"erro": f"Erro ao criar template de relatório: {str(e)}"}), 500

@api_bp.route("/templates-relatorio/<int:template_id>", methods=["PUT"])
@token_required
def atualizar_template_relatorio(current_user, template_id):
    """Atualiza um template de relatório"""
    try:
        template = TemplateRelatorio.query.filter_by(id=template_id, ativo=True).first()
        
        if not template:
            return jsonify({"erro": "Template de relatório não encontrado"}), 404
        
        dados = request.get_json()
        
        # Validações
        if dados.get('titulo') and not dados['titulo'].strip():
            return jsonify({"erro": "Título não pode ser vazio"}), 400
            
        if dados.get('conteudo') and not dados['conteudo'].strip():
            return jsonify({"erro": "Conteúdo não pode ser vazio"}), 400
        
        # Atualizar campos
        if 'titulo' in dados:
            template.titulo = dados['titulo']
        if 'conteudo' in dados:
            template.conteudo = dados['conteudo']
        if 'tipo' in dados:
            template.tipo = dados['tipo']
        if 'status' in dados:
            template.status = dados['status']
        
        template.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        # Log da ação
        log_action(
            usuario_id=current_user.id,
            acao='UPDATE',
            entidade='TemplateRelatorio',
            entidade_id=template.id,
            detalhes=f"Template atualizado: {template.titulo}"
        )
        
        current_app.logger.info(f"Template de relatório atualizado: {template.titulo} (ID: {template.id})")
        return jsonify(template.to_dict())
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar template de relatório {template_id}: {e}", exc_info=True)
        return jsonify({"erro": f"Erro ao atualizar template de relatório: {str(e)}"}), 500

@api_bp.route("/templates-relatorio/<int:template_id>", methods=["DELETE"])
@token_required
def deletar_template_relatorio(current_user, template_id):
    """Deleta um template de relatório (soft delete)"""
    try:
        template = TemplateRelatorio.query.filter_by(id=template_id, ativo=True).first()
        
        if not template:
            return jsonify({"erro": "Template de relatório não encontrado"}), 404
        
        # Soft delete
        template.ativo = False
        template.data_atualizacao = datetime.utcnow()
        
        db.session.commit()
        
        # Log da ação
        log_action(
            usuario_id=current_user.id,
            acao='DELETE',
            entidade='TemplateRelatorio',
            entidade_id=template.id,
            detalhes=f"Template deletado: {template.titulo}"
        )
        
        current_app.logger.info(f"Template de relatório deletado: {template.titulo} (ID: {template.id})")
        return jsonify({"mensagem": "Template de relatório deletado com sucesso"})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao deletar template de relatório {template_id}: {e}", exc_info=True)
        return jsonify({"erro": f"Erro ao deletar template de relatório: {str(e)}"}), 500