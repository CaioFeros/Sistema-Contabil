# 🔐 Sistema de Autenticação

## Credenciais de Acesso

### Usuário Admin Padrão
- **Username**: `admin`
- **Senha**: `admin123`
- **Papel**: ADMIN (acesso completo ao sistema)

---

## Como Fazer Login

1. Acesse http://localhost:5000
2. Digite o **username** (não é email)
3. Digite a **senha**
   - 👁️ Clique no ícone de **olho** para mostrar/esconder a senha
   - 👁️‍🗨️ Ícone de **olho aberto**: senha visível
   - 🔒 Ícone de **olho fechado**: senha oculta
4. Clique em "Entrar"

### Mensagens de Erro

O sistema agora exibe mensagens de erro claras e específicas:

- ✅ **"Username e senha são obrigatórios"** - Preencha ambos os campos
- ✅ **"Username não cadastrado"** - O username digitado não existe no sistema
- ✅ **"Senha incorreta"** - A senha está errada
- ✅ **"Usuário inativo"** - Conta desativada pelo administrador
- ✅ **"Servidor não respondeu"** - Problema de conexão
- ✅ **"Erro interno do servidor"** - Problema no backend

### Mensagem de Sucesso

Quando o login é bem-sucedido, você verá:
- ✅ Caixa verde com "Login realizado com sucesso! Redirecionando..."
- Redirecionamento automático para o dashboard

---

## Gerenciamento de Usuários (ADMIN)

### Como Criar Novos Usuários

1. Faça login como **admin**
2. No painel principal, clique em **"Gerenciar Usuários"**
3. Clique em **"+ Novo Usuário"**
4. Preencha os campos:
   - **Username**: Nome de usuário único (ex: `maria.silva`)
   - **Nome**: Nome completo (ex: `Maria Silva`)
   - **Email**: Email do usuário (opcional, mas recomendado)
   - **Senha**: Senha forte
   - **Papel**: USER (acesso básico) ou ADMIN (acesso total)
5. Clique em **"Criar"**

### Como Gerenciar Usuários

**Ativar/Desativar:**
- Clique no ícone de toggle (⚡) ao lado do usuário
- Usuários inativos não podem fazer login

**Excluir:**
- Clique no ícone de lixeira (🗑️)
- Confirme a exclusão
- **ATENÇÃO**: Você não pode excluir sua própria conta

---

## Segurança

### Recursos de Segurança Implementados

1. ✅ **Autenticação JWT**: Tokens seguros com expiração de 1 hora
2. ✅ **Senhas Hash**: Senhas criptografadas com pbkdf2:sha256
3. ✅ **Validação de Username**: Usernames únicos no sistema
4. ✅ **Controle de Acesso**: Rotas protegidas por papel (ADMIN/USER)
5. ✅ **Logs de Auditoria**: Todas as ações são registradas
6. ✅ **Status de Usuário**: Ativar/desativar contas sem exclusão

### Boas Práticas

- 🔒 Use senhas fortes (mínimo 8 caracteres)
- 🔒 Não compartilhe credenciais
- 🔒 Desative usuários inativos ao invés de excluí-los
- 🔒 Revise o histórico de logs regularmente
- 🔒 Altere a senha padrão do admin após a instalação

---

## Solução de Problemas

### Não consigo fazer login

1. **Verifique o username**: Deve ser exatamente como cadastrado (case-sensitive)
2. **Verifique a senha**: Certifique-se de não ter Caps Lock ativado
3. **Limpe o cache**: Pressione Ctrl+Shift+Delete no navegador
4. **Verifique o console**: Abra as ferramentas de desenvolvedor (F12)

### "Username não cadastrado"

- **Causa**: O username digitado não existe no banco de dados
- **Solução**: Verifique se digitou corretamente (diferencia maiúsculas/minúsculas)
- **Dica**: Usernames são únicos e case-sensitive

### "Senha incorreta"

- **Causa**: A senha está errada
- **Solução**: Verifique se Caps Lock está desligado
- **Dica**: Use o ícone de olho para visualizar a senha enquanto digita

### Erro "Token não recebido do servidor"

1. Verifique se o servidor está rodando
2. Verifique a configuração do `.env` no backend
3. Certifique-se de que `JWT_SECRET_KEY` está definido

### Erro "Servidor não respondeu"

1. Verifique se o backend está rodando em http://localhost:5000
2. Verifique se não há firewall bloqueando a conexão
3. Tente reiniciar o servidor

---

## Histórico de Logs

### Como Acessar (apenas ADMIN)

1. Faça login como **admin**
2. No painel principal, clique em **"Histórico de Logs"**
3. Visualize todas as ações do sistema:
   - Logins bem-sucedidos e falhos
   - Criação de usuários
   - Exclusão de usuários
   - Alteração de status

### Filtros Disponíveis

- **Por Usuário**: Veja ações de um usuário específico
- **Por Ação**: Filtre por CREATE, DELETE, LOGIN, etc.
- **Por Entidade**: USUARIO, CLIENTE, FATURAMENTO

---

## Mudanças Recentes

### v2.0 - Migração para Username

- ✅ **Antes**: Login com email
- ✅ **Agora**: Login com username
- ✅ **Motivo**: Maior simplicidade e segurança

### Compatibilidade

- O campo **email** ainda existe mas é opcional
- Todos os usuários antigos foram migrados automaticamente
- O username do admin é: `admin`

---

## Contato

Para mais informações sobre autenticação e segurança, consulte a documentação técnica ou entre em contato com o administrador do sistema.
