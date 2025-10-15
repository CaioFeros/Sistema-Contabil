#!/usr/bin/env python3
"""
Script para fazer o build do frontend React e preparar para produção.
"""
import os
import sys
import shutil
import subprocess

def run_command(command, cwd=None):
    """Executa um comando e retorna se foi bem sucedido."""
    try:
        print(f"\nExecutando: {command}")
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, 
                              capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERRO] Erro ao executar comando: {e}")
        print(f"Output: {e.output if hasattr(e, 'output') else 'N/A'}")
        return False

def main():
    print("=" * 60)
    print("BUILD DO FRONTEND - SISTEMA CONTABIL")
    print("=" * 60)
    
    # Diretórios
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    build_output = os.path.join(frontend_dir, 'dist')
    final_location = os.path.join(backend_dir, 'frontend_build')
    
    # 1. Verificar se o Node.js está instalado
    print("\nVerificando Node.js...")
    if not run_command("node --version"):
        print("[ERRO] Node.js nao encontrado. Instale o Node.js primeiro.")
        return False
    
    # 2. Instalar dependências
    print("\nInstalando dependencias do frontend...")
    if not run_command("npm install", cwd=frontend_dir):
        print("[ERRO] Falha ao instalar dependencias.")
        return False
    
    # 3. Build do frontend
    print("\nBuildando o frontend React...")
    if not run_command("npm run build", cwd=frontend_dir):
        print("[ERRO] Falha no build do frontend.")
        return False
    
    # 4. Remover build anterior
    if os.path.exists(final_location):
        print(f"\nRemovendo build anterior em {final_location}...")
        shutil.rmtree(final_location)
    
    # 5. Copiar build para o backend
    print(f"\nCopiando build para {final_location}...")
    shutil.copytree(build_output, final_location)
    
    print("\n" + "=" * 60)
    print("BUILD CONCLUIDO COM SUCESSO!")
    print("=" * 60)
    print(f"\nArquivos buildados em: {final_location}")
    print("\nAgora voce pode:")
    print("   1. Executar 'iniciar_sistema.bat' para rodar o sistema")
    print("   2. Acessar http://localhost:5000 no navegador")
    print()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

