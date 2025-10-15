# 🚀 Como Usar o Sistema Diariamente

## 📌 Acesso Rápido (Após Reiniciar o PC)

### **Opção 1: Usando o Script BAT (Mais Fácil)** ⭐

1. Navegue até a pasta do projeto: `D:\Dev\Sistema-Contabil`
2. Dê duplo clique em: **`iniciar_sistema.bat`**
3. Aguarde a janela preta abrir
4. O navegador abrirá automaticamente em `http://localhost:5000`

### **Opção 2: Usando Python**

1. Abra o terminal (PowerShell ou CMD)
2. Execute:
   ```bash
   cd D:\Dev\Sistema-Contabil
   python iniciar_sistema.py
   ```
3. Acesse: `http://localhost:5000`

---

## 🔐 Credenciais de Acesso

```
Email: admin@contabil.com
Senha: admin123
```

⚠️ **Importante**: Altere a senha após o primeiro login!

---

## 🛑 Como Parar o Sistema

**Opção 1: Fechar a Janela**
- Simplesmente feche a janela preta (terminal) que abriu

**Opção 2: Ctrl+C**
- Na janela preta, pressione `Ctrl + C`

**Opção 3: Script**
- Dê duplo clique em `parar_sistema.bat`

---

## 📋 Fluxo de Trabalho Diário

### **1. Iniciar o Sistema**
```bash
# Duplo clique em:
iniciar_sistema.bat
```

### **2. Fazer Login**
- Acesse: http://localhost:5000
- Use suas credenciais

### **3. Trabalhar Normalmente**
- Cadastrar clientes
- Processar faturamentos
- Gerar relatórios

### **4. Encerrar o Dia**
- Feche a janela do terminal
- Seus dados ficam salvos no arquivo `backend/sistema_contabil.db`

---

## 💾 Backup dos Dados

### **Onde Está o Banco de Dados?**
```
D:\Dev\Sistema-Contabil\backend\sistema_contabil.db
```

### **Como Fazer Backup?**

**Diariamente (Recomendado):**
1. Feche o sistema (pare o servidor)
2. Copie o arquivo `sistema_contabil.db`
3. Cole em uma pasta de backup (ex: `D:\Backup\Sistema-Contabil\`)
4. Renomeie com a data: `sistema_contabil_2024-10-13.db`

**Script Automático de Backup (Futuro):**
- Podemos criar um script que faz backup automático ao fechar o sistema

### **Como Restaurar Backup?**
1. Feche o sistema
2. Delete o arquivo `sistema_contabil.db` atual
3. Copie o backup desejado para `backend/`
4. Renomeie para `sistema_contabil.db`
5. Inicie o sistema novamente

---

## ⚙️ Configurações Avançadas

### **Alterar Porta do Servidor**

Edite `backend/run.py`:
```python
app.run(host='0.0.0.0', port=5000)  # Mude 5000 para outra porta
```

### **Alterar Senha do Admin**

Use o próprio sistema ou rode:
```bash
cd backend
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('SUA_NOVA_SENHA'))"
```

---

## 🔧 Solução de Problemas

### ❌ **"Porta 5000 em uso"**
**Solução:**
1. Feche todos os terminais abertos
2. Abra Gerenciador de Tarefas
3. Finalize processos `python.exe`
4. Tente novamente

### ❌ **"Backend está rodando. Build do frontend não encontrado"**
**Solução:**
```bash
python build_frontend.py
```

### ❌ **"Arquivo .env não encontrado"**
**Solução:**
```bash
python setup_inicial.py
```

### ❌ **Sistema lento ou travando**
**Solução:**
1. Feche o sistema
2. Faça backup do banco
3. Delete arquivos `.log` se houver
4. Reinicie o sistema

---

## 📱 Acesso de Outros Dispositivos (Rede Local)

### **Descobrir IP da Máquina**
```bash
ipconfig
# Procure por "IPv4" (ex: 192.168.1.100)
```

### **Configurar Acesso Externo**

1. Edite `backend/.env`:
   ```env
   FRONTEND_URL=http://192.168.1.100:5000
   ```

2. Edite `backend/run.py`:
   ```python
   app.run(host='0.0.0.0', port=5000)  # 0.0.0.0 permite acesso externo
   ```

3. Outros dispositivos acessam: `http://192.168.1.100:5000`

⚠️ **Atenção**: Libere a porta 5000 no Firewall do Windows

---

## 🚀 Atalho Rápido (Criar Ícone na Área de Trabalho)

1. Botão direito na Área de Trabalho > Novo > Atalho
2. Caminho: `D:\Dev\Sistema-Contabil\iniciar_sistema.bat`
3. Nome: "Sistema Contábil"
4. Pronto! Agora é só clicar no ícone

---

## 📞 Comandos Úteis

```bash
# Iniciar sistema
python iniciar_sistema.py

# Fazer backup do banco
copy backend\sistema_contabil.db backup\sistema_$(date +%Y%m%d).db

# Verificar se o servidor está rodando
curl http://localhost:5000/api/clientes

# Limpar cache Python (se houver problemas)
rd /s /q backend\__pycache__
rd /s /q backend\app\__pycache__
```

---

## 📚 Mais Informações

- **README.md**: Documentação técnica completa
- **INSTRUCOES_USUARIO.md**: Guia de funcionalidades
- **CHANGELOG.md**: Histórico de mudanças

---

**Versão**: 1.0.0  
**Última Atualização**: Outubro 2024  
**Suporte**: Mantenha backup diário dos dados!

