# Contrato Social Refinado - Documentação

## 🎯 Visão Geral

O Contrato Social foi refinado para ser **específico para constituir novas empresas** a partir de **pessoas físicas já cadastradas** no sistema. Este fluxo é otimizado para escritórios contábeis que precisam criar contratos sociais rapidamente e com dados precisos.

## ✨ Conceito

**Contrato Social** = Constituição de nova empresa com pessoas físicas como sócios

**Outros Contratos** (Alteração, Distrato, etc.) = Modificações em empresas que já existem (PJ cadastradas)

## 📋 Novo Fluxo do Wizard

### **Passo 1: Seleção do Template**
- Usuário escolhe "Contrato Social - Sociedade Limitada"
- Sistema detecta automaticamente que é um contrato social

### **Passo 2: Dados Completos** (NOVO!)
Quando o template é "Contrato Social", o wizard mostra um formulário único e completo com:

#### **1. Sócios da Empresa**
- ✅ Seleção de Pessoas Físicas já cadastradas
- ✅ Adicionar múltiplos sócios
- ✅ Definir percentual de participação de cada um
- ✅ Cargo (Sócio, Sócio Administrador, etc.)
- ✅ Profissão
- ✅ Validação automática: soma dos percentuais = 100%

#### **2. Dados da Empresa**
- ✅ Razão Social (obrigatório)
- ✅ Nome Fantasia (opcional)
- ✅ Capital Social (obrigatório)

#### **3. Atividades Econômicas (CNAE)**
- ✅ Busca inteligente na tabela de CNAEs existente
- ✅ Pesquisa por código ou descrição
- ✅ Seleção de CNAE Principal (obrigatório)
- ✅ Adição de CNAEs Secundários (opcional)
- ✅ Autocomplete com resultados da base de dados

#### **4. Endereço da Empresa**
- ✅ Opção: "Usar endereço de um sócio?"
  - Botões para cada sócio adicionado
  - Um clique e o endereço é preenchido automaticamente
- ✅ Ou preencher manualmente todos os campos
- ✅ Campos bloqueados quando usa endereço do sócio

#### **5. Preview em Tempo Real**
- ✅ Visualização do contrato sendo gerado
- ✅ Atualiza conforme dados são preenchidos

## 🔥 Funcionalidades Inteligentes

### **1. Busca de CNAEs Integrada**
```javascript
// Busca em tempo real
- Digite "comercio" → Mostra todos os CNAEs de comércio
- Digite "8599" → Mostra CNAEs com esse código
- Resultados limitados a 10 para performance
- Mostra código + descrição + grupo
```

### **2. Validações Automáticas**
```javascript
✅ Pelo menos 1 sócio obrigatório
✅ Soma de percentuais = 100%
✅ Razão Social obrigatória
✅ Capital Social obrigatório
✅ CNAE Principal obrigatório
```

### **3. Preenchimento Automático de Dados**
O sistema busca automaticamente dos cadastros:
```
Pessoa Física → Sócio
├── Nome Completo
├── CPF
├── RG
├── Data de Nascimento
├── Estado Civil
├── Regime de Comunhão (se casado)
├── Nacionalidade (padrão: Brasileira)
└── Endereço Completo
```

### **4. Cálculos Automáticos**
```javascript
// Capital Social e Quotas
Capital Social: R$ 5.000,00
→ Número de Quotas: 5.000
→ Valor da Quota: R$ 1,00

// Distribuição por Sócio
Sócio 1: 50% → R$ 2.500,00
Sócio 2: 50% → R$ 2.500,00
```

### **5. Geração Inteligente de Variáveis**
O sistema gera automaticamente mais de 50 variáveis:

```
{{empresa_razao_social}}
{{empresa_nome_fantasia}}
{{empresa_capital_social}}
{{empresa_cnae_principal}}
{{empresa_cnaes}}  // Lista completa
{{empresa_endereco_completo}}
{{empresa_numero_quotas}}
{{empresa_valor_quota}}

{{lista_socios_qualificacao}}  // Texto completo formatado
{{tabela_capital_socios}}       // Tabela de distribuição
{{administradores}}              // Lista de administradores

{{socio_1_nome}}
{{socio_1_cpf}}
{{socio_1_rg}}
{{socio_1_estado_civil}}
{{socio_1_regime_comunhao}}
{{socio_1_endereco_completo}}
{{socio_1_percentual}}
{{socio_1_profissao}}
{{socio_1_cargo}}
// ... e assim para cada sócio

{{assinaturas_socios}}  // Bloco de assinaturas formatado
{{cidade_contrato}}
{{uf_contrato}}
{{data_atual}}
```

## 📊 Exemplo de Uso

### **Cenário Real:**
Um escritório contábil precisa constituir uma empresa para dois clientes:

**1. Adicionar Sócios:**
```
João Silva - CPF 123.456.789-00 (já cadastrado no sistema)
├── Percentual: 60%
├── Cargo: Sócio Administrador
└── Profissão: Contador

Maria Santos - CPF 987.654.321-00 (já cadastrada)
├── Percentual: 40%
├── Cargo: Sócia
└── Profissão: Empresária
```

**2. Dados da Empresa:**
```
Razão Social: SILVA & SANTOS CONTABILIDADE LTDA
Nome Fantasia: SS Contábil
Capital Social: R$ 10.000,00
```

**3. CNAEs:**
```
Principal: 6920-6/01 - Atividades de contabilidade
Secundários:
  - 6911-7/01 - Serviços advocatícios
  - 8299-7/99 - Outras atividades de serviços prestados
```

**4. Endereço:**
```
[Botão: Usar endereço de João Silva] ← Um clique!
→ Rua das Flores, 123, Centro, São Paulo-SP, CEP 01234-567
```

**5. Resultado:**
```
✅ Contrato gerado automaticamente
✅ Todos os dados preenchidos
✅ Formatação profissional
✅ Pronto para impressão/assinatura
```

## 🎯 Vantagens do Novo Fluxo

### **Para o Usuário:**
✅ Processo mais rápido (2 passos em vez de 3)
✅ Menos erros (dados vêm do cadastro)
✅ Interface intuitiva
✅ Validações em tempo real
✅ Preview imediato

### **Para o Sistema:**
✅ Dados consistentes
✅ Integração total com cadastros
✅ Validações robustas
✅ Código organizado e manutenível
✅ Facilita expansão futura

## 🔧 Componentes Criados

### **1. ContratoSocialForm.jsx**
- Formulário completo para Contrato Social
- 400+ linhas de código otimizado
- Gerencia:
  - Sócios (adicionar, remover, editar)
  - Dados da empresa
  - CNAEs com busca integrada
  - Endereço (manual ou do sócio)

### **2. WizardContratoModal.jsx (Atualizado)**
- Detecta tipo de contrato
- Se for Contrato Social: usa fluxo especializado (2 passos)
- Se for outro tipo: usa fluxo genérico (3 passos)
- Preparação inteligente de variáveis

## 📱 Interface do Usuário

### **Passo 1: Escolha o Template**
```
┌─────────────────────────────────────────┐
│  📄 Contrato Social - Sociedade Ltda    │
│  Para constituir nova empresa           │
│  [✓ Selecionado]                        │
└─────────────────────────────────────────┘
```

### **Passo 2: Formulário Completo**
```
┌─────────────────────────────────────────┐
│  👤 Sócios da Empresa                   │
│  [Selecionar Pessoa Física ▼]          │
│                                         │
│  ┌─ João Silva ─────────────────────┐  │
│  │ CPF: 123.456.789-00              │  │
│  │ Percentual: [60] % | Cargo: ...  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  🏢 Dados da Empresa                   │
│  Razão Social: [____________________]  │
│  Capital Social: R$ [_______________]  │
│                                         │
│  📋 CNAEs                               │
│  Buscar: [digite aqui...]              │
│  ✓ 6920-6/01 - Contabilidade          │
│                                         │
│  📍 Endereço                            │
│  [Usar endereço de João Silva]         │
│  ou preencher manualmente              │
│                                         │
│  📄 Preview                             │
│  [Contrato gerado em tempo real]       │
└─────────────────────────────────────────┘

[Voltar] ──────────────────── [Criar Contrato]
```

## 🚀 Como Usar

### **1. Acesse Contratos**
```
Dashboard → [Contratos]
```

### **2. Novo Contrato**
```
[+ Novo Contrato]
```

### **3. Escolha "Contrato Social"**
```
Click no template "Contrato Social - Sociedade Limitada"
```

### **4. Preencha os Dados**
```
a) Adicione os sócios (pessoas físicas cadastradas)
b) Defina percentuais e cargos
c) Preencha dados da empresa
d) Selecione CNAEs da tabela
e) Escolha endereço (do sócio ou manual)
f) Revise o preview
```

### **5. Crie o Contrato**
```
[Criar Contrato]
✅ Contrato salvo como rascunho
```

## 🔒 Validações Implementadas

```javascript
❌ Não pode criar sem sócios
❌ Soma de percentuais ≠ 100%
❌ Razão Social vazia
❌ Capital Social vazio
❌ CNAE Principal não selecionado
✅ Todos os dados validados
```

## 💡 Melhorias Futuras Sugeridas

1. **Importar sócios de XML da Receita**
2. **Sugestão automática de CNAEs** baseada em palavras-chave
3. **Templates de objeto social** por CNAE
4. **Cálculo automático de custos** (taxas de registro, etc.)
5. **Integração com Junta Comercial**
6. **Assinatura digital integrada**

## 📞 Suporte

Para dúvidas sobre o novo fluxo de Contrato Social, consulte esta documentação ou a documentação geral do sistema em `SISTEMA_CONTRATOS.md`.

---

**Versão:** 2.0  
**Data:** Outubro 2025  
**Status:** ✅ Implementado e Funcional

