# Changelog - Sistema Contábil

## [1.1.2] - Outubro 2024

### ✨ Melhorias

#### Layout Adaptativo no Relatório Por Mês com Múltiplas Colunas

**Melhoria implementada:**
- Relatório por mês agora reorganiza automaticamente os elementos quando há **15 ou mais notas fiscais**
- Sistema de **múltiplas colunas inteligente** baseado na quantidade de notas
- Layout se adapta para melhor visualização de grandes volumes de dados

**Layout com menos de 15 notas (padrão):**
- Notas Fiscais e Histórico lado a lado (2 colunas)
- Ambos com altura fixa de 36rem
- Layout compacto e eficiente

**Layout com 15 ou mais notas (adaptativo):**
- ✅ Box de Histórico ocupa **largura total** da página no topo
- ✅ Gráficos dos últimos 13 meses aparecem em seguida
- ✅ Box de Notas Fiscais vai **para o final** (após os gráficos) ocupando **largura total**
- ✅ **Sistema de colunas automático:**
  - **15 a 23 notas:** 1 coluna (vertical)
  - **24 a 46 notas:** 2 colunas lado a lado
  - **47+ notas:** 3 colunas lado a lado
- ✅ Título mostra contador e número de colunas: "Notas Fiscais do Mês (35 notas) • 2 colunas"
- ✅ Notas distribuídas uniformemente entre as colunas
- ✅ Melhor aproveitamento do espaço disponível

**Benefícios:**
- 📊 Melhor visualização de meses com muitas notas
- 📱 Layout responsivo e inteligente
- 🎯 Otimização automática baseada no conteúdo
- 👁️ Experiência de leitura melhorada
- 🚀 Suporta qualquer quantidade de notas sem transbordar

**Otimizações para Impressão em PDF:**
- ✅ Box de histórico se expande automaticamente para comportar todos os 13 meses
- ✅ Sistema de múltiplas colunas funciona também na impressão
- ✅ Espaçamentos reduzidos para melhor aproveitamento do papel
- ✅ Fontes ajustadas (menores) para caber mais conteúdo
- ✅ Sombras removidas na impressão para economia de tinta
- ✅ Overflow visível para garantir que nada seja cortado

**Arquivo modificado:**
- `frontend/src/components/RelatorioResult.jsx` - Lógica de layout condicional com múltiplas colunas e otimizações para PDF

---

#### Checkbox de Substituição Já Marcada por Padrão

**Melhoria implementada:**
- Quando importar um CSV de uma competência que **já existe** no sistema, a checkbox "Substituir competência existente" já vem **marcada por padrão**
- Economiza tempo do usuário que geralmente quer substituir dados antigos
- Usuário ainda pode desmarcar se preferir manter os dados originais

**Antes:**
- Competência duplicada detectada
- Usuário precisa marcar a checkbox manualmente ❌
- Mais cliques necessários

**Depois:**
- Competência duplicada detectada
- Checkbox já vem marcada automaticamente ✅
- Usuário pode clicar direto em "Consolidar"
- Ou desmarcar se preferir

**Arquivo modificado:**
- `frontend/src/components/PreviewImportacao.jsx` - Estado inicial de substituições

---

### 🐛 Correções

#### Correção no Modal de Cadastro de Múltiplos Clientes

**Problema identificado:**
- Ao importar CSVs de múltiplos clientes não cadastrados, o modal do **segundo cliente** já vinha com o botão de cadastro em estado de "loading"
- Botão ficava girando eternamente sem responder
- Usuário não conseguia cadastrar o segundo cliente em diante

**Causa:**
- React reutilizava o componente do modal sem resetar o estado
- Estado `cadastrando = true` do primeiro cliente permanecia no segundo
- Modal abria imediatamente sem tempo para limpar o estado

**Correção implementada:**
- ✅ Adicionado `useEffect` no `CadastroClienteModal` que reseta o estado quando o CNPJ muda
- ✅ Adicionada `key` única ao componente para forçar remontagem completa
- ✅ Adicionado delay de 500ms entre cadastros para dar tempo à API e UI respirarem
- ✅ Garante que cada modal abra com estado limpo e pronto para uso

**Arquivos modificados:**
- `frontend/src/components/CadastroClienteModal.jsx` - Reset de estado com useEffect
- `frontend/src/components/PreviewImportacao.jsx` - Key única e delay entre modais
- `CORRECAO_MODAL_MULTIPLOS_CLIENTES.md` - Documentação detalhada

**Resultado:**
- Antes: 1º cliente OK → 2º cliente trava ❌
- Depois: Todos os clientes processam sequencialmente sem travar ✅

---

## [1.1.1] - Outubro 2024

### 🐛 Correções

#### Correção na Importação de Múltiplos CSVs do Mesmo Cliente

**Problema identificado:**
- Ao importar múltiplos arquivos CSV de um cliente não cadastrado, o sistema solicitava o cadastro **para cada arquivo**
- Mesmo sendo o mesmo CNPJ, o modal de cadastro aparecia repetidamente
- Usuário precisava cadastrar o mesmo cliente várias vezes ou cancelar os outros arquivos

**Correção implementada:**
- ✅ Sistema agora atualiza **automaticamente TODOS os arquivos com o mesmo CNPJ** após o cadastro
- ✅ Modal de cadastro aparece apenas **1 vez** por cliente único
- ✅ Se houver múltiplos clientes diferentes, os modais aparecem em sequência
- ✅ Todos os arquivos do cliente cadastrado são marcados automaticamente para consolidação
- ✅ Cancelamento também remove todos os arquivos daquele CNPJ da seleção

**Arquivos modificados:**
- `frontend/src/components/PreviewImportacao.jsx` - Lógica de agrupamento por CNPJ
- `CORRECAO_IMPORTACAO_MULTIPLOS_CSV.md` - Documentação da correção

**Exemplo:**
- Antes: Importar 5 CSVs do mesmo cliente → 5 modais de cadastro ❌
- Depois: Importar 5 CSVs do mesmo cliente → 1 modal de cadastro ✅

---

## [1.1.0] - Outubro 2024

### 🐛 Correções

#### Correção da Alíquota Efetiva no Histórico

**Problema identificado:**
- A alíquota efetiva exibida nos relatórios históricos estava incorreta
- Mesmo com o faturamento acumulado (RBT12) correto, a alíquota mostrava 6%
- O problema ocorria porque a alíquota era calculada usando o imposto SALVO no banco
- Esse imposto foi calculado com o RBT12 da época do processamento (que pode ter sido diferente)

**Exemplo do problema:**
- Janeiro/2025 importado quando RBT12 era R$ 50.000 → imposto salvo = R$ 3.000 (6%)
- Ao consultar depois, com RBT12 de R$ 220.000 → alíquota exibida = 6% ❌ (errado!)
- Deveria mostrar ~7,96% baseado no RBT12 atual ✅

**Correção implementada:**
- ✅ A função `gerar_relatorio_faturamento()` agora recalcula a alíquota efetiva baseada no RBT12 atual
- ✅ A alíquota exibida está sempre correta, independente de quando o arquivo foi importado
- ✅ Funciona corretamente mesmo se arquivos foram importados fora de ordem cronológica

**Arquivos modificados:**
- `backend/app/services.py` - Recálculo da alíquota efetiva no relatório
- `CORRECAO_ALIQUOTA_HISTORICO.md` - Documentação da correção

**Observação:**
- A correção afeta apenas a EXIBIÇÃO da alíquota (agora correta)
- O RBT12 sempre foi calculado corretamente
- Não é necessário recalcular dados históricos para maioria dos casos

---

## [1.0.0] - Outubro 2024

### ✨ Implementações Principais

#### 🚀 Sistema Portátil Local
- Sistema configurado para rodar localmente sem necessidade de servidor externo
- Arquitetura preparada para migração futura para web com mínimas alterações
- Flask serve tanto a API quanto o frontend buildado

#### 🗄️ Migração de Banco de Dados
- Suporte a SQLite para ambiente local/testes
- Mantém compatibilidade com PostgreSQL para produção web futura
- Correções de compatibilidade:
  - Substituição de `server_default=func.now()` por `default=datetime.utcnow`
  - Criação de função `_filtro_periodo()` para substituir `func.make_date()`
  - Todas as consultas SQL compatíveis com ambos os bancos

#### 🛠️ Scripts de Automação
- **`setup_inicial.py`**: Configuração completa do banco de dados
  - Cria arquivo `.env` se não existir
  - Instala dependências Python
  - Executa migrations
  - Popula banco com dados iniciais
  
- **`build_frontend.py`**: Build automático do frontend
  - Instala dependências Node.js
  - Build do React com Vite
  - Copia arquivos para `backend/frontend_build/`
  
- **`iniciar_sistema.py`**: Inicializador multiplataforma
  - Verifica pré-requisitos
  - Inicia servidor Flask
  - Abre navegador automaticamente
  
- **`iniciar_sistema.bat`**: Inicializador Windows
  - Interface amigável com mensagens em português
  - Verificações de pré-requisitos
  - Abre navegador automaticamente
  
- **`INSTALACAO.bat`**: Instalador completo Windows
  - Executa setup e build em sequência
  - Interface guiada passo a passo

#### 📚 Documentação
- **README.md**: Documentação completa do desenvolvedor
  - Guia de instalação
  - Instruções de uso
  - Guia de migração para web
  - Documentação de desenvolvimento
  
- **INSTRUCOES_USUARIO.md**: Guia do usuário final
  - Instruções de instalação simples
  - Guia de uso das funcionalidades
  - Solução de problemas comuns

#### 🔧 Melhorias de Configuração
- Arquivo `.env.example` criado como template
- Suporte a variáveis de ambiente com valores padrão
- Configuração flexível de CORS
- Caminhos absolutos para SQLite

#### 🎨 Removidas Funcionalidades
- Removida aba de "Importação Manual" do processamento de faturamento
- Mantida apenas importação via CSV (mais eficiente)

### 📦 Estrutura de Distribuição

```
Sistema-Contabil/
├── backend/              # API Flask + Frontend buildado
├── frontend/             # Código fonte React
├── setup_inicial.py      # Setup do banco
├── build_frontend.py     # Build do frontend
├── iniciar_sistema.py    # Inicializador multiplataforma
├── iniciar_sistema.bat   # Inicializador Windows
├── INSTALACAO.bat        # Instalador completo
├── README.md             # Doc para desenvolvedores
└── INSTRUCOES_USUARIO.md # Doc para usuários
```

### 🔄 Migração para Web (Futuro)

Apenas 3 mudanças necessárias:

1. **Banco de dados** (backend/.env):
   ```
   # De: DATABASE_URL=sqlite:///sistema_contabil.db
   # Para: DATABASE_URL=postgresql://usuario:senha@servidor/banco
   ```

2. **CORS** (backend/.env):
   ```
   # De: FRONTEND_URL=http://localhost:5000
   # Para: FRONTEND_URL=https://seudominio.com.br
   ```

3. **Deploy**: Backend + frontend_build/ em servidor

### 🐛 Correções
- Problemas de encoding UTF-8 no Windows corrigidos
- Compatibilidade SQLite/PostgreSQL garantida
- Funções SQL específicas de PostgreSQL substituídas por versões universais

### 🔐 Segurança
- Arquivo `.env` protegido no `.gitignore`
- Banco de dados SQLite ignorado no git
- Frontend buildado ignorado no git
- JWT com chaves configuráveis

---

**Versão**: 1.0.0  
**Data**: Outubro 2024  
**Status**: ✅ Pronto para testes em ambiente local

