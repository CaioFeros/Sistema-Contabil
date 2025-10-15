@echo off
chcp 65001 >nul
title Sistema Contábil - Instalação

echo ============================================================
echo    📦 SISTEMA CONTÁBIL - INSTALAÇÃO COMPLETA
echo ============================================================
echo.
echo Este script irá:
echo   1. Configurar o banco de dados
echo   2. Instalar dependências Python
echo   3. Buildar o frontend React
echo   4. Preparar o sistema para uso
echo.
echo ⏱️  Tempo estimado: 5-10 minutos
echo.
pause

REM Verifica Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo.
    echo Instale o Python 3.8 ou superior primeiro:
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

REM Verifica Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado!
    echo.
    echo Instale o Node.js 16 ou superior primeiro:
    echo https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Executa setup inicial
echo ============================================================
echo PASSO 1/2: Configurando banco de dados...
echo ============================================================
python setup_inicial.py
if errorlevel 1 (
    echo.
    echo ❌ Erro no setup inicial!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo PASSO 2/2: Buildando frontend...
echo ============================================================
python build_frontend.py
if errorlevel 1 (
    echo.
    echo ❌ Erro no build do frontend!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo    ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ============================================================
echo.
echo 🚀 Para iniciar o sistema:
echo    Execute: iniciar_sistema.bat
echo.
echo 🌐 Ou execute manualmente:
echo    python iniciar_sistema.py
echo.
echo 📝 Credenciais padrão:
echo    Email: admin@contabil.com
echo    Senha: admin123
echo.

pause

