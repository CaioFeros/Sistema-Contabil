# Solução: Problema com Migrações do Banco de Dados

## O Problema

Você estava recebendo este erro:
```
FAILED: No 'script_location' key found in configuration.
```

**Este NÃO é um problema do Cursor!** É um erro de configuração do Alembic.

## O Que Estava Errado

1. O arquivo `backend/migrations/alembic.ini` estava **faltando a configuração `script_location`**, que é essencial para o Alembic saber onde ficam os scripts de migração.

2. O comando usado estava **incorreto para este projeto**.

## O Que Foi Corrigido

✅ Adicionada a linha `script_location = %(here)s` no arquivo `backend/migrations/alembic.ini`

## Como Usar Migrações Corretamente Neste Projeto

Este projeto usa **Flask-Migrate**, não Alembic puro. Portanto, use os comandos do Flask, não do Alembic diretamente.

### Comandos Corretos

#### 1. Aplicar Migrações ao Banco de Dados

**❌ ERRADO:**
```bash
python -m alembic upgrade head
```

**✅ CORRETO:**
```bash
cd backend
set FLASK_APP=run.py
flask db upgrade
```

Ou em uma linha só:
```bash
cd backend && set FLASK_APP=run.py && flask db upgrade
```

#### 2. Criar uma Nova Migração

```bash
cd backend
set FLASK_APP=run.py
flask db migrate -m "descrição da migração"
```

#### 3. Ver o Estado Atual das Migrações

```bash
cd backend
set FLASK_APP=run.py
flask db current
```

#### 4. Ver o Histórico de Migrações

```bash
cd backend
set FLASK_APP=run.py
flask db history
```

#### 5. Reverter a Última Migração

```bash
cd backend
set FLASK_APP=run.py
flask db downgrade
```

## Script Automatizado

Para facilitar, você pode criar um arquivo `backend/migrate.bat`:

```batch
@echo off
cd /d %~dp0
set FLASK_APP=run.py

if "%1"=="upgrade" (
    echo Aplicando migrações...
    flask db upgrade
) else if "%1"=="migrate" (
    echo Criando migração: %2
    flask db migrate -m "%2"
) else if "%1"=="current" (
    echo Estado atual:
    flask db current
) else if "%1"=="history" (
    echo Histórico de migrações:
    flask db history
) else if "%1"=="downgrade" (
    echo Revertendo migração...
    flask db downgrade
) else (
    echo Uso:
    echo   migrate.bat upgrade         - Aplica todas as migrações pendentes
    echo   migrate.bat migrate "desc"  - Cria uma nova migração
    echo   migrate.bat current         - Mostra o estado atual
    echo   migrate.bat history         - Mostra o histórico
    echo   migrate.bat downgrade       - Reverte a última migração
)

cd ..
```

Uso:
```bash
backend\migrate.bat upgrade
backend\migrate.bat migrate "adicionar tabela lixeira"
```

## Por Que o Erro Travou o Cursor?

O erro do Alembic **não trava o Cursor**. O que provavelmente aconteceu foi:

1. O comando falhou e gerou muito output de erro
2. Isso pode ter causado lentidão temporária
3. Ou você pode ter tido um problema de rede não relacionado ao mesmo tempo

**Solução:** Agora que o `alembic.ini` está corrigido e você sabe os comandos corretos, não terá mais esse problema.

## Resumo

- ✅ Arquivo `alembic.ini` corrigido
- ✅ Use comandos `flask db` ao invés de `alembic` direto
- ✅ Sempre execute os comandos da pasta `backend/`
- ✅ Defina `FLASK_APP=run.py` antes de executar comandos Flask

## Para o Seu Sistema de Lixeira

Quando você criar a migração para a tabela de lixeira, use:

```bash
cd backend
set FLASK_APP=run.py
flask db migrate -m "criar tabela lixeira"
flask db upgrade
```

Vejo que você já tem o arquivo `backend/migrations/versions/criar_tabela_lixeira.py` criado. Para aplicá-lo:

```bash
cd backend
set FLASK_APP=run.py
flask db upgrade
```

✨ **Problema resolvido!**

