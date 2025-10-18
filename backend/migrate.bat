@echo off
REM Script para gerenciar migrações do banco de dados
REM Uso: migrate.bat [comando] [argumentos]

cd /d %~dp0
set FLASK_APP=run.py

if "%1"=="upgrade" (
    echo ================================
    echo Aplicando migrações ao banco...
    echo ================================
    call venv\Scripts\activate.bat
    flask db upgrade
    if %errorlevel% equ 0 (
        echo.
        echo ✓ Migrações aplicadas com sucesso!
    ) else (
        echo.
        echo ✗ Erro ao aplicar migrações!
    )
) else if "%1"=="migrate" (
    if "%2"=="" (
        echo ✗ Erro: Você precisa fornecer uma descrição para a migração
        echo Exemplo: migrate.bat migrate "adicionar tabela lixeira"
        goto end
    )
    echo ================================
    echo Criando nova migração: %~2
    echo ================================
    call venv\Scripts\activate.bat
    flask db migrate -m "%~2"
    if %errorlevel% equ 0 (
        echo.
        echo ✓ Migração criada com sucesso!
        echo Execute 'migrate.bat upgrade' para aplicá-la
    ) else (
        echo.
        echo ✗ Erro ao criar migração!
    )
) else if "%1"=="current" (
    echo ================================
    echo Estado atual das migrações:
    echo ================================
    call venv\Scripts\activate.bat
    flask db current
) else if "%1"=="history" (
    echo ================================
    echo Histórico de migrações:
    echo ================================
    call venv\Scripts\activate.bat
    flask db history
) else if "%1"=="downgrade" (
    echo ================================
    echo Revertendo última migração...
    echo ================================
    echo AVISO: Esta ação pode resultar em perda de dados!
    set /p confirma="Tem certeza? (S/N): "
    if /i "%confirma%"=="S" (
        call venv\Scripts\activate.bat
        flask db downgrade
        if %errorlevel% equ 0 (
            echo.
            echo ✓ Migração revertida com sucesso!
        ) else (
            echo.
            echo ✗ Erro ao reverter migração!
        )
    ) else (
        echo Operação cancelada.
    )
) else if "%1"=="stamp" (
    if "%2"=="" (
        echo ✗ Erro: Você precisa fornecer uma revisão
        echo Exemplo: migrate.bat stamp head
        goto end
    )
    echo ================================
    echo Marcando banco com revisão: %2
    echo ================================
    call venv\Scripts\activate.bat
    flask db stamp %2
) else (
    echo ================================
    echo Sistema de Migração do Banco
    echo ================================
    echo.
    echo Comandos disponíveis:
    echo.
    echo   migrate.bat upgrade              - Aplica todas as migrações pendentes ao banco
    echo   migrate.bat migrate "desc"       - Cria uma nova migração com a descrição fornecida
    echo   migrate.bat current              - Mostra o estado atual das migrações
    echo   migrate.bat history              - Mostra o histórico completo de migrações
    echo   migrate.bat downgrade            - Reverte a última migração aplicada
    echo   migrate.bat stamp head           - Marca o banco como estando na versão mais recente
    echo.
    echo Exemplos:
    echo   migrate.bat upgrade
    echo   migrate.bat migrate "adicionar tabela lixeira"
    echo   migrate.bat current
    echo.
)

:end
cd ..

