# 🗄️ Banco de Dados de Demonstração

## 📌 Importante

**Este banco de dados contém apenas dados FICTÍCIOS para demonstração.**

Nenhum dado real de clientes está incluído neste repositório.

---

## 🎯 Propósito

Este banco de demonstração foi criado para:
- ✅ Permitir que desenvolvedores testem o sistema
- ✅ Facilitar a contribuição ao projeto
- ✅ Demonstrar as funcionalidades do sistema
- ✅ Proteger a privacidade dos clientes reais

---

## 📦 Conteúdo do Banco Demo

### Usuários (2)
- **Admin**: username: `admin`, senha: `admin123`
- **User**: username: `usuario`, senha: `usuario123`

### Contadores (2)
1. **João Silva Contador**
   - CRC: CRC/SP 123456
   - Email: joao.silva@contabilidade.com

2. **Maria Oliveira Santos**
   - CRC: CRC/RJ 654321
   - Email: maria.oliveira@contabilidade.com

### Clientes (5)
1. **TechStart Inovações Ltda**
   - CNPJ: 12.345.678/0001-90
   - Regime: Simples Nacional
   - Honorários: R$ 850,00

2. **Comercial BomPreço S.A.**
   - CNPJ: 23.456.789/0001-01
   - Regime: Lucro Real
   - Honorários: R$ 2.500,00

3. **Consultoria Excelência EIRELI**
   - CNPJ: 34.567.890/0001-12
   - Regime: Lucro Presumido
   - Honorários: R$ 1.200,00

4. **Indústria MecânicaPro Ltda**
   - CNPJ: 45.678.901/0001-23
   - Regime: Lucro Presumido
   - Honorários: R$ 1.800,00

5. **Serviços Digitais Web ME**
   - CNPJ: 56.789.012/0001-34
   - Regime: Simples Nacional
   - Honorários: R$ 650,00

### Dados Adicionais
- Faturamentos exemplo para 2 clientes (Janeiro/2025)
- Recibos exemplo emitidos

---

## 🚀 Como Usar

### Opção 1: Criar Banco Demo do Zero

```bash
cd backend
python seed_github.py
```

Este comando irá:
1. Criar um novo arquivo `sistema_contabil_demo.db`
2. Popular com todos os dados fictícios
3. Não afetar seu banco de dados atual

### Opção 2: Usar Manualmente

Se você já tem o sistema configurado:

1. **Faça backup do seu banco atual** (se existir):
   ```bash
   copy sistema_contabil.db sistema_contabil_backup.db
   ```

2. **Renomeie o banco demo**:
   ```bash
   copy sistema_contabil_demo.db sistema_contabil.db
   ```

3. **Inicie o sistema**:
   ```bash
   cd ..
   iniciar_sistema.bat
   ```

4. **Acesse com as credenciais**:
   - Username: `admin`
   - Senha: `admin123`

---

## 🔒 Segurança

### O que está INCLUÍDO no repositório:
- ✅ Estrutura do banco (migrations)
- ✅ Scripts de seed com dados fictícios
- ✅ Documentação

### O que NÃO está incluído:
- ❌ Banco de dados real (`*.db` está no `.gitignore`)
- ❌ Dados de clientes reais
- ❌ Informações confidenciais
- ❌ Variáveis de ambiente (`.env`)

---

## 📝 Arquivos Relacionados

```
backend/
├── seed_github.json        # Dados fictícios em JSON
├── seed_github.py          # Script para criar banco demo
├── README_BANCO_DEMO.md    # Este arquivo
└── sistema_contabil_demo.db  # Banco gerado (não commitado)
```

---

## 🧪 Para Desenvolvedores

### Adicionar Mais Dados de Exemplo

1. Edite `seed_github.json`
2. Adicione novos clientes, contadores, etc.
3. Execute `python seed_github.py`

### Formato do JSON

```json
{
  "usuarios": [
    {
      "username": "user",
      "email": "user@example.com",
      "senha": "senha123",
      "nome": "Nome Completo",
      "papel": "USER"
    }
  ],
  "contadores": [...],
  "clientes": [...],
  "processamentos_exemplo": [...],
  "recibos_exemplo": [...]
}
```

---

## ⚠️ Avisos Importantes

### Para Usuários do Sistema

Se você é um **usuário real** deste sistema:
- **NÃO use o banco demo em produção**
- **Sempre faça backup** do seu banco antes de qualquer alteração
- **Use apenas** o `seed_github.py` para testes ou desenvolvimento

### Para Contribuidores

Ao contribuir com o projeto:
- **Nunca comite** arquivos `.db` reais
- **Use sempre** dados fictícios em exemplos
- **Teste com** o banco demo antes de submeter PR
- **Documente** qualquer mudança no schema

---

## 🔄 Resetar para Banco Demo

Se você fez muitas alterações e quer voltar ao estado inicial:

```bash
cd backend
del sistema_contabil.db         # Remove banco atual
python seed_github.py           # Recria banco demo
copy sistema_contabil_demo.db sistema_contabil.db  # Usa o demo
```

---

## 📞 Suporte

Se tiver problemas com o banco demo:
1. Verifique se tem Python instalado
2. Verifique se instalou as dependências: `pip install -r requirements.txt`
3. Verifique se está no diretório correto (`backend/`)
4. Confira os logs de erro para mais detalhes

---

## ✨ Contribuições

Sugestões de melhorias para o banco demo são bem-vindas!
- Adicionar mais clientes exemplo
- Incluir mais faturamentos
- Adicionar cenários de teste específicos

---

**Última atualização**: Outubro 2025  
**Versão do Banco Demo**: 1.0

