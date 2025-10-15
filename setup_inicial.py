#!/usr/bin/env python3
"""
Script de setup inicial do sistema.
Cria o banco de dados, executa migrations e popula com dados iniciais.
"""
import os
import sys
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    """Executa um comando e retorna se foi bem sucedido."""
    try:
        print(f"\nExecutando: {command}")
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERRO] Erro ao executar comando: {e}")
        if e.stderr:
            print(f"Erro: {e.stderr}")
        return False

def get_python_executable(backend_dir):
    """Retorna o executável Python do venv se existir."""
    venv_path = backend_dir / 'venv'
    if venv_path.exists():
        python_exe = venv_path / 'Scripts' / 'python.exe'
        if python_exe.exists():
            return str(python_exe)
    return 'python'

def main():
    print("=" * 60)
    print("SETUP INICIAL - SISTEMA CONTABIL")
    print("=" * 60)
    
    backend_dir = Path(__file__).parent / 'backend'
    python_exe = get_python_executable(backend_dir)
    
    # 1. Verificar se o arquivo .env existe
    env_file = backend_dir / '.env'
    env_example = backend_dir / 'config.example.env'
    
    if not env_file.exists():
        print("\nCriando arquivo .env...")
        if env_example.exists():
            import shutil
            shutil.copy(env_example, env_file)
            print("[OK] Arquivo .env criado a partir do config.example.env")
            print("[AVISO] IMPORTANTE: Edite o arquivo .env com suas configuracoes!")
        else:
            # Criar .env básico
            with open(env_file, 'w', encoding='utf-8') as f:
                f.write("DATABASE_URL=sqlite:///sistema_contabil.db\n")
                f.write("JWT_SECRET_KEY=dev-secret-key-change-in-production\n")
                f.write("FRONTEND_URL=http://localhost:5000\n")
            print("[OK] Arquivo .env basico criado")
    else:
        print("\n[OK] Arquivo .env ja existe")
    
    # 2. Ativar ambiente virtual (se existir)
    venv_path = backend_dir / 'venv'
    if venv_path.exists():
        print("\nAmbiente virtual encontrado")
    
    # 3. Verificar/Instalar dependências
    print("\nInstalando dependencias Python...")
    if not run_command(f"{python_exe} -m pip install -r requirements.txt", cwd=str(backend_dir)):
        print("[AVISO] Falha ao instalar algumas dependencias")
    
    # 4. Limpar banco de dados anterior (se existir)
    db_file = backend_dir / 'sistema_contabil.db'
    if db_file.exists():
        print(f"\nRemovendo banco de dados anterior: {db_file}")
        db_file.unlink()
    
    # 5. Criar diretório de migrations se não existir
    migrations_dir = backend_dir / 'migrations'
    if not migrations_dir.exists():
        print("\nInicializando migrations...")
        if not run_command(f"{python_exe} -m flask db init", cwd=str(backend_dir)):
            print("[ERRO] Falha ao inicializar migrations")
            return False
    
    # 6. Criar migration inicial
    print("\nCriando migration...")
    if not run_command(f'{python_exe} -m flask db migrate -m "Setup inicial"', cwd=str(backend_dir)):
        print("[ERRO] Falha ao criar migration")
        return False
    
    # 7. Aplicar migrations
    print("\nAplicando migrations...")
    if not run_command(f"{python_exe} -m flask db upgrade", cwd=str(backend_dir)):
        print("[ERRO] Falha ao aplicar migrations")
        return False
    
    # 8. Popular banco de dados
    print("\nPopulando banco de dados com dados iniciais...")
    if not run_command(f"{python_exe} -m flask seed-db", cwd=str(backend_dir)):
        print("[AVISO] Falha ao popular banco de dados")
    
    print("\n" + "=" * 60)
    print("SETUP CONCLUIDO COM SUCESSO!")
    print("=" * 60)
    print("\nProximos passos:")
    print("   1. Execute 'python build_frontend.py' para buildar o frontend")
    print("   2. Execute 'iniciar_sistema.bat' para iniciar o sistema")
    print("   3. Acesse http://localhost:5000 no navegador")
    print("\nCredenciais padrao:")
    print("   Email: admin@contabil.com")
    print("   Senha: admin123")
    print()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

