# 📊 Estatísticas de Armazenamento e Gerenciamento da Lixeira

## 🎯 Funcionalidades Implementadas

### 1. Visualização de Estatísticas de Armazenamento

Na página **Histórico de Atividades**, foram adicionados dois cards informativos:

#### 📦 Card "Banco de Dados"
- **Tamanho do arquivo do banco**: Exibe o tamanho total do arquivo `sistema_contabil.db`
- **Formato**: Exibido em MB (se >= 1MB), KB (se >= 1KB) ou bytes
- **Ícone**: HardDrive (disco rígido)
- **Cores**: Gradiente azul

#### 🗑️ Card "Lixeira (Backup)"
- **Tamanho dos dados de backup**: Tamanho total dos dados JSON armazenados na lixeira
- **Estatísticas detalhadas**:
  - 📦 Total de itens na lixeira
  - 🔄 Itens não restaurados (ainda podem ser recuperados)
  - ✅ Itens restaurados (já foram recuperados)
  - Por tipo de entidade (CLIENTE, PROCESSAMENTO, etc.)
- **Botão "Limpar"**: Permite gerenciar a lixeira
- **Cores**: Gradiente roxo/púrpura

---

## 🧹 Funcionalidade de Limpeza da Lixeira

### Botão "Limpar"

Localizado no card da Lixeira, este botão abre um menu dropdown com 3 opções:

#### 1. 🔄 Limpar Restaurados
- **O que faz**: Remove apenas itens que já foram restaurados
- **Segurança**: ✅ Seguro - não afeta itens ainda não restaurados
- **Quando usar**: Regularmente, para liberar espaço
- **Confirmação**: Simples

#### 2. ⚠️ Limpar Não Restaurados
- **O que faz**: Remove apenas itens que ainda NÃO foram restaurados
- **Segurança**: ⚠️ CUIDADO - você perderá a capacidade de recuperar esses itens
- **Quando usar**: Quando tem certeza que não precisa mais recuperar nada
- **Confirmação**: Aviso forte

#### 3. 🗑️ Limpar Tudo
- **O que faz**: Remove TODOS os itens da lixeira (restaurados e não restaurados)
- **Segurança**: ⚠️ PERIGO - ação irreversível
- **Quando usar**: Manutenção completa do sistema
- **Confirmação**: Aviso crítico

### Mensagens de Confirmação

Cada opção tem uma mensagem de confirmação apropriada ao nível de risco:

**Restaurados:**
```
Deseja remover apenas os itens já restaurados da lixeira?
```

**Não Restaurados:**
```
ATENÇÃO: Esta ação irá remover todos os itens NÃO RESTAURADOS da lixeira!

Você não poderá mais recuperar esses itens.

Tem certeza?
```

**Todos:**
```
ATENÇÃO: Esta ação irá remover TODOS os itens da lixeira permanentemente!

Itens não restaurados serão perdidos definitivamente.

Tem certeza?
```

---

## 🔧 Implementação Técnica

### Backend (API Endpoints)

#### GET `/api/atividades/estatisticas`
- **Autenticação**: Requer token + permissão de admin
- **Retorna**:
  ```json
  {
    "tamanho_banco_bytes": 1048576,
    "tamanho_banco_mb": 1.0,
    "tamanho_backup_bytes": 102400,
    "tamanho_backup_mb": 0.1,
    "tamanho_backup_kb": 100.0,
    "total_itens_lixeira": 15,
    "itens_nao_restaurados": 5,
    "itens_restaurados": 10,
    "tipos_entidade": [
      {
        "tipo": "CLIENTE",
        "total": 10,
        "nao_restaurados": 3
      },
      {
        "tipo": "PROCESSAMENTO",
        "total": 5,
        "nao_restaurados": 2
      }
    ],
    "caminho_banco": "D:/Dev/Sistema-Contabil/backend/sistema_contabil.db"
  }
  ```

#### POST `/api/atividades/limpar-lixeira`
- **Autenticação**: Requer token + permissão de admin
- **Body**:
  ```json
  {
    "tipo": "restaurados" | "nao_restaurados" | "todos"
  }
  ```
- **Retorna**:
  ```json
  {
    "mensagem": "10 item(ns) restaurado(s) removido(s) da lixeira",
    "quantidade": 10
  }
  ```

### Frontend

#### Estado Adicionado
```javascript
const [estatisticas, setEstatisticas] = useState(null);
const [loadingLimpeza, setLoadingLimpeza] = useState(false);
const [menuLimpezaAberto, setMenuLimpezaAberto] = useState(false);
```

#### Funções Principais
- `carregarEstatisticas()`: Carrega dados do backend
- `handleLimparLixeira(tipo)`: Executa limpeza da lixeira
- `formatarTamanho(bytes, mb)`: Formata tamanhos para exibição

#### Comportamento do Menu Dropdown
- Abre/fecha ao clicar no botão
- Fecha ao clicar fora do menu
- Desabilita opções quando não há itens do tipo correspondente
- Usa `useEffect` para gerenciar eventos de clique

---

## 🎨 Design e UX

### Cards de Estatísticas

**Responsividade:**
- 2 colunas em desktop (md:grid-cols-2)
- 1 coluna em mobile

**Gradientes:**
- Banco de Dados: Azul (from-blue-50 to-blue-100)
- Lixeira: Roxo (from-purple-50 to-purple-100)
- Suporte a dark mode

**Ícones:**
- Database: Banco de dados
- HardDrive: Armazenamento físico
- Trash2: Lixeira

### Menu Dropdown

**Características:**
- Posicionado à direita (absolute right-0)
- Sombra elevada (shadow-xl)
- Animação suave
- Z-index 50 para aparecer sobre outros elementos
- Cores diferentes por nível de perigo:
  - Cinza: Seguro
  - Laranja: Cuidado
  - Vermelho: Perigo

---

## 📝 Logs de Auditoria

Todas as operações de limpeza são registradas no log de auditoria:

```json
{
  "usuario_id": 1,
  "acao": "DELETE",
  "entidade": "SISTEMA",
  "detalhes": {
    "acao": "Limpeza da lixeira (itens restaurados)",
    "quantidade": 10
  }
}
```

---

## 💡 Casos de Uso

### Caso 1: Manutenção Regular
1. Acesse "Histórico de Atividades"
2. Verifique o tamanho da lixeira
3. Clique em "Limpar" → "Limpar Restaurados"
4. Confirme a ação
5. Veja o espaço liberado atualizado

### Caso 2: Preparação para Backup
1. Verifique o tamanho total do banco
2. Se necessário, limpe itens desnecessários da lixeira
3. Execute o backup do sistema

### Caso 3: Liberar Espaço Crítico
1. Observe que o banco está muito grande
2. Verifique estatísticas da lixeira
3. Se houver muitos itens restaurados, remova-os
4. Considere remover itens não restaurados antigos (se apropriado)

---

## ⚙️ Configurações e Limites

### Limites do Sistema
- **Não há limite** de tamanho para a lixeira
- Recomendação: Limpar regularmente itens restaurados
- Itens não restaurados devem ser mantidos por tempo razoável antes da limpeza

### Boas Práticas
1. **Limpe regularmente** itens restaurados (sem risco)
2. **Aguarde 30-90 dias** antes de limpar itens não restaurados
3. **Faça backup** do banco antes de limpezas completas
4. **Monitore** o crescimento do banco regularmente

---

## 🔒 Segurança

### Controles de Acesso
- ✅ Apenas administradores podem acessar estatísticas
- ✅ Apenas administradores podem limpar a lixeira
- ✅ Todas as ações são registradas em log de auditoria
- ✅ Confirmações duplas para ações destrutivas

### Proteções
- Validação de tipo de limpeza no backend
- Transações de banco de dados para garantir consistência
- Rollback automático em caso de erro
- Mensagens de erro informativas

---

## 🚀 Benefícios

1. **Visibilidade**: Saber quanto espaço está sendo usado
2. **Controle**: Gerenciar o crescimento do banco
3. **Performance**: Manter o banco otimizado
4. **Segurança**: Poder recuperar dados deletados quando necessário
5. **Auditoria**: Rastrear todas as operações de limpeza

---

## ✨ Resumo

Esta implementação oferece:
- 📊 Visualização clara de uso de armazenamento
- 🗑️ Gerenciamento flexível da lixeira
- ⚠️ Avisos apropriados baseados no risco
- 📝 Auditoria completa de ações
- 🎨 Interface intuitiva e moderna
- 🔒 Segurança e controle de acesso

**Tudo funcionando perfeitamente!** ✅

