import os
from flask import Flask
from flask_migrate import Migrate
from dotenv import load_dotenv
from .models import db
from flask_cors import CORS
from .auth import auth_bp
from .routes import api_bp

migrate = Migrate()

# Carrega as variáveis de ambiente do arquivo .env
# Esta é a única chamada necessária.
load_dotenv()

# Cria a instância da aplicação Flask
app = Flask(__name__)

# Configura o CORS para permitir requisições do frontend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Configuração do Banco de Dados e JWT a partir das variáveis de ambiente
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')

# Inicializa as extensões com a aplicação
db.init_app(app)
migrate.init_app(app, db)

# Registra os Blueprints (conjuntos de rotas)
app.register_blueprint(auth_bp)
app.register_blueprint(api_bp)

@app.route("/")
def hello_world():
    """Rota de teste inicial."""
    return {"mensagem": "Olá, Mundo! O backend está no ar."}

# Registra comandos customizados do Flask (como o 'seed-db')
from . import seed
seed.register_commands(app)
