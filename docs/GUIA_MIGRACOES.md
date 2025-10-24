# Guia de Migrações do Banco de Dados

## ⚠️ IMPORTANTE: Use Flask-Migrate, NÃO o Alembic Direto

Este sistema usa **Flask-Migrate**, que é um wrapper do Alembic integrado com o Flask. 

### ❌ NÃO FAÇA ISSO:
```bash
cd D:\Dev\Sistema-Contabil\backend
.\venv\Scripts\alembic.exe upgrade head
```

**Por que não funciona?**
- O Alembic direto não tem o contexto do Flask
- O arquivo `env.py` depende de `current_app` do Flask
- Resultado: `No 'script_location' key found in configuration`

### ✅ FAÇA ISSO:

#### Opção 1: Usar o script migrate.bat (RECOMENDADO)
```bash
cd D:\Dev\Sistema-Contabil\backend
.\migrate.bat upgrade
```

#### Opção 2: Usar Flask-Migrate diretamente
```bash
cd D:\Dev\Sistema-Contabil\backend
.\venv\Scripts\flask.exe db upgrade
```

## Comandos Disponíveis

### Aplicar migrações pendentes
```bash
.\migrate.bat upgrade
```

### Criar nova migração
```bash
.\migrate.bat migrate "descrição da mudança"
```

### Ver estado atual
```bash
.\migrate.bat current
```

### Ver histórico completo
```bash
.\migrate.bat history
```

### Reverter última migração
```bash
.\migrate.bat downgrade
```

### Marcar banco em uma versão específica (sem executar SQL)
```bash
.\migrate.bat stamp head
```

## Solução de Problemas

### Múltiplos heads detectados
Se você ver o erro `Multiple head revisions are present`:

1. Verifique os heads:
```bash
.\migrate.bat history
```

2. Crie uma migração de merge:
```bash
.\venv\Scripts\flask.exe db merge -m "Mesclar branches" head1 head2 head3
```

3. Aplique a migração:
```bash
.\migrate.bat upgrade
```

### Coluna já existe (duplicate column)
Se uma migração tentar adicionar uma coluna que já existe:

```bash
.\venv\Scripts\flask.exe db stamp revision_id
```

Isso marca a migração como aplicada sem executar o SQL.

## Estrutura dos Arquivos

```
backend/
├── migrations/
│   ├── alembic.ini          # Configuração do Alembic
│   ├── env.py               # Script de ambiente (usa Flask context)
│   └── versions/            # Arquivos de migração
│       └── xxxxxx_descricao.py
└── migrate.bat              # Script helper
```

## Desenvolvimento

Ao criar novas migrações:

1. Modifique os models em `backend/app/models.py`
2. Crie a migração:
   ```bash
   .\migrate.bat migrate "descrição clara da mudança"
   ```
3. Revise o arquivo gerado em `migrations/versions/`
4. Aplique a migração:
   ```bash
   .\migrate.bat upgrade
   ```

## SQLite e Batch Mode

Para alterações de schema complexas em SQLite (como alterar constraints), use batch mode:

```python
def upgrade():
    with op.batch_alter_table('tabela') as batch_op:
        batch_op.add_column(...)
        batch_op.alter_column(...)
        batch_op.create_unique_constraint(...)
```

Isso evita erros como: `No support for ALTER of constraints in SQLite dialect`.

