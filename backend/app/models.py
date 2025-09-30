from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(256), nullable=False)
    papel = db.Column(db.String(80), nullable=False, default='ADMIN')

class Cliente(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    razao_social = db.Column(db.String(200), nullable=False)
    cnpj = db.Column(db.String(18), unique=True, nullable=False)
    regime_tributario = db.Column(db.String(100), nullable=False)

class Processamento(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id'), nullable=False)
    mes = db.Column(db.Integer, nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    faturamento_total = db.Column(db.Numeric(10, 2), nullable=False)
    imposto_calculado = db.Column(db.Numeric(10, 2), nullable=False)
    nome_arquivo_original = db.Column(db.String(255), nullable=False)
    data_processamento = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    cliente = db.relationship('Cliente')
    detalhes = db.relationship('FaturamentoDetalhe', backref='processamento', lazy=True, cascade="all, delete-orphan")

    # Garante que só pode haver um processamento por cliente/mês/ano
    __table_args__ = (db.UniqueConstraint('cliente_id', 'mes', 'ano', name='_cliente_mes_ano_uc'),)

class FaturamentoDetalhe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    processamento_id = db.Column(db.Integer, db.ForeignKey('processamento.id'), nullable=False)
    descricao_servico = db.Column(db.String(300), nullable=False)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
