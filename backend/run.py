# c:\Users\Caio\IdeaProjects\Sistema Contabil\backend\run.py

from dotenv import load_dotenv
from app import create_app

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Cria a instância da aplicação usando a função de fábrica
app = create_app()

# Este bloco é útil para rodar em modo de desenvolvimento local (ex: python run.py)
if __name__ == '__main__':
    # O host='0.0.0.0' permite que o servidor seja acessível de fora do container
    app.run(host='0.0.0.0')
