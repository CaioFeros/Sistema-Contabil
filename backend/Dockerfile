 # Usar uma imagem oficial do Python como imagem pai (Alpine é leve e consistente com o resto do projeto)
 FROM python:3.11-alpine
 
 # Instala o netcat (para o script wait-for-it.sh) e dependências de build para psycopg2 em Alpine
 RUN apk add --no-cache netcat-openbsd postgresql-dev gcc musl-dev
 
 # Definir o diretório de trabalho dentro do contêiner
 WORKDIR /app
 
 # Copiar o arquivo de dependências primeiro para aproveitar o cache do Docker
 COPY requirements.txt .
 
 # Instalar as dependências
 RUN pip install --no-cache-dir -r requirements.txt
 
 # Copiar o restante do código da aplicação para o contêiner
 COPY . .
 
 # Expor a porta que a aplicação vai rodar
 EXPOSE 5000
 # O comando para iniciar a aplicação (CMD) será fornecido pelo docker-compose.yml,
 # o que é ideal para alternar entre desenvolvimento e produção.
