# 📘 Sistema Contábil - Guia do Usuário

## 🎯 Como Usar o Sistema

### 1️⃣ Instalação (Primeira Vez)

1. **Instale o Python:**
   - Acesse: https://www.python.org/downloads/
   - Baixe a versão 3.8 ou superior
   - ⚠️ **IMPORTANTE:** Marque a opção "Add Python to PATH" durante a instalação

2. **Execute o Instalador:**
   - Dê duplo clique em: `INSTALACAO.bat`
   - Aguarde a instalação completa (5-10 minutos)

### 2️⃣ Uso Diário

**Para Abrir o Sistema:**
- Dê duplo clique em: `iniciar_sistema.bat`
- O sistema abrirá automaticamente no navegador
- Acesse: http://localhost:5000

**Para Fechar o Sistema:**
- Feche a janela preta (terminal) que apareceu
- OU dê duplo clique em: `parar_sistema.bat`

### 3️⃣ Primeiro Acesso

**Login Padrão:**
- Email: `admin@contabil.com`
- Senha: `admin123`

⚠️ **ALTERE A SENHA** após o primeiro login!

## 📋 Funcionalidades Principais

### 🏢 Gerenciar Clientes

1. No menu principal, clique em **"Gerenciar Clientes"**
2. Clique em **"+ Adicionar Cliente"**
3. Digite apenas o **CNPJ** (os dados são preenchidos automaticamente)
4. Revise e salve

**Importação em Lote:**
- Prepare um arquivo CSV com os CNPJs
- Clique em "Importar CNPJs via CSV"
- Selecione o arquivo
- Revise e confirme

### 💰 Processar Faturamento

1. No menu principal, clique em **"Processar Faturamento"**
2. Prepare um arquivo CSV com as colunas:
   - `CNPJ` - CNPJ do cliente (com ou sem pontuação)
   - `Mes` - Mês (1 a 12)
   - `Ano` - Ano (ex: 2024)
   - `Faturamento` - Valor do faturamento

**Exemplo de CSV:**
```csv
CNPJ,Mes,Ano,Faturamento
12.345.678/0001-90,1,2024,50000
98.765.432/0001-10,1,2024,75000
```

3. Clique em **"Selecionar Arquivo CSV"**
4. Escolha seu arquivo
5. Revise os dados no preview
6. Clique em **"Consolidar Dados"**

### 📊 Gerar Relatórios

1. No menu principal, clique em **"Gerar Relatórios"**
2. Selecione o cliente
3. Defina o período (mês/ano inicial e final)
4. Clique em **"Gerar Relatório"**

**O relatório mostra:**
- Faturamento total do período
- Impostos calculados
- Alíquota efetiva média
- Gráficos de evolução

### 📈 Dashboard Analítico (Opcional)

- Link disponível no menu principal
- Visualizações avançadas com Streamlit
- Análises comparativas entre clientes

## ❓ Problemas Comuns

### ❌ "Python não encontrado"
**Solução:** 
- Instale o Python: https://www.python.org/downloads/
- Marque "Add Python to PATH" na instalação
- Reinicie o computador

### ❌ "Frontend não foi buildado"
**Solução:**
- Instale o Node.js: https://nodejs.org/
- Execute: `python build_frontend.py`

### ❌ Sistema não abre no navegador
**Solução:**
- Abra manualmente: http://localhost:5000
- Verifique se não há outro programa usando a porta 5000

### ❌ Erro ao importar CSV
**Solução:**
- Verifique se o CSV está no formato correto
- Certifique-se de que o cliente está cadastrado
- Confira se os dados estão completos (CNPJ, Mês, Ano, Faturamento)

### ❌ Login não funciona
**Solução:**
- Use as credenciais padrão: `admin@contabil.com` / `admin123`
- Se alterou e esqueceu, execute: `python setup_inicial.py` (recria o usuário)

## 🔒 Segurança

- Altere a senha padrão imediatamente
- Não compartilhe o arquivo `.env` do backend
- Faça backup regular do arquivo `sistema_contabil.db`

## 💾 Backup dos Dados

**Localização do Banco de Dados:**
```
backend/sistema_contabil.db
```

**Como fazer backup:**
1. Feche o sistema
2. Copie o arquivo `sistema_contabil.db`
3. Guarde em local seguro

**Como restaurar backup:**
1. Feche o sistema
2. Substitua o arquivo `sistema_contabil.db` pelo backup
3. Reinicie o sistema

## 📞 Suporte

Em caso de problemas:
1. Verifique as soluções acima
2. Anote a mensagem de erro completa
3. Entre em contato com o desenvolvedor

---

**Versão do Sistema:** 1.0  
**Última Atualização:** Outubro 2024

