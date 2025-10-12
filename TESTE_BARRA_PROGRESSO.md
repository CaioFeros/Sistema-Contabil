# 🧪 GUIA DE TESTE: Barra de Progresso

## 🎯 OBJETIVO
Testar se a barra de progresso aparece corretamente e permanece visível por pelo menos 2 segundos.

---

## 📋 CHECKLIST DE TESTE

### **FASE 1: Preparação** ✅
- [ ] Navegador aberto em `http://localhost:5173`
- [ ] Login feito no sistema
- [ ] CSV pronto para upload (seu arquivo com 7 notas)

---

### **FASE 2: Acesso** ✅
- [ ] Clique em "Processar Faturamento" no menu
- [ ] Clique na aba **"Importação via CSV"**
- [ ] Veja a área de upload (drag-and-drop)

---

### **FASE 3: Upload** ✅
- [ ] Arraste seu CSV ou clique em "Selecionar Arquivos"
- [ ] Veja o arquivo aparecer na lista
- [ ] Tamanho do arquivo está correto (ex: 2.5 KB)
- [ ] Clique em **"Processar 1 arquivo(s)"**
- [ ] Aguarde 1-2 segundos
- [ ] ❌ **BARRA NÃO APARECE AQUI** (apenas loading simples)

---

### **FASE 4: Preview** ✅
- [ ] Tela de preview carrega
- [ ] Veja os 4 cards no topo (Arquivos, Válidos, Erro, Faturamento)
- [ ] Veja o card do arquivo com:
  - [ ] ☑ Checkbox marcado
  - [ ] Cliente: RMG ODONTOLOGIA LTDA
  - [ ] CNPJ: 31.710.936/0001-30
  - [ ] Competência: 09/2025
  - [ ] Faturamento: R$ 20.081,77
  - [ ] 7 notas
- [ ] ❌ **BARRA NÃO APARECE AQUI** (ainda não consolidou)

---

### **FASE 5: Consolidação** 🎯 **BARRA AQUI!**
- [ ] Role até o final da página
- [ ] Veja: "1 arquivo(s) selecionado(s)"
- [ ] Veja: "Total a importar: R$ 20.081,77"
- [ ] Clique no botão verde: **"Consolidar 1 arquivo(s)"**

---

### **FASE 6: BARRA DE PROGRESSO** ✅ **TESTE PRINCIPAL**

**Cronômetro - O que você DEVE ver:**

**⏱️ Segundo 0.0:**
```
┌──────────────────────────────────────────┐
│ 🔵 Consolidando Dados...          0%   │
│ Processando 0 de 1 competência(s)       │
│                                          │
│ ░░░░░░░░░░░░░░░░░░░░ 0/1               │
│                                          │
│ ⏳ Calculando impostos e salvando...   │
│ ⚠️  Não feche esta janela               │
└──────────────────────────────────────────┘
```
- [ ] Área azul apareceu
- [ ] Barra está em 0%
- [ ] Texto: "Consolidando Dados..."
- [ ] Spinner está girando
- [ ] Botões ficaram desabilitados

**⏱️ Segundo 0.5:**
```
│ 🔵 Consolidando Dados...      25%    │
│ ████████░░░░░░░░░░░░ 0/1            │
```
- [ ] Barra cresceu (animação suave)
- [ ] Porcentagem aumentou

**⏱️ Segundo 1.0:**
```
│ 🔵 Consolidando Dados...      50%    │
│ ████████████░░░░░░░░ 0/1            │
```
- [ ] Barra na metade
- [ ] Animação continua suave

**⏱️ Segundo 1.5:**
```
│ 🔵 Consolidando Dados...      75%    │
│ ████████████████░░░░ 0/1            │
```
- [ ] Barra quase cheia
- [ ] Texto ainda "Calculando..."

**⏱️ Segundo 2.0:**
```
│ 🔵 Consolidando Dados...     100%    │
│ ████████████████████ 1/1            │
```
- [ ] Barra chegou em 100%
- [ ] Contador mostra: "1 de 1"
- [ ] Número "1/1" dentro da barra

**⏱️ Segundo 2.8:**
```
✅ Importação Concluída!

Sucesso: 1 competência(s)
Ignorado: 0 competência(s)
Erro: 0 competência(s)

Recarregando página em 3 segundos...
```
- [ ] Barra desaparece
- [ ] Mensagem de sucesso aparece
- [ ] Página vai recarregar

---

### **FASE 7: Verificação** ✅
- [ ] Página recarrega automaticamente
- [ ] Veja "Processamentos Recentes" atualizado
- [ ] Nova linha com:
  - [ ] Cliente: RMG ODONTOLOGIA LTDA
  - [ ] Período: 09/2025
  - [ ] Faturamento: R$ 20.081,77

---

## ⏱️ **TIMING DETALHADO**

| Fase | Duração | O que acontece | Barra visível? |
|------|---------|----------------|----------------|
| Upload | ~1s | Valida e processa CSV | ❌ Não |
| Preview | Instantâneo | Mostra dados | ❌ Não |
| Consolidação | **2.8s** | Salva no banco | ✅ **SIM!** |
| Sucesso | 3s | Mensagem + reload | ❌ Não |

**Total visível da barra:** **Garantido 2.8 segundos** ✅

---

## 🎨 **O QUE OBSERVAR NA BARRA**

### **Elementos Visuais:**
1. ✅ **Fundo azul claro** (muda da área cinza)
2. ✅ **Título:** "Consolidando Dados..."
3. ✅ **Contador numérico:** "Processando X de Y"
4. ✅ **Porcentagem grande:** "42%"
5. ✅ **Barra gradiente:** Azul escuro → Azul claro
6. ✅ **Número dentro da barra:** "3/7"
7. ✅ **Spinner animado:** ⏳ Girando
8. ✅ **Mensagem:** "Calculando impostos..."
9. ✅ **Alerta:** "Não feche esta janela"

### **Animações:**
1. ✅ **Barra cresce suavemente** (transition 300ms)
2. ✅ **Spinner gira constantemente**
3. ✅ **Porcentagem atualiza** a cada 300-800ms
4. ✅ **Contador incrementa** gradualmente
5. ✅ **Cor da área de ações** muda (cinza → azul)

---

## 🧪 **TESTE COM DIFERENTES ARQUIVOS**

### **Teste 1: Arquivo com 1 competência**
```bash
CSV: 1 cliente, 1 mês, 7 notas
Resultado esperado:
- Barra aparece
- Contador: "0 de 1" → "1 de 1"
- Duração: 2.8 segundos
```

### **Teste 2: Arquivo com múltiplas competências**
```bash
CSV: 1 cliente, 3 meses, 21 notas
Resultado esperado:
- Barra aparece
- Contador: "0 de 3" → "1 de 3" → "2 de 3" → "3 de 3"
- Progresso: 0% → 33% → 66% → 100%
- Duração: 2.8 segundos
```

### **Teste 3: Múltiplos arquivos**
```bash
CSV: 3 arquivos, 7 competências total
Resultado esperado:
- Barra aparece
- Contador: "0 de 7" → ... → "7 de 7"
- Duração: 2.8 segundos
```

---

## 📸 **CAPTURA DE TELA (Mental)**

Quando você clicar em **"Consolidar"**, você verá:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  🟦🟦🟦🟦  ÁREA AZUL (antes era cinza)  🟦🟦🟦🟦       │
│                                                          │
│  🔵 Consolidando Dados...                       42%     │
│  Processando 3 de 7 competência(s)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ ████████████░░░░░░░░░░░░░░░░░░  3/7           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ⏳ Calculando impostos e salvando dados no banco...   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ ⏳ Este processo pode levar alguns segundos.   │    │
│  │ Por favor, não feche esta janela.              │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦          │
└──────────────────────────────────────────────────────────┘

[Cancelar] [Consolidando...] ← Botões desabilitados
```

---

## ✅ **CRITÉRIOS DE SUCESSO**

Para o teste ser considerado **SUCESSO** ✅, você deve ver:

1. ✅ Barra aparece AO CLICAR em "Consolidar"
2. ✅ Barra fica visível por **PELO MENOS 2 segundos**
3. ✅ Progresso é **GRADUAL** (não pula de 0% para 100%)
4. ✅ Contador incrementa: "0 de X" → "X de X"
5. ✅ Porcentagem visível e grande
6. ✅ Animações suaves (sem travamentos)
7. ✅ Mensagem "Consolidando Dados..." clara
8. ✅ Spinner girando constantemente
9. ✅ Barra atinge 100% antes de fechar
10. ✅ Mensagem de sucesso aparece após barra

---

## 🎬 **AÇÃO!**

### **Execute agora:**

1. Abra: `http://localhost:5173/app/faturamento`
2. Aba: **"Importação via CSV"**
3. Upload: Seu CSV
4. Processar: Veja preview
5. **CONSOLIDAR:** Clique aqui! 👈
6. **OBSERVE:** Conte mentalmente: 1... 2... 3...
7. ✅ **Barra deve estar visível por 2-3 segundos!**

---

## 📝 **ANOTE OS RESULTADOS:**

### **Checklist Visual:**
- [ ] Barra apareceu?
- [ ] Durou pelo menos 2 segundos?
- [ ] Animação foi suave?
- [ ] Porcentagem mudou gradualmente?
- [ ] Contador incrementou?
- [ ] Mensagem estava clara?
- [ ] 100% foi mostrado antes de fechar?
- [ ] Mensagem de sucesso apareceu?

### **Se TODOS estiverem ✅ → TESTE PASSOU! 🎉**

---

## 🐛 **SE NÃO FUNCIONAR:**

**Possíveis problemas:**

1. **Barra não aparece:**
   - Verifique se clicou em "Consolidar" (não em "Processar")
   - Verifique console do navegador (F12)

2. **Barra muito rápida (<2s):**
   - Me avise! Posso aumentar o tempo mínimo

3. **Barra trava em 0%:**
   - Verifique se há erro de consolidação
   - Veja console (F12) e me envie o erro

4. **Barra pula direto para 100%:**
   - Me avise! Ajusto o intervalo

---

**TESTE AGORA E ME AVISE O RESULTADO!** 🚀

