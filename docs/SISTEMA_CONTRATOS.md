# Sistema de Contratos - Documentação Completa

## 📋 Visão Geral

O Sistema de Contratos foi desenvolvido para automatizar a criação de contratos societários, utilizando templates inteligentes com substituição automática de variáveis baseadas nos dados cadastrados de empresas (PJ) e pessoas físicas (PF).

## ✨ Funcionalidades Principais

### 1. **Templates Pré-configurados**
- ✅ Contrato Social - Sociedade Limitada
- ✅ Alteração Contratual - Mudanças Diversas
- ✅ Extinção - Sociedade Limitada Unipessoal
- ✅ Extinção de Empresário Individual
- ✅ Distrato de Sociedade - Dissolução Total
- ✅ Entrada de Novo Sócio

### 2. **Wizard de Criação (3 Passos)**
- **Passo 1:** Seleção do Tipo de Contrato
- **Passo 2:** Seleção de Empresa e Sócios
- **Passo 3:** Preview e Finalização

### 3. **Preenchimento Automático**
O sistema preenche automaticamente:
- Dados da empresa (razão social, CNPJ, endereço, etc.)
- Dados dos sócios (nome, CPF, RG, estado civil, regime de comunhão, endereço)
- Datas formatadas por extenso
- Valores monetários formatados

### 4. **Sistema de Variáveis**

#### Variáveis de Empresa:
- `{{empresa_razao_social}}`
- `{{empresa_nome_fantasia}}`
- `{{empresa_cnpj}}`
- `{{empresa_endereco_completo}}`
- `{{empresa_objeto_social}}`
- `{{empresa_cnaes}}`
- `{{empresa_data_abertura}}`
- `{{empresa_capital_social}}`
- `{{empresa_regime_tributario}}`

#### Variáveis de Sócio (numeradas):
- `{{socio_1_nome}}`, `{{socio_2_nome}}`, etc.
- `{{socio_1_cpf}}`, `{{socio_2_cpf}}`, etc.
- `{{socio_1_rg}}`, `{{socio_2_rg}}`, etc.
- `{{socio_1_nacionalidade}}`
- `{{socio_1_estado_civil}}`
- `{{socio_1_regime_comunhao}}`
- `{{socio_1_endereco_completo}}`
- `{{socio_1_percentual}}`

#### Variáveis Gerais:
- `{{cidade_contrato}}`
- `{{uf_contrato}}`
- `{{data_atual}}`

## 🗂️ Estrutura do Banco de Dados

### Tabela `template_contrato`
```sql
- id: Integer (PK)
- tipo: String(100) - Tipo do template
- nome: String(200) - Nome do template
- descricao: Text - Descrição
- conteudo: Text - Template com variáveis
- variaveis_requeridas: Text (JSON) - Lista de variáveis obrigatórias
- ativo: Boolean - Se está ativo
- versao: String(20) - Versão do template
- data_criacao: DateTime
- data_atualizacao: DateTime
- usuario_criacao_id: Integer (FK)
```

### Tabela `contrato`
```sql
- id: Integer (PK)
- template_id: Integer (FK)
- empresa_id: Integer (FK) - Empresa relacionada
- numero_contrato: String(50) - Número único (CONT-2025-0001)
- titulo: String(300) - Título do contrato
- tipo: String(100) - Tipo do contrato
- conteudo_gerado: Text - Contrato final
- dados_variaveis: Text (JSON) - Dados usados
- socios_envolvidos: Text (JSON) - IDs dos sócios
- status: String(50) - rascunho, finalizado, arquivado
- observacoes: Text
- data_criacao: DateTime
- data_finalizacao: DateTime
- usuario_criacao_id: Integer (FK)
```

## 🔧 API Endpoints

### Templates
- `GET /api/contratos/templates` - Lista todos os templates
- `GET /api/contratos/templates/<id>` - Obtém template específico

### Contratos
- `GET /api/contratos` - Lista contratos (com filtros)
- `GET /api/contratos/<id>` - Obtém contrato específico
- `POST /api/contratos` - Cria novo contrato
- `PUT /api/contratos/<id>` - Atualiza contrato
- `DELETE /api/contratos/<id>` - Deleta contrato (move para lixeira)

#### Filtros Disponíveis:
- `tipo` - Filtra por tipo de contrato
- `status` - Filtra por status
- `empresa_id` - Filtra por empresa
- `busca` - Busca em título e número

## 📱 Interface do Usuário

### Página de Contratos (`/app/contratos`)
- Listagem de todos os contratos
- Filtros por tipo, status e busca
- Estatísticas (total, rascunhos, finalizados)
- Ações: Visualizar, Editar, Excluir

### Wizard de Criação
Interface intuitiva em 3 passos com progress bar:
1. Escolha do template
2. Seleção de empresa e sócios
3. Preenchimento e preview

### Modal de Visualização
- Visualização do contrato final
- Edição inline
- Download em formato TXT
- Finalização do contrato

## 🎨 Formatações Automáticas

O sistema aplica automaticamente:

### Datas:
- `2025-10-20` → `20 de outubro de 2025`

### Valores Monetários:
- `5000.00` → `5.000,00`

### Estado Civil:
- `solteiro` → `solteiro(a)`
- `casado` → `casado(a)`
- `divorciado` → `divorciado(a)`
- `viuvo` → `viúvo(a)`

### Regime de Comunhão:
- `comunhao_parcial` → `Comunhão Parcial de Bens`
- `comunhao_universal` → `Comunhão Universal de Bens`
- `separacao_total` → `Separação Total de Bens`
- `separacao_obrigatoria` → `Separação Obrigatória de Bens`
- `participacao_final` → `Participação Final nos Aquestos`

## 🚀 Como Usar

### 1. Criar um Novo Contrato

```javascript
1. Acesse /app/contratos
2. Clique em "+ Novo Contrato"
3. Selecione o tipo de contrato desejado
4. Escolha a empresa e sócios (se aplicável)
5. Preencha o título e observações
6. Revise o preview
7. Clique em "Criar Contrato"
```

### 2. Visualizar e Editar Contrato

```javascript
1. Na listagem, clique no ícone de olho
2. Visualize o contrato gerado
3. Clique em "Editar" para fazer ajustes
4. Salve as alterações
5. Baixe em TXT se necessário
```

### 3. Gerenciar Contratos

```javascript
- Use filtros para encontrar contratos específicos
- Status: rascunho, finalizado, arquivado
- Tipo: contrato social, alteração, extinção, etc.
- Empresa: filtre por empresa específica
```

## 📊 Logs e Auditoria

Todas as ações são registradas:
- Criação de contratos
- Atualizações
- Exclusões
- Usuário responsável
- Data e hora
- IP do usuário

## 🔒 Segurança

- ✅ Autenticação JWT obrigatória
- ✅ Validação de dados
- ✅ Proteção contra SQL Injection
- ✅ Logs de auditoria
- ✅ Lixeira para recuperação

## 💡 Melhorias Futuras Sugeridas

1. **Geração de PDF**
   - Formatação profissional
   - Logo do escritório
   - Numeração de páginas

2. **Assinatura Digital**
   - Integração com certificado digital
   - Validação de assinaturas

3. **Editor de Templates (Admin)**
   - Interface para criar/editar templates
   - Autocomplete de variáveis
   - Preview em tempo real

4. **Versionamento**
   - Histórico de alterações
   - Comparação entre versões
   - Restauração de versões antigas

5. **Exportação em Múltiplos Formatos**
   - PDF, DOCX, ODT
   - Formatação personalizada

6. **Notificações**
   - Email quando contrato é criado
   - Lembrete de revisão
   - Alerta de vencimento

## 📝 Scripts Úteis

### Popular Templates:
```bash
cd backend
python popular_templates_contratos.py
```

### Migração do Banco:
```bash
.\backend\migrate.bat upgrade
```

## 🎯 Status da Implementação

✅ **Completo e Funcional**
- Modelos de dados
- Migrations
- API Backend
- Templates pré-cadastrados
- Sistema de variáveis e substituição
- Interface completa
- Wizard de criação
- Visualização e edição
- Integração com dados existentes

## 📞 Suporte

Para dúvidas ou sugestões sobre o Sistema de Contratos, consulte a documentação completa ou entre em contato com a equipe de desenvolvimento.

---

**Versão:** 1.0  
**Data:** Outubro 2025  
**Desenvolvido para:** Sistema Contábil

