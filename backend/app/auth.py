import os
import jwt
import time
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, Blueprint
from werkzeug.security import generate_password_hash, check_password_hash
from .models import db, Usuario
from .audit import log_action, log_login

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
            
            # Converte 'sub' de string para inteiro
            user_id = int(data['sub'])
            current_user = Usuario.query.get(user_id)
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

def admin_required(f):
    """Decorator que requer que o usuário seja ADMIN"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Extrai o current_user dos argumentos (deve ser o primeiro argumento após o decorator)
        if args and hasattr(args[0], 'papel'):
            current_user = args[0]
        else:
            return jsonify({"erro": "Usuário não autenticado"}), 401
            
        if current_user.papel != 'ADMIN':
            return jsonify({"erro": "Acesso negado. Permissões de administrador necessárias."}), 403
            
        return f(*args, **kwargs)
    return decorated

@auth_bp.route("/register", methods=["POST"])
@token_required
@admin_required
def register_user(current_user):
    data = request.get_json()
    if not data or not data.get('username') or not data.get('senha') or not data.get('nome'):
        return jsonify({"erro": "Username, senha e nome são obrigatórios"}), 400

    username = data['username']
    email = data.get('email', '')
    senha = data['senha']
    nome = data['nome']
    papel = data.get('papel', 'USER')

    if Usuario.query.filter_by(username=username).first():
        return jsonify({"erro": "Usuário com este username já existe"}), 409
    
    if email and Usuario.query.filter_by(email=email).first():
        return jsonify({"erro": "Usuário com este email já existe"}), 409

    senha_hash = generate_password_hash(senha, method='pbkdf2:sha256')
    novo_usuario = Usuario(
        username=username,
        email=email, 
        senha_hash=senha_hash, 
        nome=nome, 
        papel=papel
    )
    db.session.add(novo_usuario)
    db.session.commit()

    # Log da criação do usuário
    log_action(current_user.id, 'CREATE', 'USUARIO', novo_usuario.id, {
        'novo_usuario_username': username,
        'novo_usuario_email': email,
        'novo_usuario_nome': nome,
        'papel': papel
    })

    return jsonify({"mensagem": "Usuário registrado com sucesso!"}), 201

@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('senha'):
        return jsonify({"erro": "Username e senha são obrigatórios"}), 400

    username = data['username']
    senha = data['senha']
    usuario = Usuario.query.filter_by(username=username).first()

    if not usuario:
        # Username não encontrado
        return jsonify({"erro": "Username não cadastrado"}), 401
    
    if not check_password_hash(usuario.senha_hash, senha):
        # Senha incorreta
        log_login(usuario.id, False, "Senha incorreta")
        return jsonify({"erro": "Senha incorreta"}), 401

    if not usuario.ativo:
        log_login(usuario.id, False, "Usuário inativo")
        return jsonify({"erro": "Usuário inativo"}), 401

    # Atualiza último login
    usuario.ultimo_login = datetime.utcnow()
    db.session.commit()

    payload = {
        'sub': str(usuario.id),  # JWT requer que 'sub' seja string
        'iat': int(time.time()),
        'exp': int(time.time()) + 3600  # 1 hora em segundos
    }

    secret_key = os.environ.get('JWT_SECRET_KEY')
    token = jwt.encode(payload, secret_key, algorithm="HS256")

    # Log de login bem-sucedido
    log_login(usuario.id, True)

    return jsonify({
        "token": token,
        "usuario": usuario.to_dict()
    })

@auth_bp.route("/usuarios", methods=["GET"])
@token_required
@admin_required
def listar_usuarios(current_user):
    """Lista todos os usuários"""
    usuarios = Usuario.query.all()
    return jsonify([usuario.to_dict() for usuario in usuarios])

@auth_bp.route("/usuarios/<int:usuario_id>", methods=["DELETE"])
@token_required
@admin_required
def excluir_usuario(current_user, usuario_id):
    """Exclui um usuário"""
    if usuario_id == current_user.id:
        return jsonify({"erro": "Não é possível excluir seu próprio usuário"}), 400
    
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404
    
    # Log da exclusão
    log_action(current_user.id, 'DELETE', 'USUARIO', usuario_id, {
        'usuario_excluido_email': usuario.email,
        'usuario_excluido_nome': usuario.nome
    })
    
    db.session.delete(usuario)
    db.session.commit()
    
    return jsonify({"mensagem": "Usuário excluído com sucesso"})

@auth_bp.route("/usuarios/<int:usuario_id>/toggle", methods=["PUT"])
@token_required
@admin_required
def toggle_usuario_status(current_user, usuario_id):
    """Ativa/desativa um usuário"""
    if usuario_id == current_user.id:
        return jsonify({"erro": "Não é possível alterar o status do seu próprio usuário"}), 400
    
    usuario = Usuario.query.get(usuario_id)
    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404
    
    # Inverte o status
    usuario.ativo = not usuario.ativo
    db.session.commit()
    
    # Log da alteração
    log_action(current_user.id, 'UPDATE', 'USUARIO', usuario_id, {
        'usuario_email': usuario.email,
        'usuario_nome': usuario.nome,
        'novo_status': 'ativo' if usuario.ativo else 'inativo'
    })
    
    return jsonify({
        "mensagem": f"Usuário {'ativado' if usuario.ativo else 'desativado'} com sucesso",
        "usuario": usuario.to_dict()
    })

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    """Retorna informações do usuário atual"""
    return jsonify(current_user.to_dict())
