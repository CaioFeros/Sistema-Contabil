 # Usar uma imagem base oficial do Python
 FROM python:3.11-slim
 
 # Definir o diretório de trabalho dentro do contêiner
 WORKDIR /app
 
 # Copiar o arquivo de dependências para o contêiner
 COPY requirements.txt .
 
 # Instalar as dependências
 RUN pip install --no-cache-dir -r requirements.txt
 
 # Copiar o restante do código da aplicação para o contêiner
 COPY . .
 
 # Expor a porta que a aplicação vai rodar
 EXPOSE 5000
 
 # Comando para iniciar a aplicação usando Gunicorn
 # Gunicorn é um servidor WSGI mais robusto para produção do que o servidor de desenvolvimento do Flask.
 # O bind 0.0.0.0:5000 faz o servidor ser acessível de fora do contêiner.
 CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]