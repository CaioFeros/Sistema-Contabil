# 📜 Histórico de Atividades - Guia Completo

## Visão Geral

O **Histórico de Atividades** é uma funcionalidade exclusiva para administradores que permite visualizar todas as operações importantes do sistema e **desfazer** operações quando necessário.

---

## O que é Registrado

### ✅ Operações de Clientes

**Cadastro:**
- "Cadastrou cliente: Empresa XYZ LTDA"
- Registra: razão social, CNPJ, regime tributário
- **Pode desfazer**: ✅ Sim (se não tiver faturamentos)

**Exclusão:**
- "Excluiu cliente: Empresa XYZ LTDA"
- Registra: razão social, CNPJ, número de processamentos removidos
- **Pode desfazer**: ❌ Não (operação irreversível)

---

### ✅ Operações de Faturamento

**Importação de Competência:**
- "Importou competência 10/2025 da empresa ABC Corp"
- Registra: cliente, mês, ano, total de notas, valor total
- **Pode desfazer**: ✅ Sim

**Exclusão de Competência:**
- "Excluiu competência 10/2025 da empresa ABC Corp"
- Motivo: "Excluído junto com o cliente" ou manual
- **Pode desfazer**: ❌ Não

---

## Exemplo Prático

### Cenário: Exclusão de Cliente com Faturamentos

**Ação do usuário:**
1. Usuário exclui a empresa "XYZ LTDA"
2. A empresa tinha 18 competências importadas

**O que é registrado:**

```
1. Excluiu competência 01/2024 da empresa XYZ LTDA
2. Excluiu competência 02/2024 da empresa XYZ LTDA
3. Excluiu competência 03/2024 da empresa XYZ LTDA
...
18. Excluiu competência 06/2025 da empresa XYZ LTDA
19. Excluiu cliente: XYZ LTDA (18 processamentos removidos)
```

**Total**: 19 registros (18 faturamentos + 1 cliente)

---

### Cenário: Recadastro e Importação

**Ação do usuário:**
1. Usuário cadastra novamente a empresa "XYZ LTDA"
2. Importa 18 competências novamente

**O que é registrado:**

```
1. Cadastrou cliente: XYZ LTDA
2. Importou competência 01/2024 da empresa XYZ LTDA  [Desfazer]
3. Importou competência 02/2024 da empresa XYZ LTDA  [Desfazer]
4. Importou competência 03/2024 da empresa XYZ LTDA  [Desfazer]
...
19. Importou competência 06/2025 da empresa XYZ LTDA  [Desfazer]
```

**Total**: 19 registros (1 cliente + 18 faturamentos)
**Ação disponível**: Botão "Desfazer" em cada importação

---

## Como Usar

### Acessar o Histórico

1. Faça login como **admin**
2. No dashboard, clique em **"Histórico de Atividades"**
3. Visualize todas as operações do sistema

---

### Filtrar Atividades

**Por Tipo:**
- Todos
- Clientes
- Faturamentos

**Por Usuário:**
- Selecione um usuário específico
- Veja apenas suas atividades

**Aplicar/Limpar:**
- Clique em **"Aplicar"** para filtrar
- Clique em **"Limpar"** para resetar

---

### Desfazer uma Operação

**Quando você pode desfazer:**
- ✅ Cadastro de cliente (sem faturamentos)
- ✅ Importação de faturamento

**Quando NÃO pode desfazer:**
- ❌ Exclusões (irreversível)
- ❌ Cliente com faturamentos associados

**Como desfazer:**
1. Encontre a atividade na lista
2. Clique no botão vermelho **"Desfazer"**
3. Confirme a ação
4. ✅ Operação será revertida

---

## Logs Detalhados

### Estrutura de um Log de Cliente

```json
{
  "usuario_id": 1,
  "usuario_nome": "Caio",
  "acao": "CREATE",
  "entidade": "CLIENTE",
  "entidade_id": 5,
  "detalhes": {
    "razao_social": "Empresa XYZ LTDA",
    "cnpj": "12.345.678/0001-99",
    "regime_tributario": "Simples Nacional"
  },
  "data_acao": "2025-10-15T17:03:00",
  "ip_address": "127.0.0.1"
}
```

---

### Estrutura de um Log de Faturamento

```json
{
  "usuario_id": 2,
  "usuario_nome": "Caio",
  "acao": "CREATE",
  "entidade": "FATURAMENTO",
  "entidade_id": 45,
  "detalhes": {
    "cliente_id": 5,
    "cliente_nome": "Empresa XYZ LTDA",
    "mes": 10,
    "ano": 2025,
    "total_notas": 12,
    "faturamento_total": 15000.00
  },
  "data_acao": "2025-10-15T17:04:00"
}
```

---

## Validações de Segurança

### Ao Desfazer Cadastro de Cliente

**Verificações:**
1. ✅ Cliente existe no banco?
2. ✅ Cliente tem faturamentos?
   - Se **SIM**: ❌ Erro "Cliente possui X faturamento(s)"
   - Se **NÃO**: ✅ Permite exclusão

**Processo:**
1. Exclui o cliente do banco
2. Registra log de exclusão
3. Marca motivo: "Desfeita operação de cadastro"

---

### Ao Desfazer Importação de Faturamento

**Verificações:**
1. ✅ Processamento existe?
2. ✅ Tem dados associados?

**Processo:**
1. Exclui todos os detalhes (FaturamentoDetalhe)
2. Exclui o processamento
3. Registra log de exclusão
4. Marca motivo: "Desfeita operação de importação"

---

## Diferenças entre Páginas

| Histórico de Logs | Histórico de Atividades |
|-------------------|-------------------------|
| **Todos** os eventos | Apenas CLIENTE e FATURAMENTO |
| Logins, alterações, etc | CREATE e DELETE |
| Apenas visualização | **Pode desfazer** ✨ |
| Mais técnico | Mais prático |
| Para auditoria | Para gestão operacional |

---

## Casos de Uso

### Caso 1: Cliente Cadastrado por Engano

**Situação:**
- Funcionário cadastrou cliente errado
- Cliente não tem faturamentos

**Solução:**
1. Admin acessa "Histórico de Atividades"
2. Encontra: "Cadastrou cliente: Cliente Errado LTDA"
3. Clica em **"Desfazer"**
4. ✅ Cliente removido do sistema

---

### Caso 2: Faturamento Importado Duplicado

**Situação:**
- Mesma competência foi importada 2 vezes
- Precisa remover uma das importações

**Solução:**
1. Admin acessa "Histórico de Atividades"
2. Encontra: "Importou competência 10/2025 da empresa XYZ"
3. Verifica qual é a duplicada
4. Clica em **"Desfazer"**
5. ✅ Importação removida

---

### Caso 3: Cliente com Faturamentos

**Situação:**
- Admin tenta desfazer cadastro de cliente
- Cliente já tem 5 competências importadas

**Resultado:**
- ❌ Erro: "Não é possível excluir. Cliente possui 5 faturamento(s) importado(s)."
- **Solução**: Desfazer os 5 faturamentos primeiro, depois o cliente

---

## Arquivos Criados/Modificados

### Backend

1. **`backend/app/atividades.py`** (NOVO)
   - Blueprint de atividades
   - Endpoint de listagem
   - Endpoint de desfazer
   - Validações de segurança

2. **`backend/app/routes.py`** (MODIFICADO)
   - Adicionado `log_action()` ao criar cliente
   - Adicionado `log_action()` ao excluir cliente
   - Adicionado `log_action()` ao criar faturamento
   - Adicionado `log_action()` ao excluir faturamento

3. **`backend/app/__init__.py`** (MODIFICADO)
   - Registrado blueprint `atividades_bp`

---

### Frontend

4. **`frontend/src/pages/HistoricoAtividades.jsx`** (NOVO)
   - Página completa de histórico
   - Filtros por tipo e usuário
   - Botão desfazer
   - Paginação

5. **`frontend/src/App.jsx`** (MODIFICADO)
   - Adicionada rota `/app/admin/atividades`

6. **`frontend/src/pages/DashboardPage.jsx`** (MODIFICADO)
   - Adicionado botão "Histórico de Atividades"
   - Grid agora é 3 colunas (lg:grid-cols-3)

---

## Exemplo de Timeline

### Usuário Caio trabalha no sistema:

```
17:03:00 - Caio cadastrou cliente: ABC Corp
17:04:00 - Caio importou competência 10/2025 da empresa ABC Corp
17:04:05 - Caio importou competência 11/2025 da empresa ABC Corp
17:04:10 - Caio importou competência 12/2025 da empresa ABC Corp
17:05:00 - Caio excluiu competência 11/2025 da empresa ABC Corp
17:06:00 - Admin desfez: "Importou competência 12/2025 da empresa ABC Corp"
           └─> Sistema registra: "Excluiu competência 12/2025 da empresa ABC Corp (Desfeita operação)"
```

---

## Mensagens do Sistema

### Sucesso

**Desfazer Cliente:**
```
✅ Cliente excluído com sucesso
```

**Desfazer Faturamento:**
```
✅ Faturamento 10/2025 excluído com sucesso
```

---

### Erros

**Cliente com Faturamentos:**
```
❌ Não é possível excluir. Cliente possui 18 faturamento(s) importado(s).
```

**Cliente já Removido:**
```
❌ Cliente já foi removido
```

**Tentando Desfazer Exclusão:**
```
❌ Apenas criações podem ser desfeitas
```

---

## Segurança e Auditoria

### Rastreabilidade Completa

Cada ação de "desfazer" gera um novo log:
- ✅ Quem desfez
- ✅ Quando desfez
- ✅ Qual log original
- ✅ Motivo da exclusão

### Exemplo de Rastreamento

```
Log #1 (Original):
  Usuário: Caio
  Ação: CREATE
  Entidade: CLIENTE
  ID: 5

Log #2 (Desfazer):
  Usuário: Admin
  Ação: DELETE
  Entidade: CLIENTE
  ID: 5
  Motivo: "Desfeita operação de cadastro"
  Log Original: #1
```

---

## Como Testar

### Teste 1: Cadastro e Exclusão de Cliente

1. Cadastre um cliente qualquer
2. Acesse "Histórico de Atividades"
3. Veja: "Cadastrou cliente: [nome]"
4. Clique em **"Desfazer"**
5. Confirme
6. ✅ Cliente removido

---

### Teste 2: Importação de Faturamento

1. Importe uma competência qualquer
2. Acesse "Histórico de Atividades"
3. Veja: "Importou competência XX/XXXX da empresa [nome]"
4. Clique em **"Desfazer"**
5. Confirme
6. ✅ Faturamento removido

---

### Teste 3: Cliente com Faturamentos

1. Cadastre um cliente
2. Importe 3 competências para esse cliente
3. Tente desfazer o cadastro do cliente
4. ❌ Erro: "Cliente possui 3 faturamento(s)"
5. Desfaça as 3 competências primeiro
6. Agora pode desfazer o cadastro do cliente

---

## Data de Criação
15 de Outubro de 2025

## Status
✅ **Implementado e Funcional**

## Próximas Melhorias Sugeridas
- [ ] Desfazer em lote (múltiplas competências)
- [ ] Exportar histórico para Excel
- [ ] Gráficos de atividades por período
- [ ] Notificações quando alguém desfaz uma operação

