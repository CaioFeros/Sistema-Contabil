import pandas as pd
from flask import request, jsonify, Blueprint, current_app
import jwt
from datetime import datetime
import requests
from .models import db, Cliente, Processamento, FaturamentoDetalhe
from sqlalchemy.orm import joinedload
from .auth import token_required
from .services import processar_arquivo_faturamento, gerar_relatorio_faturamento, calcular_imposto_simples_nacional
from .audit import log_action

api_bp = Blueprint('api', __name__, url_prefix='/api') # Blueprint principal da API

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
        data_situacao_especial=data.get('data_situacao_especial')
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
    clientes = Cliente.query.all()
    resultado = [{"id": c.id, "razao_social": c.razao_social, "cnpj": c.cnpj, "regime_tributario": c.regime_tributario} for c in clientes]
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
    Deleta um cliente e todos os seus dados relacionados (faturamentos e detalhes).
    O cascade delete está configurado no modelo Processamento.
    """
    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    try:
        razao_social = cliente.razao_social
        cnpj = cliente.cnpj
        regime_tributario = cliente.regime_tributario
        
        # Busca e deleta todos os processamentos (que deletarão os detalhes em cascade)
        processamentos = Processamento.query.filter_by(cliente_id=cliente_id).all()
        num_processamentos = len(processamentos)
        
        # Registra logs de exclusão de cada processamento
        for proc in processamentos:
            # Conta o número de notas (detalhes) do processamento
            total_notas = len(proc.detalhes) if proc.detalhes else 0
            
            log_action(current_user.id, 'DELETE', 'FATURAMENTO', proc.id, {
                'cliente_id': cliente_id,
                'cliente_nome': razao_social,
                'mes': proc.mes,
                'ano': proc.ano,
                'total_notas': total_notas,
                'motivo': 'Excluído junto com o cliente'
            })
            db.session.delete(proc)
        
        # Deleta o cliente
        db.session.delete(cliente)
        db.session.commit()
        
        # Registra log de exclusão do cliente
        log_action(current_user.id, 'DELETE', 'CLIENTE', cliente_id, {
            'razao_social': razao_social,
            'cnpj': cnpj,
            'regime_tributario': regime_tributario,
            'num_processamentos': num_processamentos
        })
        
        current_app.logger.info(f"Cliente deletado: {razao_social} ({cnpj}) - {num_processamentos} processamentos removidos")
        
        return jsonify({
            "mensagem": f"Cliente '{razao_social}' deletado com sucesso!",
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
    if 'razao_social' in data:
        cliente.razao_social = data['razao_social']
    if 'regime_tributario' in data:
        cliente.regime_tributario = data['regime_tributario']
    if 'nome_fantasia' in data:
        cliente.nome_fantasia = data['nome_fantasia']
    if 'data_abertura' in data:
        cliente.data_abertura = data['data_abertura']
    
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
    
    try:
        db.session.commit()
        return jsonify({
            "mensagem": "Cliente atualizado com sucesso!",
            "cliente": cliente.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar cliente: {e}")
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
                            
                            # Registra log da exclusão (substituição)
                            log_action(current_user.id, 'DELETE', 'FATURAMENTO', processamento_existente.id, {
                                'cliente_id': cliente_id,
                                'cliente_nome': cliente.razao_social,
                                'mes': mes,
                                'ano': ano,
                                'total_notas': total_notas_antigo,
                                'motivo': 'Substituído por nova importação'
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
