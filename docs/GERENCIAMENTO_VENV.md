# Guia Completo de Gerenciamento do Ambiente Virtual

## 🎯 Objetivo

Este documento explica como gerenciar o ambiente virtual Python do sistema de forma robusta, evitando problemas recorrentes de dependências quebradas.

---

## 🔧 Nova Ferramenta: `gerenciar_venv.bat`

Foi criado um script dedicado para gerenciar o ambiente virtual de forma profissional e confiável.

### Localização
```
D:\Dev\Sistema-Contabil\gerenciar_venv.bat
```

### Como Usar

#### Modo Interativo (Recomendado para Iniciantes)
```bash
gerenciar_venv.bat
```
Mostra um menu com todas as opções disponíveis.

#### Modo de Linha de Comando
```bash
gerenciar_venv.bat [comando]
```

---

## 📋 Comandos Disponíveis

### 1. Criar Ambiente Virtual
```bash
gerenciar_venv.bat criar
```

**O que faz:**
- Cria um ambiente virtual Python isolado em `backend/venv/`
- Atualiza o pip para a versão mais recente
- Instala todas as dependências do `requirements.txt`

**Quando usar:**
- Primeira instalação do sistema
- Após deletar o venv por engano
- Quando o ambiente está completamente corrompido

---

### 2. Verificar Integridade
```bash
gerenciar_venv.bat verificar
```

**O que faz:**
- Verifica se o diretório venv existe
- Testa se Python e pip estão funcionais
- Valida se as dependências críticas estão instaladas:
  - Flask
  - Flask-SQLAlchemy
  - Flask-Migrate
  - PyJWT

**Quando usar:**
- Após mudanças no sistema
- Antes de iniciar desenvolvimento
- Para diagnosticar problemas
- Periodicamente como manutenção preventiva

**Saída Esperada (ambiente OK):**
```
✅ Diretório do venv existe
✅ Python encontrado no venv
✅ Pip encontrado no venv
✅ Flask instalado
✅ Flask-SQLAlchemy instalado
✅ Flask-Migrate instalado
✅ PyJWT instalado
============================================================
✅ AMBIENTE VIRTUAL OK - TUDO FUNCIONANDO!
============================================================
```

---

### 3. Reparar Ambiente
```bash
gerenciar_venv.bat reparar
```

**O que faz:**
- Mantém o venv existente
- Atualiza o pip
- Reinstala TODAS as dependências (força reinstalação)

**Quando usar:**
- Após atualizar `requirements.txt`
- Quando algumas dependências estão faltando
- Após erros de importação (`ModuleNotFoundError`)
- Quando `verificar` aponta problemas

**Vantagem:** Mais rápido que recriar do zero

---

### 4. Limpar Cache
```bash
gerenciar_venv.bat limpar
```

**O que faz:**
- Limpa o cache do pip
- Remove pacotes baixados anteriormente

**Quando usar:**
- Problemas de instalação persistentes
- Antes de reparar/reinstalar (opcional)
- Para liberar espaço em disco

---

### 5. Reinstalar Completamente
```bash
gerenciar_venv.bat reinstalar
```

**O que faz:**
- **DELETA** completamente o venv existente
- Cria um novo venv do zero
- Instala todas as dependências

**Quando usar:**
- Ambiente severamente corrompido
- Após grandes mudanças de versão do Python
- Como último recurso

⚠️ **ATENÇÃO:** Operação destrutiva! Requer confirmação.

---

### 6. Atualizar Dependências
```bash
gerenciar_venv.bat atualizar
```

**O que faz:**
- Atualiza pip para versão mais recente
- Atualiza todas as dependências para versões compatíveis mais recentes

**Quando usar:**
- Para obter correções de segurança
- Para melhorias de performance
- Desenvolvimento e testes

⚠️ **ATENÇÃO:** Pode causar incompatibilidades. Teste após atualizar!

---

## 🔄 Fluxo de Trabalho Recomendado

### Instalação Inicial
```bash
# 1. Clonar o repositório
git clone <url>
cd Sistema-Contabil

# 2. Rodar instalação completa (já inclui criação do venv)
INSTALACAO.bat
```

### Após Clonar o Repositório (sem venv)
```bash
gerenciar_venv.bat criar
```

### Após Pull com Mudanças em requirements.txt
```bash
gerenciar_venv.bat reparar
```

### Quando Aparecer "ModuleNotFoundError"
```bash
# 1. Primeiro, tente reparar
gerenciar_venv.bat reparar

# 2. Se não resolver, verifique
gerenciar_venv.bat verificar

# 3. Se ainda não resolver, reinstale
gerenciar_venv.bat reinstalar
```

### Manutenção Preventiva Semanal
```bash
gerenciar_venv.bat verificar
```

---

## 🛡️ Proteções Automáticas

Os scripts do sistema agora verificam automaticamente o venv:

### `iniciar_sistema.bat`
- ✅ Verifica se venv existe
- ✅ Valida se Python está no venv
- ✅ Testa se Flask está instalado
- ❌ Bloqueia inicialização se houver problemas

### `backend/migrate.bat`
- ✅ Verifica se venv existe
- ✅ Valida Flask-Migrate instalado
- ❌ Bloqueia migrações se houver problemas

### `INSTALACAO.bat`
- ✅ Cria venv automaticamente antes de tudo
- ✅ Garante ambiente limpo para instalação

---

## 🔍 Diagnóstico de Problemas Comuns

### Problema: "Python não encontrado"
```
❌ ERRO: Python não encontrado no PATH!
```

**Solução:**
1. Instale Python 3.8+ de https://www.python.org/downloads/
2. **IMPORTANTE:** Marque "Add Python to PATH" durante instalação
3. Reinicie o terminal/cmd
4. Execute `gerenciar_venv.bat criar`

---

### Problema: "ModuleNotFoundError: No module named 'flask'"
```
ModuleNotFoundError: No module named 'flask'
```

**Solução:**
```bash
gerenciar_venv.bat reparar
```

Se não resolver:
```bash
gerenciar_venv.bat reinstalar
```

---

### Problema: "Ambiente virtual não encontrado"
```
⚠️  Ambiente virtual não encontrado ou corrompido!
```

**Solução:**
```bash
gerenciar_venv.bat criar
```

---

### Problema: Venv existe mas não funciona
```
✅ Diretório do venv existe
❌ Python não encontrado no venv!
```

**Solução:**
```bash
gerenciar_venv.bat reinstalar
```

---

### Problema: Algumas dependências faltando
```
✅ Flask instalado
❌ Flask-SQLAlchemy não instalado!
```

**Solução:**
```bash
gerenciar_venv.bat reparar
```

---

## 📂 Estrutura do Venv

```
backend/
└── venv/
    ├── Include/           # Headers C/C++
    ├── Lib/               # Bibliotecas Python
    │   └── site-packages/ # Dependências instaladas
    ├── Scripts/           # Executáveis (Windows)
    │   ├── python.exe     # Python isolado
    │   ├── pip.exe        # Gerenciador de pacotes
    │   ├── flask.exe      # CLI do Flask
    │   ├── alembic.exe    # CLI do Alembic (NÃO usar direto!)
    │   └── activate.bat   # Script de ativação
    └── pyvenv.cfg         # Configuração do venv
```

---

## ⚙️ Ativação Manual do Venv (Avançado)

Se você precisar ativar manualmente:

```bash
cd D:\Dev\Sistema-Contabil\backend
venv\Scripts\activate.bat
```

Para desativar:
```bash
deactivate
```

**Quando usar ativação manual:**
- Desenvolvimento e testes
- Instalar pacotes adicionais
- Executar scripts Python personalizados
- Debug avançado

**NÃO é necessário ativar manualmente para:**
- Iniciar o sistema (`iniciar_sistema.bat`)
- Rodar migrações (`migrate.bat`)
- Instalação (`INSTALACAO.bat`)

---

## 🎓 Melhores Práticas

### ✅ FAÇA:
- Use `gerenciar_venv.bat` para todas as operações
- Execute `verificar` regularmente
- Execute `reparar` após mudanças em requirements.txt
- Mantenha o venv no `.gitignore`
- Documente mudanças em requirements.txt

### ❌ NÃO FAÇA:
- Não use `pip install` fora do venv
- Não delete o venv sem motivo
- Não commite o diretório venv/ no git
- Não instale pacotes globalmente
- Não use `alembic` diretamente (use `flask db` via `migrate.bat`)

---

## 📊 Checklist de Saúde do Ambiente

Execute este checklist periodicamente:

```bash
# 1. Verificar integridade
gerenciar_venv.bat verificar

# 2. Verificar versão do Python
cd backend
venv\Scripts\python.exe --version

# 3. Listar pacotes instalados
venv\Scripts\pip.exe list

# 4. Verificar pacotes desatualizados
venv\Scripts\pip.exe list --outdated

# 5. Testar importações críticas
venv\Scripts\python.exe -c "import flask, flask_sqlalchemy, flask_migrate, jwt"
```

Se todos passarem: ✅ **Ambiente Saudável!**

---

## 🆘 Suporte

Se os problemas persistirem após seguir este guia:

1. Execute `gerenciar_venv.bat verificar` e copie a saída
2. Verifique os arquivos de log do sistema
3. Consulte `backend/GUIA_MIGRACOES.md` para problemas de banco de dados
4. Verifique se há processos Python travados (Task Manager)

---

## 📚 Referências

- [Python venv Documentation](https://docs.python.org/3/library/venv.html)
- [pip User Guide](https://pip.pypa.io/en/stable/user_guide/)
- [Flask Installation](https://flask.palletsprojects.com/en/latest/installation/)
- [Guia de Migrações](./backend/GUIA_MIGRACOES.md)

---

## 📝 Changelog

- **2025-10-18**: Criação do `gerenciar_venv.bat` e documentação completa
- **2025-10-18**: Integração com `INSTALACAO.bat` e `iniciar_sistema.bat`
- **2025-10-18**: Adição de verificações automáticas no `migrate.bat`

