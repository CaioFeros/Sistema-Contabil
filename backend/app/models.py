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

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Dados Básicos
    razao_social = db.Column(db.String(200), nullable=False)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    regime_tributario = db.Column(db.String(100), nullable=False)
    nome_fantasia = db.Column(db.String(200))
    data_abertura = db.Column(db.String(10))
    
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
    
    def to_dict(self):
        """Converte o objeto Cliente para um dicionário"""
        import json
        return {
            'id': self.id,
            'razao_social': self.razao_social,
            'cnpj': self.cnpj,
            'regime_tributario': self.regime_tributario,
            'nome_fantasia': self.nome_fantasia,
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
            'data_situacao_especial': self.data_situacao_especial
        }

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
