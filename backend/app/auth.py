import os
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, Usuario

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # --- BYPASS DE DESENVOLVIMENTO ---
        # Se o FLASK_DEBUG estiver ativo, pulamos a validação do token.
        if os.environ.get('FLASK_DEBUG') == '1':
            # Usamos o primeiro usuário do banco como o 'current_user' para as rotas.
            # Isso requer que o comando 'seed-db' tenha sido executado pelo menos uma vez.
            dev_user = Usuario.query.first()
            if not dev_user:
                return jsonify({"erro": "Modo de desenvolvimento ativo, mas nenhum usuário encontrado no banco. Execute 'flask seed-db'."}), 500
            return f(dev_user, *args, **kwargs)

        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({"erro": "Token de autenticação ausente!"}), 401

        try:
            secret_key = os.environ.get('JWT_SECRET_KEY')
            data = jwt.decode(token, secret_key, algorithms=["HS256"])
            current_user = Usuario.query.get(data['sub'])
            if not current_user:
                return jsonify({"erro": "Usuário não encontrado!"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"erro": "Token expirado!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"erro": "Token inválido!"}), 401
        except Exception as e:
            return jsonify({"erro": f"Erro ao processar token: {str(e)}"}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('senha'):
        return jsonify({"erro": "Email e senha são obrigatórios"}), 400

    email = data['email']
    senha = data['senha']

    if Usuario.query.filter_by(email=email).first():
        return jsonify({"erro": "Usuário com este email já existe"}), 409

    senha_hash = generate_password_hash(senha, method='pbkdf2:sha256')
    novo_usuario = Usuario(email=email, senha_hash=senha_hash)
    db.session.add(novo_usuario)
    db.session.commit()

    return jsonify({"mensagem": "Usuário registrado com sucesso!"}), 201

@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('senha'):
        return jsonify({"erro": "Email e senha são obrigatórios"}), 400

    email = data['email']
    senha = data['senha']
    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario or not check_password_hash(usuario.senha_hash, senha):
        return jsonify({"erro": "Credenciais inválidas"}), 401

    payload = {
        'sub': usuario.id,
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=1)
    }

    secret_key = os.environ.get('JWT_SECRET_KEY')
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    return jsonify({"token_de_acesso": token})
