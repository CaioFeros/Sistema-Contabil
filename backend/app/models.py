from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(256), nullable=False)
    papel = db.Column(db.String(80), nullable=False, default='USER')
    nome = db.Column(db.String(120), nullable=False)
    ativo = db.Column(db.Boolean, default=True, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ultimo_login = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'papel': self.papel,
            'nome': self.nome,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'ultimo_login': self.ultimo_login.isoformat() if self.ultimo_login else None
        }

class PessoaJuridica(db.Model):
    __tablename__ = 'pessoa_juridica'
    
    id = db.Column(db.Integer, primary_key=True)
    razao_social = db.Column(db.String(200), nullable=False)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    nome_fantasia = db.Column(db.String(200))
    regime_tributario = db.Column(db.String(100))
    data_abertura = db.Column(db.String(10))
    situacao_cadastral = db.Column(db.String(50))
    data_situacao = db.Column(db.String(10))
    motivo_situacao = db.Column(db.String(200))
    natureza_juridica = db.Column(db.String(200))
    cnae_principal = db.Column(db.String(200))
    cnae_secundarias = db.Column(db.Text)
    logradouro = db.Column(db.String(200))
    numero = db.Column(db.String(20))
    complemento = db.Column(db.String(100))
    bairro = db.Column(db.String(100))
    cep = db.Column(db.String(10))
    municipio = db.Column(db.String(100))
    uf = db.Column(db.String(2))
    telefone1 = db.Column(db.String(20))
    telefone2 = db.Column(db.String(20))
    email = db.Column(db.String(120))
    capital_social = db.Column(db.String(50))
    porte = db.Column(db.String(100))
    opcao_simples = db.Column(db.String(3))
    data_opcao_simples = db.Column(db.String(10))
    opcao_mei = db.Column(db.String(3))
    data_exclusao_simples = db.Column(db.String(10))
    situacao_especial = db.Column(db.String(200))
    data_situacao_especial = db.Column(db.String(10))
    valor_honorarios = db.Column(db.Numeric(10, 2))
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime)
    ativo = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        """Converte o objeto PessoaJuridica para um dicionário"""
        import json
        return {
            'id': self.id,
            'razao_social': self.razao_social,
            'cnpj': self.cnpj,
            'nome_fantasia': self.nome_fantasia,
            'regime_tributario': self.regime_tributario,
            'data_abertura': self.data_abertura,
            'situacao_cadastral': self.situacao_cadastral,
            'data_situacao': self.data_situacao,
            'motivo_situacao': self.motivo_situacao,
            'natureza_juridica': self.natureza_juridica,
            'cnae_principal': self.cnae_principal,
            'cnae_secundarias': json.loads(self.cnae_secundarias) if self.cnae_secundarias else [],
            'logradouro': self.logradouro,
            'numero': self.numero,
            'complemento': self.complemento,
            'bairro': self.bairro,
            'cep': self.cep,
            'municipio': self.municipio,
            'uf': self.uf,
            'telefone1': self.telefone1,
            'telefone2': self.telefone2,
            'email': self.email,
            'capital_social': self.capital_social,
            'porte': self.porte,
            'opcao_simples': self.opcao_simples,
            'data_opcao_simples': self.data_opcao_simples,
            'opcao_mei': self.opcao_mei,
            'data_exclusao_simples': self.data_exclusao_simples,
            'situacao_especial': self.situacao_especial,
            'data_situacao_especial': self.data_situacao_especial,
            'valor_honorarios': float(self.valor_honorarios) if self.valor_honorarios else None,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'ativo': self.ativo
        }

class PessoaFisica(db.Model):
    __tablename__ = 'pessoa_fisica'
    
    id = db.Column(db.Integer, primary_key=True)
    nome_completo = db.Column(db.String(200), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    data_nascimento = db.Column(db.String(10))
    rg = db.Column(db.String(20))
    estado_civil = db.Column(db.String(20))
    regime_comunhao = db.Column(db.String(50))
    logradouro = db.Column(db.String(200))
    numero = db.Column(db.String(20))
    complemento = db.Column(db.String(100))
    bairro = db.Column(db.String(100))
    cep = db.Column(db.String(10))
    municipio = db.Column(db.String(100))
    uf = db.Column(db.String(2))
    telefone1 = db.Column(db.String(20))
    telefone2 = db.Column(db.String(20))
    email = db.Column(db.String(120))
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime)
    ativo = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        """Converte o objeto PessoaFisica para um dicionário"""
        return {
            'id': self.id,
            'nome_completo': self.nome_completo,
            'cpf': self.cpf,
            'data_nascimento': self.data_nascimento,
            'rg': self.rg,
            'estado_civil': self.estado_civil,
            'regime_comunhao': self.regime_comunhao,
            'logradouro': self.logradouro,
            'numero': self.numero,
            'complemento': self.complemento,
            'bairro': self.bairro,
            'cep': self.cep,
            'municipio': self.municipio,
            'uf': self.uf,
            'telefone1': self.telefone1,
            'telefone2': self.telefone2,
            'email': self.email,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'ativo': self.ativo
        }

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Tipo de Pessoa
    tipo_pessoa = db.Column(db.String(2), nullable=False, default='PJ')  # 'PF' ou 'PJ'
    
    # Dados Básicos - Pessoa Jurídica
    razao_social = db.Column(db.String(200))  # Obrigatório para PJ, NULL para PF
    cnpj = db.Column(db.String(18), unique=True)  # Obrigatório para PJ, NULL para PF
    nome_fantasia = db.Column(db.String(200))
    
    # Dados Básicos - Pessoa Física
    cpf = db.Column(db.String(14), unique=True)  # Obrigatório para PF, NULL para PJ
    nome_completo = db.Column(db.String(200))  # Obrigatório para PF, NULL para PJ
    data_nascimento = db.Column(db.String(10))  # Apenas para PF
    rg = db.Column(db.String(20))  # Apenas para PF
    estado_civil = db.Column(db.String(20))  # solteiro, casado, divorciado, viuvo
    regime_comunhao = db.Column(db.String(50))  # comunhão parcial, comunhão universal, separação total, etc.
    
    # Campos Comuns
    regime_tributario = db.Column(db.String(100))  # Apenas para PJ (PF não tem regime tributário)
    data_abertura = db.Column(db.String(10))  # Data de início/abertura
    
    # Situação Cadastral
    situacao_cadastral = db.Column(db.String(50))
    data_situacao = db.Column(db.String(10))
    motivo_situacao = db.Column(db.String(200))
    
    # Natureza Jurídica
    natureza_juridica = db.Column(db.String(200))
    
    # Atividade Econômica
    cnae_principal = db.Column(db.String(200))
    cnae_secundarias = db.Column(db.Text)  # Armazenado como JSON string
    
    # Endereço
    logradouro = db.Column(db.String(200))
    numero = db.Column(db.String(20))
    complemento = db.Column(db.String(100))
    bairro = db.Column(db.String(100))
    cep = db.Column(db.String(10))
    municipio = db.Column(db.String(100))
    uf = db.Column(db.String(2))
    
    # Contato
    telefone1 = db.Column(db.String(20))
    telefone2 = db.Column(db.String(20))
    email = db.Column(db.String(120))
    
    # Informações Empresariais
    capital_social = db.Column(db.String(50))
    porte = db.Column(db.String(100))
    
    # Opções Fiscais
    opcao_simples = db.Column(db.String(3))
    data_opcao_simples = db.Column(db.String(10))
    opcao_mei = db.Column(db.String(3))
    data_exclusao_simples = db.Column(db.String(10))
    
    # Situação Especial
    situacao_especial = db.Column(db.String(200))
    data_situacao_especial = db.Column(db.String(10))
    
    # Valor de Honorários
    valor_honorarios = db.Column(db.Numeric(10, 2))
    
    def to_dict(self):
        """Converte o objeto Cliente para um dicionário"""
        import json
        return {
            'id': self.id,
            'tipo_pessoa': self.tipo_pessoa,
            # Campos PJ
            'razao_social': self.razao_social,
            'cnpj': self.cnpj,
            'nome_fantasia': self.nome_fantasia,
            # Campos PF
            'cpf': self.cpf,
            'nome_completo': self.nome_completo,
            'data_nascimento': self.data_nascimento,
            'rg': self.rg,
            'estado_civil': self.estado_civil,
            'regime_comunhao': self.regime_comunhao,
            # Campos Comuns
            'regime_tributario': self.regime_tributario,
            'data_abertura': self.data_abertura,
            'situacao_cadastral': self.situacao_cadastral,
            'data_situacao': self.data_situacao,
            'motivo_situacao': self.motivo_situacao,
            'natureza_juridica': self.natureza_juridica,
            'cnae_principal': self.cnae_principal,
            'cnae_secundarias': json.loads(self.cnae_secundarias) if self.cnae_secundarias else [],
            'logradouro': self.logradouro,
            'numero': self.numero,
            'complemento': self.complemento,
            'bairro': self.bairro,
            'cep': self.cep,
            'municipio': self.municipio,
            'uf': self.uf,
            'telefone1': self.telefone1,
            'telefone2': self.telefone2,
            'email': self.email,
            'capital_social': self.capital_social,
            'porte': self.porte,
            'opcao_simples': self.opcao_simples,
            'data_opcao_simples': self.data_opcao_simples,
            'opcao_mei': self.opcao_mei,
            'data_exclusao_simples': self.data_exclusao_simples,
            'situacao_especial': self.situacao_especial,
            'data_situacao_especial': self.data_situacao_especial,
            'valor_honorarios': float(self.valor_honorarios) if self.valor_honorarios else None
        }

class Socio(db.Model):
    """
    Relacionamento entre clientes PJ (empresas) e PF (sócios).
    Uma empresa pode ter vários sócios, e uma pessoa pode ser sócia de várias empresas.
    """
    __tablename__ = 'socio'
    
    id = db.Column(db.Integer, primary_key=True)
    empresa_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)  # Cliente PJ
    socio_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)  # Cliente PF
    percentual_participacao = db.Column(db.Numeric(5, 2))  # Percentual de participação (0-100)
    data_entrada = db.Column(db.String(10))  # Data em que entrou como sócio
    cargo = db.Column(db.String(100))  # Cargo na empresa (Sócio, Administrador, etc.)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    empresa = db.relationship('Cliente', foreign_keys=[empresa_id], backref='socios_empresa')
    socio = db.relationship('Cliente', foreign_keys=[socio_id], backref='empresas_socio')
    
    # Constraint única: uma PF não pode ser sócia da mesma PJ duas vezes
    __table_args__ = (
        db.UniqueConstraint('empresa_id', 'socio_id', name='uq_empresa_socio'),
    )
    
    def to_dict(self, incluir_dados_completos=False):
        dados_basicos = {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'socio_id': self.socio_id,
            'socio_nome': self.socio.nome_completo if self.socio else None,
            'socio_cpf': self.socio.cpf if self.socio else None,
            'percentual_participacao': float(self.percentual_participacao) if self.percentual_participacao else None,
            'data_entrada': self.data_entrada,
            'cargo': self.cargo,
            'data_cadastro': self.data_cadastro.isoformat() if self.data_cadastro else None
        }
        
        # Se solicitado, inclui dados completos da pessoa física
        if incluir_dados_completos and self.socio:
            dados_basicos['socio_rg'] = self.socio.rg
            dados_basicos['socio_data_nascimento'] = self.socio.data_nascimento
            dados_basicos['socio_estado_civil'] = self.socio.estado_civil
            dados_basicos['socio_regime_comunhao'] = self.socio.regime_comunhao
            dados_basicos['socio_nacionalidade'] = 'Brasileira'
            dados_basicos['socio_profissao'] = ''
            # Endereço do sócio
            dados_basicos['socio_logradouro'] = self.socio.logradouro
            dados_basicos['socio_numero'] = self.socio.numero
            dados_basicos['socio_complemento'] = self.socio.complemento
            dados_basicos['socio_bairro'] = self.socio.bairro
            dados_basicos['socio_cep'] = self.socio.cep
            dados_basicos['socio_municipio'] = self.socio.municipio
            dados_basicos['socio_uf'] = self.socio.uf
            # Monta endereço completo
            endereco_parts = [
                self.socio.logradouro,
                self.socio.numero,
                self.socio.complemento,
                self.socio.bairro,
                f"{self.socio.municipio}-{self.socio.uf}" if self.socio.municipio and self.socio.uf else None,
                f"CEP {self.socio.cep}" if self.socio.cep else None
            ]
            dados_basicos['socio_endereco_completo'] = ', '.join(filter(None, endereco_parts))
        
        return dados_basicos

class Processamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    mes = db.Column(db.Integer, nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    faturamento_total = db.Column(db.Numeric(10, 2), nullable=False)
    imposto_calculado = db.Column(db.Numeric(10, 2), nullable=False)
    nome_arquivo_original = db.Column(db.String(255), nullable=False)
    data_processamento = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    cliente = db.relationship('Cliente')
    detalhes = db.relationship('FaturamentoDetalhe', backref='processamento', lazy=True, cascade="all, delete-orphan")

    # Garante que só pode haver um processamento por cliente/mês/ano
    __table_args__ = (db.UniqueConstraint('cliente_id', 'mes', 'ano', name='_cliente_mes_ano_uc'),)

class FaturamentoDetalhe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    processamento_id = db.Column(db.Integer, db.ForeignKey('processamento.id'), nullable=False)
    descricao_servico = db.Column(db.String(300), nullable=False)
    valor = db.Column(db.Numeric(10, 2), nullable=False)

class LogAuditoria(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    acao = db.Column(db.String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    entidade = db.Column(db.String(50), nullable=False)  # CLIENTE, USUARIO, FATURAMENTO, etc.
    entidade_id = db.Column(db.Integer)  # ID da entidade afetada
    detalhes = db.Column(db.Text)  # JSON com detalhes da operação
    data_acao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45))  # IPv4 ou IPv6
    
    usuario = db.relationship('Usuario')
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario_nome': self.usuario.nome if self.usuario else 'Usuário Removido',
            'acao': self.acao,
            'entidade': self.entidade,
            'entidade_id': self.entidade_id,
            'detalhes': json.loads(self.detalhes) if self.detalhes else {},
            'data_acao': self.data_acao.isoformat(),
            'ip_address': self.ip_address
        }

class Contador(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    cpf = db.Column(db.String(14), nullable=False, unique=True)
    crc = db.Column(db.String(50), nullable=False)
    pix = db.Column(db.String(100), nullable=False)
    banco = db.Column(db.String(100), nullable=False)
    agencia = db.Column(db.String(20), nullable=False)
    conta_corrente = db.Column(db.String(20), nullable=False)
    imagem_assinatura = db.Column(db.Text)  # Base64 da imagem
    imagem_logo = db.Column(db.Text)  # Base64 da imagem
    ativo = db.Column(db.Boolean, default=True, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'cpf': self.cpf,
            'crc': self.crc,
            'pix': self.pix,
            'banco': self.banco,
            'agencia': self.agencia,
            'conta_corrente': self.conta_corrente,
            'imagem_assinatura': self.imagem_assinatura,
            'imagem_logo': self.imagem_logo,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None
        }

class Recibo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    contador_id = db.Column(db.Integer, db.ForeignKey('contador.id'), nullable=False)
    mes = db.Column(db.Integer, nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    tipo_servico = db.Column(db.String(50), nullable=False, default='honorarios')  # 'honorarios' ou 'outros'
    descricao_servico = db.Column(db.String(300))  # Usado quando tipo_servico = 'outros'
    numero_recibo = db.Column(db.String(50), unique=True)  # Número único do recibo
    data_emissao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    usuario_emitente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    cliente = db.relationship('Cliente')
    contador = db.relationship('Contador')
    usuario_emitente = db.relationship('Usuario')
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'cliente': self.cliente.to_dict() if self.cliente else None,
            'contador_id': self.contador_id,
            'contador': self.contador.to_dict() if self.contador else None,
            'mes': self.mes,
            'ano': self.ano,
            'valor': float(self.valor),
            'tipo_servico': self.tipo_servico,
            'descricao_servico': self.descricao_servico,
            'numero_recibo': self.numero_recibo,
            'data_emissao': self.data_emissao.isoformat() if self.data_emissao else None,
            'usuario_emitente_id': self.usuario_emitente_id,
            'usuario_emitente_nome': self.usuario_emitente.nome if self.usuario_emitente else None
        }

class ItemExcluido(db.Model):
    """Armazena itens excluídos para permitir recuperação (lixeira)"""
    __tablename__ = 'itens_excluidos'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo_entidade = db.Column(db.String(50), nullable=False)  # 'CLIENTE', 'PROCESSAMENTO', 'RECIBO', etc.
    entidade_id_original = db.Column(db.Integer, nullable=False)  # ID do item excluído
    dados_json = db.Column(db.Text, nullable=False)  # Dados completos em JSON
    data_exclusao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    usuario_exclusao_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    motivo_exclusao = db.Column(db.String(500))  # Opcional: motivo da exclusão
    restaurado = db.Column(db.Boolean, default=False, nullable=False)  # Se foi restaurado
    data_restauracao = db.Column(db.DateTime)
    usuario_restauracao_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    
    # Relacionamentos
    usuario_exclusao = db.relationship('Usuario', foreign_keys=[usuario_exclusao_id])
    usuario_restauracao = db.relationship('Usuario', foreign_keys=[usuario_restauracao_id])
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'tipo_entidade': self.tipo_entidade,
            'entidade_id_original': self.entidade_id_original,
            'dados': json.loads(self.dados_json) if self.dados_json else None,
            'data_exclusao': self.data_exclusao.isoformat() if self.data_exclusao else None,
            'usuario_exclusao_id': self.usuario_exclusao_id,
            'usuario_exclusao_nome': self.usuario_exclusao.nome if self.usuario_exclusao else None,
            'motivo_exclusao': self.motivo_exclusao,
            'restaurado': self.restaurado,
            'data_restauracao': self.data_restauracao.isoformat() if self.data_restauracao else None,
            'usuario_restauracao_id': self.usuario_restauracao_id,
            'usuario_restauracao_nome': self.usuario_restauracao.nome if self.usuario_restauracao else None
        }

class TemplateContrato(db.Model):
    """Templates de contratos com variáveis substituíveis"""
    __tablename__ = 'template_contrato'
    
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(100), nullable=False)  # contrato_social, alteracao_contratual, extincao, etc.
    nome = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text)
    conteudo = db.Column(db.Text, nullable=False)  # Template com variáveis {{variavel}}
    variaveis_requeridas = db.Column(db.Text)  # JSON array com variáveis obrigatórias
    ativo = db.Column(db.Boolean, default=True, nullable=False)
    versao = db.Column(db.String(20), default='1.0')
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    usuario_criacao_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'tipo': self.tipo,
            'nome': self.nome,
            'descricao': self.descricao,
            'conteudo': self.conteudo,
            'variaveis_requeridas': json.loads(self.variaveis_requeridas) if self.variaveis_requeridas else [],
            'ativo': self.ativo,
            'versao': self.versao,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None
        }

class Contrato(db.Model):
    """Contratos gerados a partir de templates"""
    __tablename__ = 'contrato'
    
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('template_contrato.id'), nullable=False)
    empresa_id = db.Column(db.Integer, db.ForeignKey('cliente.id'))  # Empresa (PJ) relacionada
    numero_contrato = db.Column(db.String(50), unique=True)  # Número único do contrato
    titulo = db.Column(db.String(300), nullable=False)
    tipo = db.Column(db.String(100), nullable=False)
    conteudo_gerado = db.Column(db.Text, nullable=False)  # Contrato final com dados preenchidos
    dados_variaveis = db.Column(db.Text)  # JSON com todos os dados usados
    socios_envolvidos = db.Column(db.Text)  # JSON array com IDs dos sócios
    status = db.Column(db.String(50), default='rascunho')  # rascunho, finalizado, arquivado
    observacoes = db.Column(db.Text)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_finalizacao = db.Column(db.DateTime)
    usuario_criacao_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    # Relacionamentos
    template = db.relationship('TemplateContrato')
    empresa = db.relationship('Cliente', foreign_keys=[empresa_id])
    usuario_criacao = db.relationship('Usuario', foreign_keys=[usuario_criacao_id])
    
    def to_dict(self):
        import json
        try:
            return {
                'id': self.id,
                'template_id': self.template_id,
                'template_nome': self.template.nome if self.template else None,
                'empresa_id': self.empresa_id,
                'empresa_razao_social': self.empresa.razao_social if self.empresa and self.empresa.tipo_pessoa == 'PJ' else None,
                'empresa_nome_completo': self.empresa.nome_completo if self.empresa and self.empresa.tipo_pessoa == 'PF' else None,
                'numero_contrato': self.numero_contrato,
                'titulo': self.titulo,
                'tipo': self.tipo,
                'conteudo_gerado': self.conteudo_gerado,
                'dados_variaveis': json.loads(self.dados_variaveis) if self.dados_variaveis else {},
                'socios_envolvidos': json.loads(self.socios_envolvidos) if self.socios_envolvidos else [],
                'status': self.status,
                'observacoes': self.observacoes,
                'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
                'data_finalizacao': self.data_finalizacao.isoformat() if self.data_finalizacao else None,
                'usuario_criacao_nome': self.usuario_criacao.nome if self.usuario_criacao else None
            }
        except Exception as e:
            print(f"Erro ao converter contrato {self.id} para dict: {e}")
            raise

class CNAE(db.Model):
    """Classificação Nacional de Atividades Econômicas (CNAE 2.3)"""
    __tablename__ = 'cnae'
    
    # Código CNAE (classe) - chave primária
    codigo = db.Column(db.String(10), primary_key=True)
    descricao = db.Column(db.String(500), nullable=False)
    
    # Hierarquia - Grupo
    codigo_grupo = db.Column(db.String(10), nullable=False)
    descricao_grupo = db.Column(db.String(500), nullable=False)
    
    # Hierarquia - Divisão
    codigo_divisao = db.Column(db.String(10), nullable=False)
    descricao_divisao = db.Column(db.String(500), nullable=False)
    
    # Hierarquia - Seção
    codigo_secao = db.Column(db.String(5), nullable=False)
    descricao_secao = db.Column(db.String(500), nullable=False)
    
    # Informações do Simples Nacional
    permitido_simples = db.Column(db.Boolean, default=True)  # Se é permitido no Simples Nacional
    anexo_simples = db.Column(db.String(10))  # I, II, III, IV, V ou combinações
    tem_fator_r = db.Column(db.Boolean, default=False)  # Se aplica fator R
    obriga_inscricao_estadual = db.Column(db.Boolean, default=False)  # Se obriga inscrição estadual
    aliquota_estimada = db.Column(db.String(20))  # Faixa de alíquota estimada
    
    # Observações detalhadas (JSON)
    observacoes = db.Column(db.Text)  # JSON array com observações
    atividades_compreendidas = db.Column(db.Text)  # JSON array com atividades que o CNAE compreende
    
    # Informações detalhadas adicionais
    descricao_detalhada = db.Column(db.Text)  # Descrição detalhada: "Esta atividade compreende..."
    lista_atividades = db.Column(db.Text)  # JSON array com lista específica de atividades
    notas_explicativas_secao = db.Column(db.Text)  # Notas explicativas da seção (IBGE)
    
    # Índices para busca eficiente
    __table_args__ = (
        db.Index('idx_cnae_descricao', 'descricao'),
        db.Index('idx_cnae_grupo', 'codigo_grupo'),
        db.Index('idx_cnae_divisao', 'codigo_divisao'),
        db.Index('idx_cnae_secao', 'codigo_secao'),
        db.Index('idx_cnae_anexo', 'anexo_simples'),
    )
    
    def to_dict(self):
        import json
        return {
            'codigo': self.codigo,
            'descricao': self.descricao,
            'grupo': {
                'codigo': self.codigo_grupo,
                'descricao': self.descricao_grupo
            },
            'divisao': {
                'codigo': self.codigo_divisao,
                'descricao': self.descricao_divisao
            },
            'secao': {
                'codigo': self.codigo_secao,
                'descricao': self.descricao_secao
            },
            'simples_nacional': {
                'permitido': self.permitido_simples,
                'anexo': self.anexo_simples,
                'tem_fator_r': self.tem_fator_r,
                'obriga_inscricao_estadual': self.obriga_inscricao_estadual,
                'aliquota_estimada': self.aliquota_estimada
            },
            'atividades_compreendidas': json.loads(self.atividades_compreendidas) if self.atividades_compreendidas else [],
            'observacoes': json.loads(self.observacoes) if self.observacoes else [],
            'descricao_detalhada': self.descricao_detalhada,
            'lista_atividades': json.loads(self.lista_atividades) if self.lista_atividades else [],
            'notas_explicativas_secao': self.notas_explicativas_secao
        }

class TemplateRelatorio(db.Model):
    __tablename__ = 'template_relatorio'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    conteudo = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(50), nullable=False, default='relatorio_custom')
    status = db.Column(db.String(20), nullable=False, default='ativo')  # ativo, inativo, rascunho
    usuario_criador_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relacionamento com usuário
    usuario_criador = db.relationship('Usuario', backref='templates_relatorio')
    
    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'conteudo': self.conteudo,
            'tipo': self.tipo,
            'status': self.status,
            'usuario_criador_id': self.usuario_criador_id,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'ativo': self.ativo
        }