# Contrato de Extinção - Documentação

## 📋 Visão Geral

Sistema específico para criar contratos de extinção/dissolução de empresas **já cadastradas** no sistema (PJ).

## ✨ Tipos de Extinção Suportados

### **1. Extinção de Sociedade Limitada Unipessoal**
- Para empresas com único sócio
- Campos: Valor de liquidação
- Simples e direto

### **2. Extinção de Empresário Individual**  
- Para empresários individuais
- Campos: Datas e valores

### **3. Distrato de Sociedade (Dissolução Total)**
- Para empresas com múltiplos sócios
- Campos: Ativo, Passivo, Patrimônio Líquido
- Responsável pela documentação

## 🎯 Conceito

**Extinção** = Encerramento de empresa **JÁ CADASTRADA** (PJ)  
**Contrato Social** = Constituição de **NOVA** empresa (a partir de PF)

## 📋 Fluxo do Wizard

### **Passo 1: Seleção do Template**
- Usuário escolhe tipo de extinção
- Sistema detecta automaticamente

### **Passo 2: Formulário Completo**

#### **Seleção da Empresa:**
- ✅ Dropdown com empresas PJ cadastradas
- ✅ Mostra: Razão Social - CNPJ
- ✅ Carrega automaticamente dados e sócios

#### **Informações Exibidas:**
- Razão Social
- CNPJ
- Capital Social
- Endereço completo
- Lista de sócios com percentuais

#### **Dados da Extinção:**
- ✅ Data do Balanço de Liquidação
- ✅ Data de Encerramento
- ✅ Motivo da extinção (texto livre)

#### **Valores Financeiros:**

**Para Unipessoal:**
- Valor da Liquidação (R$)

**Para Distrato/Dissolução:**
- Ativo Total (R$)
- Passivo Total (R$)
- **Patrimônio Líquido** (calculado automaticamente: Ativo - Passivo)

#### **Guarda de Documentação:**
- ✅ Seleção de sócio responsável (dropdown automático)

#### **Resumo Visual:**
```
┌─────────────────────────────────────────┐
│  ⚠️ Resumo da Extinção                  │
│                                         │
│  Empresa: ABC LTDA                      │
│  CNPJ: 12.345.678/0001-90              │
│  Patrimônio Líquido: R$ 7.000,00       │
│  Responsável: João Silva                │
│  Data Encerramento: 20/10/2025         │
└─────────────────────────────────────────┘
```

## 🔥 Funcionalidades Inteligentes

### **1. Cálculo Automático:**
```javascript
Ativo: R$ 10.000,00
Passivo: R$ 3.000,00
→ Patrimônio Líquido: R$ 7.000,00 (automático!)
```

### **2. Dados Puxados Automaticamente:**
```
Empresa Selecionada →
├── Razão Social
├── CNPJ
├── Endereço Completo
├── Capital Social
├── Sócios (com percentuais)
└── Dados cadastrais
```

### **3. Validações:**
- ✅ Empresa obrigatória
- ✅ Datas obrigatórias
- ✅ Valores numéricos válidos

## 📊 Exemplo de Uso

### **Cenário: Extinção Unipessoal**

```
1. Wizard → Escolher "Extinção - Sociedade Unipessoal"

2. Preencher:
   Empresa: [MARIA SILVA LTDA - 12.345.678/0001-90]
   
   → Carrega automaticamente:
     • Sócio: Maria Silva
     • Endereço: Rua X, 123...
     • Capital: R$ 5.000,00
   
   Data Balanço: [17/10/2025]
   Data Encerramento: [20/10/2025]
   Valor Liquidação: R$ 5.000,00
   
3. [Criar Contrato]

4. ✅ Contrato gerado com todos os dados!
```

### **Cenário: Distrato (Dissolução Total)**

```
1. Wizard → Escolher "Distrato de Sociedade"

2. Preencher:
   Empresa: [XYZ COMÉRCIO LTDA - 98.765.432/0001-10]
   
   → Carrega 3 sócios:
     • João Silva - 40%
     • Maria Santos - 30%
     • Pedro Costa - 30%
   
   Ativo Total: R$ 50.000,00
   Passivo Total: R$ 15.000,00
   → Patrimônio Líquido: R$ 35.000,00 ✅ (automático)
   
   Responsável Documentação: [João Silva]
   
3. [Criar Contrato]

4. ✅ Distrato gerado com partilha automática!
```

## 🎨 Interface do Formulário

```
┌─────────────────────────────────────────────┐
│  🏢 Sociedade a ser Extinta                 │
│  [Selecionar Empresa ▼]                     │
│                                              │
│  ┌─ ABC LTDA ───────────────────────────┐  │
│  │ CNPJ: 12.345.678/0001-90             │  │
│  │ Capital: R$ 10.000,00                │  │
│  │ Endereço: Rua X, 123, São Paulo-SP   │  │
│  │                                       │  │
│  │ Sócios:                               │  │
│  │ • Maria Silva - 100%                  │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  📋 Dados da Extinção                       │
│  Data Balanço: [17/10/2025]                 │
│  Data Encerramento: [20/10/2025]            │
│                                              │
│  💰 Valores da Liquidação                   │
│  Ativo: R$ [10.000]                         │
│  Passivo: R$ [3.000]                        │
│  Patrimônio Líquido: R$ 7.000 ✅ automático │
│                                              │
│  ⚠️ Resumo da Extinção                      │
│  Empresa: ABC LTDA                          │
│  Patrimônio: R$ 7.000,00                    │
└─────────────────────────────────────────────┘
```

## 🚀 Como Usar

1. **Dashboard → Contratos → [+ Novo Contrato]**

2. **Escolher tipo de extinção:**
   - Extinção Unipessoal
   - Extinção Individual
   - Distrato/Dissolução

3. **Preencher formulário:**
   - Selecionar empresa
   - Definir datas
   - Informar valores
   - Escolher responsável

4. **[Criar Contrato]**

5. **Visualizar e gerar PDF**

## 📱 Arquivos Criados

```
✅ frontend/src/components/ContratoExtincaoForm.jsx
✅ Integração no WizardContratoModal.jsx
✅ Lógica de preparação de variáveis
✅ Validações específicas
```

## ✨ Status

✅ **100% Funcional e Integrado**

---

**Versão:** 1.0  
**Data:** Outubro 2025

