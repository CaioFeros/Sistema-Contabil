# 📚 Documentação do Sistema Contábil

## Índice Geral

### 📖 Documentação do Usuário

1. **[INSTRUCOES_USUARIO.md](INSTRUCOES_USUARIO.md)** - Guia completo para usuários finais
2. **[COMO_USAR_DIARIAMENTE.md](COMO_USAR_DIARIAMENTE.md)** - Rotina diária do sistema
3. **[IMPORTACAO_CSV_GUIA.md](IMPORTACAO_CSV_GUIA.md)** - Como importar arquivos CSV

---

### 🔐 Autenticação e Segurança

4. **[AUTENTICACAO.md](AUTENTICACAO.md)** - Sistema de autenticação com username
   - Credenciais padrão
   - Como criar usuários
   - Gerenciamento de permissões
   - Solução de problemas

---

### 🛠️ Funcionalidades Administrativas

5. **[HISTORICO_ATIVIDADES.md](HISTORICO_ATIVIDADES.md)** - Histórico de atividades
   - Visualizar cadastros e importações
   - Desfazer operações
   - Filtros e busca

---

### 🔧 Correções e Melhorias

6. **[CORRECOES_FINAIS.md](CORRECOES_FINAIS.md)** - Últimas correções aplicadas
7. **[CORRECAO_JWT_CRITICO.md](CORRECAO_JWT_CRITICO.md)** - Correção crítica do JWT
8. **[CORRECAO_AUTENTICACAO_TOKEN.md](CORRECAO_AUTENTICACAO_TOKEN.md)** - Fix de token localStorage
9. **[MELHORIAS_UX_ADMIN.md](MELHORIAS_UX_ADMIN.md)** - Melhorias de interface
10. **[LOGS_COMPLETOS_ATIVIDADES.md](LOGS_COMPLETOS_ATIVIDADES.md)** - Sistema completo de logs

---

### 📝 Correções Específicas (Histórico)

11. **[CORRECAO_ALIQUOTA_HISTORICO.md](CORRECAO_ALIQUOTA_HISTORICO.md)** - Correção de alíquota
12. **[CORRECAO_IMPORTACAO_MULTIPLOS_CSV.md](CORRECAO_IMPORTACAO_MULTIPLOS_CSV.md)** - Importação múltipla
13. **[CORRECAO_MODAL_MULTIPLOS_CLIENTES.md](CORRECAO_MODAL_MULTIPLOS_CLIENTES.md)** - Modal de clientes
14. **[RESUMO_CORRECAO.md](RESUMO_CORRECAO.md)** - Resumo geral de correções

---

### 📋 Changelog

15. **[CHANGELOG.md](CHANGELOG.md)** - Histórico de versões e mudanças

---

## 🚀 Início Rápido

### Para Usar o Sistema

```bash
# Iniciar o sistema
python iniciar_sistema.py

# Ou no Windows
iniciar_sistema.bat
```

**Acesso padrão:**
- URL: http://localhost:5000
- Username: `admin`
- Senha: `admin123`

---

## 🎯 Funcionalidades Principais

### Para Todos os Usuários

- ✅ **Gerenciar Clientes** - Cadastro via CNPJ ou manual
- ✅ **Processar Faturamento** - Importação de CSVs
- ✅ **Gerar Relatórios** - Relatórios mensais e anuais em PDF

### Para Administradores

- 🛡️ **Gerenciar Usuários** - Criar, ativar/desativar, excluir
- 📊 **Histórico de Logs** - Auditoria completa do sistema
- 🕐 **Histórico de Atividades** - Visualizar e desfazer operações

---

## 📂 Estrutura do Projeto

```
Sistema-Contabil/
├── backend/              # Backend Flask
│   ├── app/              # Aplicação principal
│   │   ├── models.py     # Modelos do banco de dados
│   │   ├── routes.py     # Rotas da API
│   │   ├── auth.py       # Autenticação JWT
│   │   ├── audit.py      # Sistema de auditoria
│   │   ├── logs.py       # API de logs
│   │   ├── atividades.py # API de atividades
│   │   └── services.py   # Lógica de negócios
│   ├── migrations/       # Migrações do banco
│   ├── seed.py           # Dados iniciais
│   └── run.py            # Ponto de entrada
│
├── frontend/             # Frontend React
│   ├── src/
│   │   ├── pages/        # Páginas
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── services/     # Chamadas de API
│   │   ├── hooks/        # React hooks
│   │   └── context/      # Contextos (Auth, Theme)
│   └── package.json
│
├── docs/                 # Documentação
├── iniciar_sistema.py    # Script de inicialização
└── build_frontend.py     # Script de build
```

---

## 🔍 Busca Rápida

### Precisa de ajuda com...

**Autenticação?** → [AUTENTICACAO.md](AUTENTICACAO.md)

**Importar CSV?** → [IMPORTACAO_CSV_GUIA.md](IMPORTACAO_CSV_GUIA.md)

**Desfazer operação?** → [HISTORICO_ATIVIDADES.md](HISTORICO_ATIVIDADES.md)

**Erro no sistema?** → [CORRECOES_FINAIS.md](CORRECOES_FINAIS.md)

**Usar diariamente?** → [COMO_USAR_DIARIAMENTE.md](COMO_USAR_DIARIAMENTE.md)

---

## 🆘 Suporte

### Problemas Comuns

1. **Não consigo fazer login**
   - Verifique username e senha
   - Credencial padrão: `admin` / `admin123`
   - Veja: [AUTENTICACAO.md](AUTENTICACAO.md)

2. **Erro ao importar CSV**
   - Verifique formato do arquivo
   - Veja: [IMPORTACAO_CSV_GUIA.md](IMPORTACAO_CSV_GUIA.md)

3. **Erro 401 em requisições**
   - Token expirado (1 hora)
   - Faça logout e login novamente
   - Veja: [CORRECAO_JWT_CRITICO.md](CORRECAO_JWT_CRITICO.md)

---

## 📊 Tecnologias Utilizadas

### Backend
- Python 3.11+
- Flask (Web framework)
- SQLAlchemy (ORM)
- Flask-Migrate (Migrações)
- PyJWT (Autenticação)
- Pandas (Processamento de dados)

### Frontend
- React 18
- React Router
- Axios
- Tailwind CSS
- Lucide React (Ícones)
- Recharts (Gráficos)

### Banco de Dados
- SQLite (Desenvolvimento/Portátil)
- PostgreSQL (Produção - opcional)

---

## 📅 Última Atualização
15 de Outubro de 2025

## 📝 Versão
2.0.0 - Sistema completo com autenticação e auditoria
