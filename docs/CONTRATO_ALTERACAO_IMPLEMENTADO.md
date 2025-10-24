# Contrato de Alteração Contratual - Implementação Completa

## Resumo
Foi implementado com sucesso o sistema de Contrato de Alteração Contratual com 3 passos conforme solicitado.

## O que foi implementado

### 1. Frontend - Componente ContratoAlteracaoForm.jsx
✅ **Criado**: `frontend/src/components/ContratoAlteracaoForm.jsx`

Componente React com 3 sub-passos:

#### **Sub-Passo 1: Selecionar Empresa**
- Lista todas as empresas (clientes PJ) cadastradas
- Busca por razão social ou CNPJ
- Seleção visual com feedback

#### **Sub-Passo 2: Selecionar Tipos de Alterações**
Interface com 4 opções de alteração (seleção múltipla):
- ✅ **Mudança de Quadro Societário** - Adicionar, remover ou alterar sócios
- ✅ **Alteração no Capital Social** - Aumentar ou reduzir capital
- ✅ **Alteração no Quadro de Atividades** - Adicionar ou remover CNAEs
- ✅ **Alteração de Endereço** - Mudar a sede da empresa

#### **Sub-Passo 3: Preencher Dados das Alterações**
Formulários dinâmicos para cada tipo de alteração selecionada:

**Quadro Societário:**
- Lista sócios atuais
- Adicionar alterações (adicionar sócio, remover sócio, alterar participação)
- Preenchimento de dados completos do sócio

**Capital Social:**
- Capital atual (readonly, vem do cadastro)
- Novo capital
- Forma de integralização (dinheiro/bens/misto)
- Justificativa da alteração

**Quadro de Atividades:**
- Lista CNAEs atuais
- Busca inteligente de CNAEs para adicionar
- Marcar CNAEs para remover
- Preview de alterações

**Endereço:**
- Exibe endereço atual
- Formulário completo para novo endereço (logradouro, número, complemento, bairro, CEP, município, UF)

### 2. Frontend - Integração no WizardContratoModal
✅ **Atualizado**: `frontend/src/components/WizardContratoModal.jsx`

Alterações:
- Importado ContratoAlteracaoForm
- Adicionado estado `dadosContratoAlteracao`
- Criado `prepararDadosVariaveisAlteracao()` para processar os dados
- Integrado formulário no passo 2 do wizard
- Adicionado validações para alteração contratual
- Preview automático do contrato gerado

### 3. Frontend - Services
✅ **Atualizado**: `frontend/src/services/socioService.js`
- Adicionada função `buscarSociosPorCliente()` para compatibilidade

✅ **Existente**: `frontend/src/services/cnaeService.js`
- Função `buscarCNAE()` já estava implementada

### 4. Backend - Template de Contrato
✅ **Criado**: `backend/popular_template_alteracao.py`
- Script para criar template no banco

✅ **Criado**: `backend/atualizar_template_alteracao.py`
- Script para atualizar template com conteúdo melhorado

✅ **Template Criado no Banco**:
- Tipo: `alteracao_contratual`
- Nome: "Alteração Contratual"
- Conteúdo estruturado com todas as variáveis necessárias
- Variáveis disponíveis: 20+ variáveis para substituição

### 5. Backend - Processamento
✅ **Já Existente**: Rota `/api/contratos` (POST)
- O backend já está preparado para processar qualquer tipo de contrato
- Recebe `template_id`, `dados_variaveis`, `empresa_id`, `socios_envolvidos`
- Função `substituir_variaveis()` faz a substituição dinâmica
- Gera número de contrato automaticamente
- Salva no banco com log de auditoria

## Variáveis do Template

O template de alteração contratual suporta as seguintes variáveis:

### Dados da Empresa
- `empresa_razao_social`
- `empresa_cnpj`
- `empresa_nome_fantasia`
- `empresa_endereco_completo`
- `cidade_contrato`
- `uf_contrato`

### Dados Gerais
- `data_atual`
- `tipos_alteracao_lista` - Lista dos tipos de alteração selecionados

### Quadro Societário
- `socios_atuais` - Lista de sócios atuais
- `alteracoes_quadro_societario` - Detalhamento das alterações

### Capital Social
- `capital_social_atual`
- `capital_social_novo`
- `forma_integralizacao`
- `justificativa_capital`

### Quadro de Atividades
- `cnaes_atuais`
- `cnaes_adicionar`
- `cnaes_remover`

### Endereço
- `endereco_atual`
- `endereco_novo`

### Assinaturas
- `assinaturas_socios`

## Fluxo de Uso

1. **Usuário acessa** Contratos > Novo Contrato
2. **Seleciona** "Alteração Contratual" na lista de templates
3. **Preenche** título e observações
4. **Sub-Passo 1**: Seleciona a empresa que terá alterações
5. **Sub-Passo 2**: Marca os tipos de alteração desejados (pode marcar múltiplos)
6. **Sub-Passo 3**: Preenche os dados de cada alteração selecionada
7. **Preview**: Visualiza o contrato gerado em tempo real
8. **Finalizar**: Cria o contrato com status "rascunho"
9. **Opcionalmente**: Pode gerar PDF profissional do contrato

## Características Técnicas

### Validações
- Empresa obrigatória
- Pelo menos um tipo de alteração deve ser selecionado
- Campos obrigatórios validados em cada formulário
- Feedback visual de erros

### UX/UI
- Design moderno e responsivo
- Dark mode suportado
- Indicador de progresso com 3 passos
- Cards clicáveis com seleção visual
- Preview em tempo real
- Navegação entre passos (Voltar/Próximo)
- Ícones intuitivos para cada tipo de alteração

### Performance
- Lazy loading dos dados
- Debounce na busca de CNAEs (500ms)
- Carregamento assíncrono de sócios e CNAEs
- Estados de loading otimizados

## Arquivos Criados/Modificados

### Novos Arquivos
1. `frontend/src/components/ContratoAlteracaoForm.jsx` (862 linhas)
2. `backend/popular_template_alteracao.py`
3. `backend/atualizar_template_alteracao.py`
4. `CONTRATO_ALTERACAO_IMPLEMENTADO.md` (este arquivo)

### Arquivos Modificados
1. `frontend/src/components/WizardContratoModal.jsx`
   - Adicionado import do ContratoAlteracaoForm
   - Adicionado estado dadosContratoAlteracao
   - Adicionado prepararDadosVariaveisAlteracao()
   - Integrado no passo 2
   - Atualizado isContratoAlteracao e usaFormularioEspecifico

2. `frontend/src/services/socioService.js`
   - Adicionado buscarSociosPorCliente()

## Status Final

✅ **CONCLUÍDO** - Sistema de Contrato de Alteração Contratual implementado com sucesso!

### Checklist
- [x] Componente ContratoAlteracaoForm com 3 sub-passos
- [x] Sub-passo 1: Seleção de empresa
- [x] Sub-passo 2: Seleção múltipla de tipos de alteração
- [x] Sub-passo 3: Formulários específicos para cada alteração
- [x] Integração no WizardContratoModal
- [x] Preparação de dados para variáveis
- [x] Template criado no banco
- [x] Backend preparado (já estava)
- [x] Validações implementadas
- [x] Preview em tempo real
- [x] Sem erros de lint
- [x] Design responsivo e acessível

## Como Testar

1. **Iniciar o sistema**: `npm run dev` (na pasta frontend)
2. **Acessar**: http://localhost:5173/app/contratos
3. **Clicar em**: "Novo Contrato"
4. **Selecionar**: "Alteração Contratual" nos templates
5. **Seguir os 3 passos**:
   - Escolher uma empresa
   - Marcar os tipos de alteração desejados
   - Preencher os dados
6. **Visualizar preview** do contrato gerado
7. **Criar contrato**
8. **Gerar PDF** (opcional)

## Observações

- O template pode ser personalizado editando-o diretamente no banco de dados
- Novas variáveis podem ser adicionadas conforme necessário
- O sistema suporta múltiplas alterações simultâneas
- Todos os dados são salvos como JSON no campo `dados_variaveis` do contrato
- O PDF é gerado automaticamente com formatação profissional

