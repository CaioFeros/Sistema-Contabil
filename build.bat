@echo off
echo ========================================
echo    SISTEMA CONTABIL - BUILD COMPLETO
echo ========================================
echo.

echo [1/4] Preparando ambiente...
cd backend
call venv\Scripts\activate.bat
echo Ambiente virtual ativado.

echo.
echo [2/4] Buildando Frontend...
cd ..\frontend
echo Instalando dependencias do frontend...
call npm install
echo Buildando frontend...
call npm run build
echo Frontend buildado com sucesso!

echo.
echo [3/4] Copiando build do frontend para backend...
if exist "..\backend\frontend_build" rmdir /s /q "..\backend\frontend_build"
xcopy "dist" "..\backend\frontend_build" /e /i /h
echo Build copiado para backend.

echo.
echo [4/4] Testando Backend...
cd ..\backend
echo Testando servidor Flask...
python -c "from app import create_app; app = create_app(); print('Backend configurado corretamente!')"
echo.

echo ========================================
echo    BUILD COMPLETO COM SUCESSO!
echo ========================================
echo.
echo Para iniciar o sistema:
echo 1. Execute: iniciar.bat
echo 2. Ou navegue para backend e execute: python run.py
echo.
echo Sistema disponivel em: http://localhost:5000
echo.
echo Fechando em 3 segundos...
timeout /t 3 /nobreak >nul
exit
