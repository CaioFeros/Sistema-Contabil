# 📋 Guia de Importação CSV de Notas Fiscais

## 🎯 Visão Geral

O sistema agora suporta importação automática de dados de faturamento através de arquivos CSV de Notas Fiscais Eletrônicas (NF-e), exportados diretamente da Prefeitura/SEFAZ.

---

## ✅ Funcionalidades

### 1. **Upload Múltiplo**
- Suporte para múltiplos arquivos CSV simultaneamente
- Cada arquivo pode conter um cliente diferente
- Interface drag-and-drop para facilitar o upload

### 2. **Validação Automática**
- ✅ Verifica se cada CSV contém apenas 1 CNPJ (1 cliente por arquivo)
- ✅ Valida se o cliente está cadastrado no sistema
- ✅ Detecta automaticamente a competência (mês/ano) pelas datas das notas
- ✅ Identifica competências que já existem no banco

### 3. **Tela de Conferência**
- Preview completo dos dados antes de consolidar
- Visualização detalhada de:
  - Cliente identificado
  - Competências encontradas
  - Quantidade de notas
  - Valor total de faturamento
  - Avisos e erros
- Seleção individual de arquivos para importar
- Opção de substituir competências existentes

### 4. **Consolidação Inteligente**
- Salvamento em lote
- Processamento transacional (rollback em caso de erro)
- Relatório detalhado do resultado

---

## 📝 Formato do CSV Esperado

### Características do Arquivo:

| Característica | Valor Esperado |
|---|---|
| **Separador** | TAB (tabulação) |
| **Encoding** | UTF-8, Latin-1, ISO-8859-1, ou CP1252 |
| **Decimal** | Vírgula (1.790,00) |
| **Data** | DD/MM/YYYY ou DD/MM/YYYY HH:MM |
| **Cabeçalho** | Obrigatório (primeira linha com nomes das colunas) |

### Colunas Essenciais:

O sistema procura as seguintes colunas no cabeçalho:

1. **CPF/CNPJ do Prestador** - Identificação do cliente
2. **Razão Social do Prestador** - Nome do cliente
3. **Valor dos Serviços** - Valor da nota
4. **Data de Competência** ou **Data Hora da Emissão da Nota Fiscal** - Para determinar mês/ano
5. **Nº da Nota Fiscal Eletrônica** - Número da NF
6. **Discriminação dos Serviços** - Descrição (opcional)

### Exemplo de Estrutura (simplificado):

```
Nº da Nota Fiscal Eletrônica	Data Hora da Emissão da Nota Fiscal	CPF/CNPJ do Prestador	Razão Social do Prestador	Valor dos Serviços	Data de Competência	Discriminação dos Serviços
437	26/09/2025 15:52	31.710.936/0001-30	RMG ODONTOLOGIA LTDA	1.790,00	26/09/2025	serviços odontologicos
436	08/09/2025 15:06	31.710.936/0001-30	RMG ODONTOLOGIA LTDA	5.710,92	03/09/2025	serviços odontologicos
```

---

## 🚀 Como Usar

### Passo 1: Preparar os Arquivos

1. Exporte os CSVs da Prefeitura/SEFAZ
2. **Certifique-se que cada CSV contém apenas 1 cliente**
3. Confirme que o cliente está cadastrado no sistema (use a tela de Gerenciar Clientes)

### Passo 2: Upload

1. Acesse **Processar Faturamento**
2. Clique na aba **"Importação via CSV"**
3. Arraste os arquivos ou clique em "Selecionar Arquivos"
4. Selecione um ou mais arquivos CSV
5. Clique em **"Processar X arquivo(s)"**

### Passo 3: Conferência

Após o processamento, você verá:

- 📊 **Resumo Geral**: Total de arquivos, válidos, com erro, faturamento total
- 📁 **Detalhamento por Arquivo**:
  - Cliente identificado
  - Competências encontradas
  - Quantidade de notas
  - Valor total por competência
  - ⚠️ Avisos (ex: competência já existe)
  - ❌ Erros (ex: cliente não cadastrado)

**Opções:**
- ✅ Marque/desmarque arquivos para importar
- ⚙️ Escolha se deseja **substituir competências existentes**

### Passo 4: Consolidação

1. Revise os dados cuidadosamente
2. Ajuste as seleções se necessário
3. Clique em **"Consolidar X arquivo(s)"**
4. Aguarde o processamento
5. Veja o resumo final (sucesso, ignorado, erro)

---

## ⚠️ Avisos Importantes

### ❌ **ERROS COMUNS:**

1. **"Cliente com CNPJ X não está cadastrado"**
   - **Solução:** Cadastre o cliente antes em "Gerenciar Clientes"

2. **"CSV contém X CNPJs diferentes"**
   - **Solução:** Separe o CSV em múltiplos arquivos, um por cliente

3. **"Colunas obrigatórias faltando"**
   - **Solução:** Verifique se o CSV tem o formato correto da Prefeitura

4. **"Competência já existe no sistema"**
   - **Solução:** Marque "Substituir competências existentes" ou ignore o arquivo

### ✅ **BOAS PRÁTICAS:**

1. **Sempre revisar o preview** antes de consolidar
2. **Fazer backup** antes de substituir competências existentes
3. **Testar com 1 arquivo pequeno** antes de processar em lote
4. **Verificar os processamentos recentes** após importação

---

## 🔧 API Endpoints (para desenvolvimento)

### `POST /api/faturamento/upload-preview`
**Request:**
```
Content-Type: multipart/form-data
Body: FormData com chave 'arquivos' contendo os arquivos CSV
```

**Response:**
```json
{
  "arquivos_processados": [
    {
      "id_temporario": "uuid-123",
      "nome_arquivo": "cliente_A.csv",
      "status": "ok",
      "cnpj": "31710936000130",
      "razao_social": "RMG ODONTOLOGIA LTDA",
      "cliente_info": {
        "id": 1,
        "razao_social": "RMG ODONTOLOGIA LTDA",
        "cnpj_formatado": "31.710.936/0001-30"
      },
      "competencias": [
        {
          "mes": 9,
          "ano": 2025,
          "total_notas": 7,
          "faturamento_total": 20081.77,
          "ja_existe": false,
          "faturamento_anterior": 0,
          "notas": [...]
        }
      ],
      "total_notas": 7,
      "total_faturamento": 20081.77,
      "avisos": [],
      "erros": []
    }
  ],
  "resumo": {
    "total_arquivos": 1,
    "arquivos_ok": 1,
    "arquivos_com_erro": 0,
    "total_importar": 20081.77
  }
}
```

### `POST /api/faturamento/consolidar`
**Request:**
```json
{
  "arquivos": [...], // Dados do preview
  "opcoes": {
    "substituir_existente": false
  }
}
```

**Response:**
```json
{
  "resultados": [
    {
      "arquivo": "cliente_A.csv",
      "competencia": "09/2025",
      "status": "sucesso",
      "mensagem": "7 notas importadas",
      "faturamento_total": 20081.77
    }
  ],
  "resumo": {
    "total_processado": 1,
    "sucesso": 1,
    "erro": 0,
    "ignorado": 0
  }
}
```

---

## 🐛 Troubleshooting

### Problema: Timeout ao processar arquivos grandes
**Solução:** Divida em múltiplos arquivos menores (máx 500 notas por arquivo)

### Problema: Encoding incorreto (caracteres estranhos)
**Solução:** O sistema tenta UTF-8, Latin-1, ISO-8859-1, CP1252 automaticamente. Se ainda houver problema, re-exporte o CSV com encoding UTF-8.

### Problema: Datas inválidas
**Solução:** Verifique se as datas estão no formato DD/MM/YYYY ou YYYY-MM-DD

### Problema: Valores não são somados corretamente
**Solução:** Verifique se os valores usam vírgula como separador decimal (1.234,56)

---

## 📚 Estrutura Técnica

### Backend:
- **`backend/app/csv_parser.py`** - Parser de CSV específico para NF-e
- **`backend/app/routes.py`** - Endpoints `/api/faturamento/upload-preview` e `/consolidar`

### Frontend:
- **`frontend/src/components/ImportacaoCSV.jsx`** - Componente de upload
- **`frontend/src/components/PreviewImportacao.jsx`** - Componente de conferência
- **`frontend/src/services/importacaoApi.js`** - API calls
- **`frontend/src/pages/FaturamentoPage.jsx`** - Página principal (com abas)

---

## 🎉 Benefícios

✅ **Economia de tempo:** Importa centenas de notas em segundos
✅ **Redução de erros:** Validação automática e detecção de problemas
✅ **Rastreabilidade:** Mantém todas as notas detalhadas no banco
✅ **Segurança:** Preview obrigatório antes de salvar
✅ **Flexibilidade:** Suporta múltiplos clientes e competências de uma vez

