import os
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from .models import db
from .auth import auth_bp
from .routes import api_bp
import seed

migrate = Migrate()

def create_app():
    """
    Cria e configura uma instância da aplicação Flask.
    Este é o padrão Application Factory.
    """
    app = Flask(__name__)

    # Carrega a configuração a partir de variáveis de ambiente
    # Garante que as variáveis de ambiente sejam carregadas antes de serem usadas.
    # A chamada a load_dotenv() deve estar no seu arquivo de entrada (ex: run.py)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')

    # Configura o CORS de forma flexível
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    CORS(app, resources={r"/api/*": {"origins": frontend_url}})

    # Inicializa as extensões com a aplicação
    db.init_app(app)
    migrate.init_app(app, db)

    # Registra os Blueprints com prefixo de URL
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    # Registra comandos customizados do Flask (como o 'seed-db')
    seed.register_commands(app)

    @app.route("/")
    def hello_world():
        """Rota de teste inicial."""
        return {"mensagem": "Olá, Mundo! O backend está no ar."}

    return app
