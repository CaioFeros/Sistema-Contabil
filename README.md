# Sistema Contábil - Versão Completa

Sistema completo de gestão contábil com funcionalidades avançadas de contratos e relatórios personalizados.

## 🚀 Funcionalidades Principais

### 📊 Gestão de Clientes
- **Pessoa Jurídica**: Cadastro completo de empresas com CNPJ, razão social, endereço, etc.
- **Pessoa Física**: Cadastro de pessoas físicas com CPF, RG, dados pessoais completos
- **Separação de Dados**: Tabelas independentes para PJ e PF para melhor organização

### 📝 Sistema de Contratos
- **Contrato Social**: Criação de contratos sociais completos
- **Alteração Contratual**: Modificações em contratos existentes
- **Extinção**: Processo de extinção de empresas (unipessoal e individual)
- **Distrato/Dissolução**: Dissolução de sociedades
- **Entrada de Sócio**: Adição de novos sócios
- **Contrato Custom**: Criação de contratos personalizados

### 📋 Ferramenta de Relatórios
- **Editor Rico**: Editor de texto com formatação completa (negrito, itálico, tamanho, alinhamento)
- **Variáveis Dinâmicas**: Sistema de variáveis que substitui dados automaticamente
- **Seleção de Referências**: Escolha empresa e/ou pessoa física para aplicar dados
- **Geração de PDF**: Criação de PDFs profissionais com dados reais aplicados
- **Templates Salvos**: Sistema de templates reutilizáveis

### 🔧 Funcionalidades Técnicas
- **Autenticação JWT**: Sistema seguro de login
- **Auditoria Completa**: Log de todas as ações do sistema
- **Migrações**: Sistema de migração de banco de dados
- **API RESTful**: Backend completo com endpoints organizados
- **Interface Moderna**: Frontend responsivo com tema escuro/claro

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.11+**
- **Flask**: Framework web
- **SQLAlchemy**: ORM para banco de dados
- **Alembic**: Migrações de banco
- **JWT**: Autenticação
- **SQLite**: Banco de dados (desenvolvimento)

### Frontend
- **React 18**: Biblioteca de interface
- **Vite**: Build tool moderno
- **Tailwind CSS**: Framework CSS
- **Lucide React**: Ícones
- **Axios**: Cliente HTTP

## 📦 Instalação e Configuração

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/sistema-contabil.git
cd sistema-contabil
```

### 2. Configuração do Backend
```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows)
venv\Scripts\activate

# Ativar ambiente virtual (Linux/Mac)
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar migrações
flask db upgrade

# Popular com dados de demonstração
python popular_dados_demo.py
```

### 3. Configuração do Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Build para produção
npm run build
```

### 4. Executar o Sistema
```bash
# No diretório backend
python run.py
```

O sistema estará disponível em: `http://localhost:5000`

## 🎯 Dados de Demonstração

O sistema inclui dados fictícios para demonstração:

### Empresas de Exemplo
- **Tech Solutions LTDA**: Empresa de tecnologia
- **Consultoria Empresarial ME**: Consultoria empresarial

### Pessoas Físicas de Exemplo
- **João Silva Santos**: Pessoa física com dados completos
- **Maria Oliveira Costa**: Pessoa física solteira

### Templates de Relatório
- **Relatório de Análise Financeira**: Template com variáveis de empresa
- **Contrato de Prestação de Serviços**: Template com variáveis de empresa e PF

## 📚 Como Usar

### 1. Login
- Use as credenciais do usuário demo criado
- Ou crie um novo usuário através do sistema

### 2. Criar Templates de Relatório
1. Acesse "Ferramenta de Criação de Relatórios"
2. Clique em "Novo Template"
3. Use o editor rico para formatar o texto
4. Insira variáveis usando as ferramentas disponíveis
5. Salve o template

### 3. Gerar PDFs
1. Na lista de templates, clique em "Gerar Relatório"
2. Selecione a empresa e/ou pessoa física de referência
3. Visualize o preview com dados aplicados
4. Clique em "Gerar PDF" para imprimir/salvar

### 4. Gerenciar Contratos
1. Acesse "Contratos"
2. Use "Novo Contrato" para criar contratos específicos
3. Selecione o tipo de contrato desejado
4. Preencha os dados necessários
5. Gere o PDF final

## 🔧 Variáveis Disponíveis

### Empresa (Pessoa Jurídica)
- `{{razao_social}}` - Razão social da empresa
- `{{nome_fantasia}}` - Nome fantasia
- `{{cnpj}}` - CNPJ
- `{{capital_social}}` - Capital social
- `{{cnae_principal}}` - CNAE principal
- `{{endereco_completo}}` - Endereço formatado
- `{{regime_tributario}}` - Regime tributário
- `{{telefone1}}`, `{{telefone2}}` - Telefones
- `{{email}}` - Email
- E muitos outros campos...

### Pessoa Física
- `{{nome_completo}}` - Nome completo
- `{{cpf}}` - CPF
- `{{rg}}` - RG
- `{{data_nascimento}}` - Data de nascimento
- `{{estado_civil}}` - Estado civil
- `{{endereco_completo_pf}}` - Endereço formatado
- `{{telefone1_pf}}`, `{{telefone2_pf}}` - Telefones
- `{{email_pf}}` - Email
- E outros campos...

## 📁 Estrutura do Projeto

```
sistema-contabil/
├── backend/                 # Backend Flask
│   ├── app/                # Aplicação principal
│   │   ├── models.py       # Modelos do banco
│   │   ├── routes.py       # Rotas da API
│   │   └── ...
│   ├── migrations/         # Migrações do banco
│   ├── popular_dados_demo.py # Script de dados demo
│   └── requirements.txt    # Dependências Python
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços de API
│   │   └── ...
│   └── package.json        # Dependências Node.js
├── docs/                   # Documentação
└── README.md              # Este arquivo
```

## 🔒 Segurança

- **Autenticação JWT**: Tokens seguros para autenticação
- **Auditoria**: Log completo de todas as ações
- **Validação**: Validação de dados em frontend e backend
- **Sanitização**: Proteção contra XSS e outros ataques

## 📈 Funcionalidades Avançadas

### Editor de Texto Rico
- Formatação em tempo real
- Negrito, itálico, sublinhado
- Controle de tamanho da fonte
- Alinhamento de texto
- Listas com marcadores e numeradas

### Sistema de Variáveis
- Substituição automática de dados
- Preview em tempo real
- Validação de dados existentes
- Formatação inteligente de endereços

### Geração de PDF
- Layout profissional
- Preservação de formatação
- Dados reais aplicados
- Cabeçalho e rodapé automáticos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no repositório ou entre em contato através do email do projeto.

---

**Desenvolvido com ❤️ para facilitar a gestão contábil empresarial**