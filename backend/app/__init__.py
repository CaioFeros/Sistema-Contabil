import os
from flask import Flask, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from .models import db
from .auth import auth_bp
from .routes import api_bp
from .logs import logs_bp
from .atividades import atividades_bp
import seed

migrate = Migrate()

def create_app():
    """
    Cria e configura uma instância da aplicação Flask.
    Este é o padrão Application Factory.
    """
    app = Flask(__name__, static_folder='../frontend_build')

    # Carrega a configuração a partir de variáveis de ambiente
    # Garante que as variáveis de ambiente sejam carregadas antes de serem usadas.
    # A chamada a load_dotenv() deve estar no seu arquivo de entrada (ex: run.py)
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///sistema_contabil.db')
    
    # Para SQLite, garante que o caminho seja absoluto
    if database_url.startswith('sqlite:///'):
        db_path = database_url.replace('sqlite:///', '')
        if not os.path.isabs(db_path):
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), db_path)
            database_url = f'sqlite:///{db_path}'
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')

    # Configura o CORS de forma flexível
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5000')
    # Permite requisições do mesmo servidor e do frontend dev
    allowed_origins = [frontend_url, 'http://localhost:5000', 'http://localhost:5173']
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    # Inicializa as extensões com a aplicação
    db.init_app(app)
    migrate.init_app(app, db)

    # Registra os Blueprints com prefixo de URL
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(atividades_bp)

    # Registra comandos customizados do Flask (como o 'seed-db')
    seed.register_commands(app)

    # Serve o frontend buildado (para modo produção/executável)
    @app.route("/")
    def index():
        """Serve o index.html do frontend."""
        frontend_build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend_build')
        if os.path.exists(os.path.join(frontend_build_path, 'index.html')):
            return send_from_directory(frontend_build_path, 'index.html')
        return {"mensagem": "Backend está rodando. Build do frontend não encontrado."}

    @app.route("/<path:path>")
    def serve_static(path):
        """Serve arquivos estáticos do frontend."""
        frontend_build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend_build')
        if os.path.exists(os.path.join(frontend_build_path, path)):
            return send_from_directory(frontend_build_path, path)
        # Se o arquivo não existe, retorna o index.html (para suportar React Router)
        if os.path.exists(os.path.join(frontend_build_path, 'index.html')):
            return send_from_directory(frontend_build_path, 'index.html')
        return {"erro": "Arquivo não encontrado"}, 404

    return app
