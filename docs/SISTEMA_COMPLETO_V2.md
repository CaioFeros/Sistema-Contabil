# 🎯 Sistema Contábil v2.0 - Documentação Completa

## Resumo Executivo

Sistema completo de gestão contábil com autenticação robusta, auditoria completa e controle de atividades.

---

## 🚀 Como Iniciar

### Primeira Vez

```bash
# 1. Configure o ambiente inicial
python setup_inicial.py

# 2. Faça o build do frontend
python build_frontend.py

# 3. Inicie o sistema
python iniciar_sistema.py
```

### Uso Diário

```bash
# Simplesmente execute
python iniciar_sistema.py

# Ou no Windows
iniciar_sistema.bat
```

**Acesso:** http://localhost:5000
**Login:** `admin` / `admin123`

---

## 🎨 Funcionalidades Principais

### Para Todos os Usuários

#### 1. Gerenciar Clientes
- ✅ Cadastro manual
- ✅ Busca automática por CNPJ (API Receita Federal)
- ✅ Visualização completa de dados
- ✅ Edição e exclusão

#### 2. Processar Faturamento
- ✅ Importação de múltiplos CSVs
- ✅ Preview antes de consolidar
- ✅ Substituição de competências existentes
- ✅ Cálculo automático de impostos

#### 3. Gerar Relatórios
- ✅ Relatórios mensais
- ✅ Relatórios anuais
- ✅ Exportação em PDF
- ✅ Gráficos e estatísticas

---

### Para Administradores 🛡️

#### 4. Gerenciar Usuários
- ✅ Criar novos usuários
- ✅ Definir papéis (USER/ADMIN)
- ✅ Ativar/desativar contas
- ✅ Excluir usuários
- ✅ Visualizar último login

#### 5. Histórico de Logs
- ✅ Auditoria completa do sistema
- ✅ Todos os logins registrados
- ✅ Todas as ações registradas
- ✅ Filtros avançados
- ✅ Estatísticas de uso

#### 6. Histórico de Atividades ✨
- ✅ Visualizar cadastros de clientes
- ✅ Visualizar importações de faturamento
- ✅ **Desfazer operações**
- ✅ Rastreabilidade total
- ✅ Filtros por tipo e usuário

---

## 🔐 Sistema de Autenticação

### Características

- 🔒 **JWT (JSON Web Tokens)** com expiração de 1 hora
- 🔒 **Senhas hash** com pbkdf2:sha256
- 🔒 **Username único** para cada usuário
- 🔒 **Controle de acesso** por papel (ADMIN/USER)
- 🔒 **Logs de login** (sucesso e falha)
- 🔒 **Validação específica** (username não cadastrado / senha incorreta)
- 🔒 **Toggle de senha** (mostrar/esconder)

### Usuário Padrão

```
Username: admin
Senha: admin123
Papel: ADMIN
```

**⚠️ IMPORTANTE**: Altere a senha padrão após a instalação!

---

## 📊 Sistema de Auditoria

### O que é Registrado

Todas as ações são registradas com:
- 👤 Quem executou (usuário)
- 📅 Quando (data e hora)
- 🎯 O que fez (ação)
- 📝 Em qual entidade (CLIENTE, USUARIO, FATURAMENTO)
- 💾 Detalhes da operação (JSON)
- 🌐 IP do usuário

### Tipos de Logs

| Ação | Descrição | Exemplo |
|------|-----------|---------|
| LOGIN | Tentativas de login | Sucesso / Senha incorreta |
| CREATE | Criações | Cliente, Usuário, Faturamento |
| UPDATE | Atualizações | Dados de cliente |
| DELETE | Exclusões | Cliente, Faturamento |

---

## 🕐 Histórico de Atividades

### Funcionalidade Exclusiva

**Diferença entre Logs e Atividades:**

| Histórico de Logs | Histórico de Atividades |
|-------------------|-------------------------|
| **Tudo** | Apenas CLIENTE e FATURAMENTO |
| Apenas visualização | **Pode desfazer** ✨ |
| Auditoria técnica | Gestão operacional |

### Operações que Podem ser Desfeitas

#### ✅ Cadastro de Cliente
- Condição: Cliente sem faturamentos
- Ação: Remove o cliente do sistema
- Log: Registra exclusão como "Desfeita operação"

#### ✅ Importação de Faturamento
- Condição: Qualquer importação
- Ação: Remove o processamento e detalhes
- Log: Registra exclusão como "Desfeita operação"

#### ❌ Exclusões NÃO podem ser desfeitas
- Operações de DELETE são irreversíveis

---

## 📝 Exemplo de Fluxo Completo

### Cenário: Empresa com 18 Competências

#### 1. Cadastro e Importação

**Usuário Caio:**
1. Cadastra "Farmácia ABC LTDA"
2. Importa 18 competências (11/2023 a 04/2025)

**Histórico de Atividades:**
```
[17:38:21] Caio cadastrou cliente: Farmácia ABC LTDA        [Desfazer]
[17:38:29] Caio importou competência 11/2023 da empresa...  [Desfazer]
[17:38:29] Caio importou competência 12/2023 da empresa...  [Desfazer]
...
[17:38:29] Caio importou competência 04/2025 da empresa...  [Desfazer]
```

Total: 19 registros

---

#### 2. Exclusão do Cliente

**Admin:**
1. Exclui a empresa (por engano)

**Histórico de Atividades:**
```
[17:40:00] Admin excluiu competência 04/2025 da empresa...
[17:40:00] Admin excluiu competência 03/2025 da empresa...
...
[17:40:00] Admin excluiu competência 11/2023 da empresa...
[17:40:00] Admin excluiu cliente: Farmácia ABC LTDA
```

Total: 19 registros de exclusão

---

#### 3. Recadastro

**Usuário Caio:**
1. Cadastra novamente "Farmácia ABC LTDA"
2. Reimporta as 18 competências

**Histórico de Atividades:**
```
[17:45:00] Caio cadastrou cliente: Farmácia ABC LTDA        [Desfazer]
[17:45:10] Caio importou competência 11/2023 da empresa...  [Desfazer]
...
[17:45:10] Caio importou competência 04/2025 da empresa...  [Desfazer]
```

Total: 19 novos registros

---

#### 4. Correção de Erro

**Admin percebe que competência 03/2025 foi importada errada:**
1. Vai em "Histórico de Atividades"
2. Encontra: "Importou competência 03/2025..."
3. Clica em **[Desfazer]**
4. Confirma a ação
5. ✅ Competência removida!

**Novo registro aparece:**
```
[17:50:00] Admin excluiu competência 03/2025 da empresa...
            (Motivo: Desfeita operação de importação)
```

---

## 🔒 Níveis de Acesso

### USER (Usuário Comum)

**Pode:**
- ✅ Gerenciar clientes
- ✅ Processar faturamento
- ✅ Gerar relatórios

**Não pode:**
- ❌ Criar outros usuários
- ❌ Ver histórico de logs
- ❌ Ver histórico de atividades
- ❌ Desfazer operações

---

### ADMIN (Administrador)

**Pode:**
- ✅ **Tudo que USER pode**
- ✅ Criar/editar/excluir usuários
- ✅ Ver histórico completo de logs
- ✅ Ver histórico de atividades
- ✅ **Desfazer operações de outros usuários**
- ✅ Acessar estatísticas do sistema

---

## 🗂️ Estrutura do Banco de Dados

### Tabelas Principais

1. **usuario** - Usuários do sistema
2. **cliente** - Clientes/empresas
3. **processamento** - Faturamentos por competência
4. **faturamento_detalhe** - Notas fiscais individuais
5. **log_auditoria** - Logs de todas as ações

### Relacionamentos

```
Usuario (1) ─────> (N) LogAuditoria
                    ↓
Cliente (1) ─────> (N) Processamento
                    ↓
Processamento (1) > (N) FaturamentoDetalhe
```

---

## 🛠️ Manutenção

### Backup do Banco

```bash
# Windows
backup_banco.bat

# Manual
copy backend\sistema_contabil.db backup_YYYYMMDD.db
```

### Parar o Sistema

```bash
# Windows
parar_sistema.bat

# Ou pressione Ctrl+C no terminal
```

---

## 📈 Melhorias Implementadas (v2.0)

### Autenticação
- ✅ Sistema completo de JWT
- ✅ Username ao invés de email
- ✅ Validações específicas de erro
- ✅ Toggle de visualização de senha
- ✅ Mensagens de erro claras

### Auditoria
- ✅ Todos os logins registrados
- ✅ Todas as criações registradas
- ✅ Todas as exclusões registradas
- ✅ IP e timestamp de cada ação

### Controle de Atividades
- ✅ Visualização de operações importantes
- ✅ Desfazer cadastros e importações
- ✅ Filtros avançados
- ✅ Paginação

### Interface
- ✅ Dark mode completo
- ✅ Responsivo (mobile/tablet/desktop)
- ✅ Botões de navegação
- ✅ Feedback visual claro
- ✅ Ícones intuitivos

---

## 🔧 Arquivos de Configuração

### backend/.env
```env
DATABASE_URL=sqlite:///sistema_contabil.db
JWT_SECRET_KEY=sua-chave-secreta-aqui
FRONTEND_URL=http://localhost:5000
FLASK_DEBUG=0
```

**⚠️ IMPORTANTE**: 
- Gere uma chave JWT forte: `python -c "import secrets; print(secrets.token_hex(32))"`
- Nunca compartilhe o arquivo `.env`
- Mantenha `FLASK_DEBUG=0` em produção

---

## 📦 Dependências

### Backend (requirements.txt)
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-CORS
- PyJWT
- Werkzeug
- Pandas
- Requests

### Frontend (package.json)
- React
- React Router
- Axios
- Tailwind CSS
- Lucide React
- Recharts

---

## 🐛 Troubleshooting

### Problema: Erro 401 em todas as requisições

**Causa**: Token inválido ou expirado

**Solução:**
1. Faça logout
2. Limpe o localStorage: `localStorage.clear()`
3. Faça login novamente

---

### Problema: "Username não cadastrado"

**Causa**: Username digitado não existe

**Solução:**
- Verifique se digitou corretamente (case-sensitive)
- Use `admin` para primeiro acesso

---

### Problema: Não pode excluir cliente

**Erro**: "Cliente possui X faturamento(s)"

**Solução:**
1. Acesse "Histórico de Atividades"
2. Desfaça cada importação de faturamento
3. Depois exclua o cliente

---

### Problema: Frontend não atualiza

**Solução:**
1. Faça rebuild: `python build_frontend.py`
2. Recarregue com cache limpo: `Ctrl + Shift + R`

---

## 📊 Estatísticas do Sistema

### Arquivos do Projeto

- **Backend**: 9 arquivos Python (app/)
- **Frontend**: 22 componentes/páginas
- **Documentação**: 15 arquivos .md
- **Migrações**: 4 versões do banco

### Linhas de Código (aproximado)

- Backend: ~2,500 linhas
- Frontend: ~4,000 linhas
- Total: ~6,500 linhas

---

## 🎯 Boas Práticas

### Segurança

1. ✅ Altere a senha do admin após instalação
2. ✅ Use senhas fortes para novos usuários
3. ✅ Revise logs regularmente
4. ✅ Desative usuários inativos
5. ✅ Faça backup do banco periodicamente

### Operacional

1. ✅ Cadastre clientes antes de importar faturamentos
2. ✅ Verifique preview antes de consolidar CSVs
3. ✅ Use filtros no histórico para encontrar operações
4. ✅ Desfaça operações erradas imediatamente
5. ✅ Exporte relatórios em PDF para registro

### Desenvolvimento

1. ✅ Use `FLASK_DEBUG=0` em produção
2. ✅ Não commite arquivos `.env`
3. ✅ Faça backup antes de atualizações
4. ✅ Teste em ambiente local antes de produção

---

## 📚 Documentação Disponível

### Guias de Usuário
- `INSTRUCOES_USUARIO.md` - Manual completo
- `COMO_USAR_DIARIAMENTE.md` - Rotina diária
- `IMPORTACAO_CSV_GUIA.md` - Como importar CSVs

### Documentação Técnica
- `AUTENTICACAO.md` - Sistema de login e segurança
- `HISTORICO_ATIVIDADES.md` - Desfazer operações

### Correções e Melhorias
- `CORRECOES_FINAIS.md` - Últimas correções
- `CORRECAO_JWT_CRITICO.md` - Fix crítico de JWT
- `MELHORIAS_UX_ADMIN.md` - Melhorias de interface

### Histórico
- `CHANGELOG.md` - Todas as versões e mudanças

---

## 🌟 Destaques da v2.0

### Antes (v1.x)
- ❌ Sem autenticação real
- ❌ Qualquer pessoa podia acessar
- ❌ Sem controle de usuários
- ❌ Sem auditoria
- ❌ Erros difíceis de desfazer

### Agora (v2.0)
- ✅ Autenticação robusta com JWT
- ✅ Controle de acesso por papel
- ✅ Sistema completo de usuários
- ✅ Auditoria de todas as ações
- ✅ **Pode desfazer operações** ✨
- ✅ Interface profissional
- ✅ Mensagens de erro claras

---

## 🔄 Fluxo de Trabalho Ideal

### Dia a Dia

```
1. Login no sistema
   ↓
2. Verificar se há novos clientes para cadastrar
   ↓
3. Importar CSVs de faturamento do mês
   ↓
4. Gerar relatórios para os clientes
   ↓
5. Exportar em PDF e enviar
```

### Administrativo (Semanal/Mensal)

```
1. Revisar "Histórico de Atividades"
   ↓
2. Verificar se há operações suspeitas
   ↓
3. Desfazer cadastros duplicados
   ↓
4. Verificar "Histórico de Logs" para auditoria
   ↓
5. Criar/desativar usuários conforme necessário
```

---

## 💡 Dicas e Truques

### Importação Eficiente
- Agrupe CSVs do mesmo cliente
- Use a importação múltipla
- Sempre confira o preview

### Gestão de Erros
- Se importou errado, use "Desfazer"
- Se cadastrou duplicado, use "Desfazer"
- Não exclua manualmente, use o histórico

### Organização
- Use filtros para encontrar rapidamente
- Exporte relatórios periodicamente
- Mantenha apenas clientes ativos

---

## 🆘 Suporte Rápido

### Problema Comum #1: Não consigo fazer login
**Solução**: Use `admin` / `admin123` ou peça ao administrador para criar seu usuário

### Problema Comum #2: Erro ao importar CSV
**Solução**: Verifique se o cliente existe e se o CSV está no formato correto

### Problema Comum #3: Quero desfazer uma importação
**Solução**: Vá em "Histórico de Atividades" e clique em "Desfazer"

### Problema Comum #4: Importei competência duplicada
**Solução**: O sistema detecta e pergunta se quer substituir

### Problema Comum #5: Token expirado
**Solução**: Faça logout (ou limpe localStorage) e login novamente

---

## 📞 Informações Técnicas

### Requisitos do Sistema

**Software:**
- Python 3.11+
- Node.js 16+ (para build do frontend)

**Hardware:**
- RAM: Mínimo 2GB
- Disco: Mínimo 500MB
- Processador: Dual-core ou superior

**Sistema Operacional:**
- Windows 10/11
- Linux (Ubuntu 20.04+)
- macOS 10.15+

---

### Portas Utilizadas

- **5000**: Backend Flask
- **5432**: PostgreSQL (se usado ao invés de SQLite)

---

## 📅 Roadmap Futuro

### Funcionalidades Planejadas

- [ ] Exportação de histórico para Excel
- [ ] Notificações por email
- [ ] Backup automático agendado
- [ ] API para integrações externas
- [ ] Dashboard com gráficos avançados
- [ ] Relatórios customizáveis
- [ ] Multi-tenant (múltiplas empresas)

---

## 📄 Licença

Sistema desenvolvido para uso interno.

---

## 👥 Créditos

Desenvolvido com assistência de IA (Cursor + Claude).

---

## 📞 Contato

Para suporte técnico, consulte a documentação ou entre em contato com o administrador do sistema.

---

**Última atualização**: 15 de Outubro de 2025
**Versão**: 2.0.0
**Status**: ✅ Produção
