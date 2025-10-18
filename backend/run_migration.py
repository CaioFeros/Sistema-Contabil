#!/usr/bin/env python3
"""
Script para executar migrações do Alembic com contexto Flask
"""
import os
import sys
from dotenv import load_dotenv

# Carrega as variáveis de ambiente
load_dotenv()

# Adiciona o diretório app ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app import create_app
from app.models import db

def run_migration():
    """Executa a migração do Alembic"""
    app = create_app()
    
    with app.app_context():
        # Importa e executa o comando de upgrade
        from flask_migrate import upgrade
        upgrade()

if __name__ == '__main__':
    run_migration()