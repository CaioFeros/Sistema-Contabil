@echo off
chcp 65001 >nul
title Sistema Contábil - Servidor

echo ============================================================
echo    🚀 SISTEMA CONTÁBIL - INICIANDO SERVIDOR
echo ============================================================
echo.

REM Verifica se o Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo.
    echo Por favor, instale o Python 3.8 ou superior.
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

REM Navega para o diretório do backend
cd /d "%~dp0backend"

REM Ativa o ambiente virtual se existir
if exist "venv\Scripts\activate.bat" (
    echo 🐍 Ativando ambiente virtual...
    call venv\Scripts\activate.bat
)

REM Verifica se o arquivo .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado!
    echo.
    echo Execute primeiro: python ..\setup_inicial.py
    pause
    exit /b 1
)

REM Verifica se o frontend foi buildado
if not exist "frontend_build\index.html" (
    echo ⚠️  Frontend não foi buildado!
    echo.
    echo Execute primeiro: python ..\build_frontend.py
    pause
    exit /b 1
)

echo 🌐 Iniciando servidor Flask...
echo.
echo ============================================================
echo.
echo    ✅ Sistema Contábil rodando!
echo.
echo    📍 Acesse: http://localhost:5000
echo.
echo    🔐 Login padrão:
echo       Email: admin@contabil.com
echo       Senha: admin123
echo.
echo    ⚠️  Para parar o servidor: Feche esta janela
echo       ou pressione Ctrl+C
echo.
echo ============================================================
echo.

REM Abre o navegador automaticamente após 3 segundos
start "" timeout /t 3 /nobreak >nul && start http://localhost:5000

REM Inicia o servidor Flask
python run.py

REM Se o servidor parar, pausa para mostrar mensagens de erro
pause

