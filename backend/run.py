# c:\Users\Caio\IdeaProjects\Sistema Contabil\backend\run.py

from dotenv import load_dotenv
from app import create_app

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Define variáveis de ambiente para desenvolvimento se não estiverem definidas
import os
if not os.environ.get('JWT_SECRET_KEY'):
    os.environ['JWT_SECRET_KEY'] = 'dev-secret-key-change-in-production'

if not os.environ.get('FLASK_DEBUG'):
    os.environ['FLASK_DEBUG'] = '1'

# Cria a instância da aplicação usando a função de fábrica
app = create_app()

# Este bloco é útil para rodar em modo de desenvolvimento local (ex: python run.py)
if __name__ == '__main__':
    print('Iniciando servidor Flask...')
    print('Modo de desenvolvimento ativo')
    print('Servidor disponível em: http://localhost:5000')
    
    # O host='0.0.0.0' permite que o servidor seja acessível de fora do container
    app.run(host='0.0.0.0', port=5000, debug=True)
