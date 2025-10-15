@echo off
chcp 65001 >nul
title Sistema Contábil - Backup

echo ============================================================
echo    BACKUP DO BANCO DE DADOS
echo ============================================================
echo.

REM Cria pasta de backup se não existir
if not exist "backup" mkdir backup

REM Gera nome com data e hora
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%b-%%a)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set datetime=%mydate%_%mytime%

REM Copia o banco
if exist "backend\sistema_contabil.db" (
    copy "backend\sistema_contabil.db" "backup\sistema_contabil_%datetime%.db"
    echo [OK] Backup criado com sucesso!
    echo.
    echo Arquivo: backup\sistema_contabil_%datetime%.db
    echo.
) else (
    echo [ERRO] Banco de dados nao encontrado!
    echo Certifique-se de que o sistema esta parado antes de fazer backup.
    echo.
)

pause

