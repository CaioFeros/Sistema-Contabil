#!/usr/bin/env python3
"""
Script alternativo para iniciar o sistema (multiplataforma).
Abre o navegador automaticamente e inicia o servidor Flask.
"""
import os
import sys
import time
import webbrowser
import subprocess
from pathlib import Path
from threading import Timer

def open_browser():
    """Abre o navegador após alguns segundos."""
    time.sleep(3)
    print("\nAbrindo navegador...")
    webbrowser.open('http://localhost:5000')

def main():
    print("=" * 60)
    print("SISTEMA CONTABIL - INICIANDO SERVIDOR")
    print("=" * 60)
    
    backend_dir = Path(__file__).parent / 'backend'
    
    # Verificar se o .env existe
    if not (backend_dir / '.env').exists():
        print("\n[ERRO] Arquivo .env nao encontrado!")
        print("Execute primeiro: python setup_inicial.py")
        sys.exit(1)
    
    # Verificar se o frontend foi buildado
    if not (backend_dir / 'frontend_build' / 'index.html').exists():
        print("\n[ERRO] Frontend nao foi buildado!")
        print("Execute primeiro: python build_frontend.py")
        sys.exit(1)
    
    print("\n[OK] Todos os arquivos necessarios encontrados")
    print("\nIniciando servidor Flask...")
    print("\n" + "=" * 60)
    print("\n   [OK] Sistema Contabil rodando!")
    print("\n   Acesse: http://localhost:5000")
    print("\n   Login padrao:")
    print("      Username: admin")
    print("      Senha: admin123")
    print("\n   Para parar o servidor: Pressione Ctrl+C")
    print("\n" + "=" * 60 + "\n")
    
    # Abre o navegador em uma thread separada
    Timer(3, open_browser).start()
    
    # Inicia o servidor
    os.chdir(backend_dir)
    
    try:
        # Tenta usar o ambiente virtual se existir
        if (backend_dir / 'venv').exists():
            if sys.platform == 'win32':
                python_exe = backend_dir / 'venv' / 'Scripts' / 'python.exe'
            else:
                python_exe = backend_dir / 'venv' / 'bin' / 'python'
            
            if python_exe.exists():
                subprocess.run([str(python_exe), 'run.py'])
            else:
                subprocess.run([sys.executable, 'run.py'])
        else:
            subprocess.run([sys.executable, 'run.py'])
    except KeyboardInterrupt:
        print("\n\nServidor parado pelo usuario")
        sys.exit(0)

if __name__ == "__main__":
    main()

