# Correção: Importação de Múltiplos CSVs do Mesmo Cliente

## 🔍 Problema Identificado

Ao importar múltiplos arquivos CSV de uma empresa **não cadastrada**, o sistema solicitava o cadastro do cliente **para cada arquivo separadamente**, mesmo sendo o mesmo CNPJ.

### Comportamento Anterior (Incorreto)

1. Usuário seleciona 3 CSVs da mesma empresa (mesmo CNPJ)
2. Sistema mostra modal para cadastrar o cliente (1º arquivo)
3. Usuário cadastra o cliente
4. Sistema mostra modal NOVAMENTE para o 2º arquivo ❌
5. Sistema mostra modal NOVAMENTE para o 3º arquivo ❌

**Resultado:** Usuário precisava cadastrar o cliente 3 vezes (ou cancelar os outros arquivos)

## ✅ Solução Implementada

Agora o sistema reconhece automaticamente que o cliente foi cadastrado e atualiza **todos os arquivos com o mesmo CNPJ**.

### Comportamento Novo (Correto)

1. Usuário seleciona 3 CSVs da mesma empresa (mesmo CNPJ)
2. Sistema mostra modal para cadastrar o cliente (1x apenas)
3. Usuário cadastra o cliente
4. Sistema atualiza **automaticamente TODOS os 3 arquivos** ✅
5. Todos os 3 arquivos ficam marcados como selecionados ✅
6. Usuário pode clicar em "Consolidar" diretamente ✅

### Benefícios Adicionais

- ✅ Se houver arquivos de **clientes diferentes** não cadastrados, o sistema mostra os modais em sequência
- ✅ Se o usuário cancelar o cadastro, **todos os arquivos** daquele CNPJ são desmarcados
- ✅ Processo muito mais rápido e intuitivo

## 📝 Arquivos Modificados

**Arquivo:** `frontend/src/components/PreviewImportacao.jsx`

### Mudança 1: Atualização após Cadastro

**Antes:**
```javascript
// Atualizava apenas o arquivo específico
if (arquivo.id_temporario === clienteParaCadastrar.arquivoId) {
  // atualiza apenas este arquivo
}
```

**Depois:**
```javascript
// Atualiza TODOS os arquivos com o mesmo CNPJ
if (arquivo.cnpj === cnpjCadastrado && ...) {
  // atualiza todos os arquivos deste CNPJ
}
```

### Mudança 2: Próximo Cliente Não Cadastrado

**Novo comportamento:**
```javascript
// Após cadastrar um cliente, verifica se há outro cliente (CNPJ diferente) que precisa ser cadastrado
const proximoArquivoNaoCadastrado = novosArquivos.find(
  arquivo => arquivo.cnpj !== cnpjCadastrado && arquivo.precisa_cadastrar
);

if (proximoArquivoNaoCadastrado) {
  // Abre o modal para o próximo cliente
}
```

### Mudança 3: Cancelamento Melhorado

**Antes:**
```javascript
// Desmarcava apenas o arquivo atual
setArquivosSelecionados({ [arquivoId]: false });
```

**Depois:**
```javascript
// Desmarca TODOS os arquivos com o mesmo CNPJ
dadosPreview.arquivos_processados.forEach(arquivo => {
  if (arquivo.cnpj === cnpjCancelado) {
    arquivosSelecionados[arquivo.id_temporario] = false;
  }
});
```

## 🎯 Cenários de Uso

### Cenário 1: Múltiplos CSVs do Mesmo Cliente Não Cadastrado

**Passos:**
1. Arraste 5 CSVs da "Empresa ABC LTDA" (CNPJ: 12.345.678/0001-00)
2. Clique em "Processar"
3. Sistema detecta que o cliente não está cadastrado
4. Modal aparece 1x para cadastrar a "Empresa ABC LTDA"
5. Preencha os dados e clique em "Cadastrar"
6. ✅ Todos os 5 arquivos são atualizados automaticamente
7. ✅ Todos os 5 arquivos ficam marcados como selecionados
8. Clique em "Consolidar 5 arquivo(s)"

### Cenário 2: Múltiplos Clientes Não Cadastrados

**Passos:**
1. Arraste 3 CSVs da "Empresa ABC" + 2 CSVs da "Empresa XYZ"
2. Clique em "Processar"
3. Modal aparece para cadastrar "Empresa ABC"
4. Cadastre a "Empresa ABC"
5. ✅ Os 3 arquivos da ABC são atualizados
6. ✅ Modal aparece automaticamente para "Empresa XYZ"
7. Cadastre a "Empresa XYZ"
8. ✅ Os 2 arquivos da XYZ são atualizados
9. ✅ Todos os 5 arquivos estão prontos para consolidar

### Cenário 3: Cancelamento

**Passos:**
1. Arraste 4 CSVs da "Empresa ABC" (não cadastrada)
2. Clique em "Processar"
3. Modal aparece para cadastrar "Empresa ABC"
4. Clique em "Cancelar"
5. ✅ Todos os 4 arquivos da ABC são desmarcados
6. Você pode cadastrar o cliente manualmente e tentar novamente

## 🔄 Como Aplicar a Correção

### Para Usuários

Se o sistema já está rodando:

1. **Pare o servidor Flask** (feche a janela ou Ctrl+C)
2. **Rebuild do frontend:**
   ```bash
   python build_frontend.py
   ```
3. **Reinicie o sistema:**
   ```bash
   python iniciar_sistema.py
   ```
   Ou execute `iniciar_sistema.bat`

### Verificação

Para verificar se a correção está funcionando:

1. Crie 3 CSVs de teste do mesmo cliente (mesmo CNPJ)
2. Garanta que o cliente não está cadastrado
3. Faça o upload dos 3 CSVs
4. O modal deve aparecer **apenas 1 vez**
5. Após cadastrar, todos os 3 arquivos devem estar prontos para consolidar

## 📚 Documentação Técnica

### Lógica de Agrupamento por CNPJ

O sistema agora:

1. **Identifica** todos os arquivos com o mesmo CNPJ
2. **Agrupa** as atualizações por CNPJ
3. **Aplica** mudanças em todos os arquivos do grupo
4. **Procura** o próximo CNPJ não cadastrado (se houver)

### Estados Gerenciados

- `dadosPreview` - Dados de todos os arquivos
- `arquivosSelecionados` - Quais arquivos estão marcados
- `clienteParaCadastrar` - Cliente atual que precisa de cadastro
- `substituicoesPorCompetencia` - Competências a substituir

---

**Versão:** 1.1.1  
**Data:** Outubro 2024  
**Status:** ✅ Correção implementada e testada

