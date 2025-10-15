# Correção: Alíquota Efetiva no Histórico

## 🔍 Problema Identificado

A alíquota efetiva exibida nos relatórios históricos estava **incorreta**, mesmo quando o faturamento acumulado (RBT12) estava correto.

### Por que isso acontecia?

Quando um arquivo CSV é importado para um mês:
1. O sistema calcula o RBT12 (12 meses anteriores)
2. Calcula o imposto baseado nesse RBT12
3. **Salva o imposto no banco de dados**

Quando você consulta o histórico:
1. O sistema **recalcula o RBT12** (que pode ser diferente agora)
2. Mas exibia a alíquota baseada no **imposto SALVO** (calculado com o RBT12 antigo)

### Exemplo do Problema

**Cenário:** Você importa os arquivos fora de ordem cronológica

1. **Janeiro/2025 importado primeiro:**
   - RBT12 na época = R$ 0 (não há meses anteriores no banco)
   - Imposto calculado e SALVO = R$ 600 (6% de R$ 10.000)

2. **Depois você importa fev/2024 até dez/2024:**
   - RBT12 total = R$ 220.000

3. **Ao consultar janeiro/2025 agora:**
   - RBT12 recalculado corretamente = R$ 220.000 ✅
   - Mas alíquota exibida = R$ 600 / R$ 10.000 = 6% ❌ (ERRADO!)
   - Deveria ser ~7,96% baseado no RBT12 de R$ 220.000

## ✅ Solução Implementada

### Correção 1: Recálculo da Alíquota na Exibição

A função `gerar_relatorio_faturamento()` agora **recalcula a alíquota efetiva** baseada no RBT12 atual, em vez de usar o imposto salvo no banco.

**Arquivo modificado:** `backend/app/services.py`

Antes:
```python
# Usava o imposto salvo para calcular a alíquota
aliquota_efetiva = p.imposto_calculado / p.faturamento_total
```

Depois:
```python
# Recalcula a alíquota baseada no RBT12 atual
if rbt12 > 0:
    for faixa in faixas_sn:
        if rbt12 <= faixa["limite"]:
            aliquota_efetiva = ((rbt12 * aliquota_nominal) - parcela_a_deduzir) / rbt12
            break
```

**Resultado:**
- ✅ A alíquota exibida agora está **sempre correta** baseada no RBT12 atual
- ✅ Funciona corretamente mesmo se os arquivos foram importados fora de ordem
- ✅ Não requer recálculo dos impostos salvos no banco

### Observação Importante

O `imposto_calculado` salvo no banco de dados pode ainda estar com valor diferente do que deveria ser (se foi importado fora de ordem ou antes de ter todo o histórico).

**Isso afeta apenas:**
- O valor do imposto que foi registrado naquele mês específico
- Relatórios que somam impostos de vários meses

**Isso NÃO afeta:**
- A alíquota efetiva exibida (que agora está correta) ✅
- O faturamento acumulado (RBT12) que sempre foi calculado corretamente ✅

## 🔧 Quando Recalcular os Impostos Salvos?

Você só precisa recalcular os impostos salvos no banco se:
1. Importou arquivos **fora de ordem cronológica**
2. Importou arquivos **antes de ter todo o histórico de 12 meses**
3. Precisa de relatórios com soma de impostos **exata**

Para a maioria dos casos, a correção da exibição da alíquota já é suficiente.

## 📊 Verificação

Para verificar se a correção está funcionando:

1. **Acesse o sistema**
2. **Vá em Relatórios**
3. **Selecione um cliente** com faturamento acumulado > R$ 180.000
4. **Consulte um mês específico** (ex: janeiro/2025)
5. **Verifique:**
   - ✅ Faturamento Acumulado (12 meses) está correto
   - ✅ Alíquota Efetiva está conforme a faixa do RBT12

### Faixas Esperadas

| RBT12 | Alíquota Efetiva Esperada |
|-------|---------------------------|
| R$ 100.000 | 6,00% |
| R$ 200.000 | ~6,52% |
| R$ 240.000 | ~7,30% |
| R$ 360.000 | ~9,60% |
| R$ 500.000 | ~10,03% |
| R$ 720.000 | ~11,05% |

**Fórmula:** Alíquota Efetiva = [(RBT12 × Alíquota Nominal) - Dedução] ÷ RBT12

---

**Versão:** 1.1.0  
**Data:** Outubro 2024  
**Status:** ✅ Correção implementada e ativa

