@echo off
chcp 65001 >nul
title Sistema Contábil - Parando Servidor

echo ============================================================
echo    🛑 SISTEMA CONTÁBIL - PARANDO SERVIDOR
echo ============================================================
echo.

REM Para todos os processos Python que estejam executando o Flask
echo Procurando processos do Flask...
taskkill /F /FI "WINDOWTITLE eq Sistema Contábil - Servidor" >nul 2>&1

REM Alternativa: parar todos os processos Python (cuidado!)
REM taskkill /F /IM python.exe >nul 2>&1

echo.
echo ✅ Servidor parado!
echo.

pause

