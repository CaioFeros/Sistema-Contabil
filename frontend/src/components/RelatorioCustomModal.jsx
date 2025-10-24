import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, FileText, Plus, BarChart3 } from 'lucide-react';
import { criarTemplateRelatorio, atualizarTemplateRelatorio } from '../services/templateRelatorioService';
import RichTextEditor from './RichTextEditor';

const RelatorioCustomModal = ({ onClose, onSuccess, templateExistente = null, modoEdicao = false }) => {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dadosRelatorio, setDadosRelatorio] = useState({
    titulo: templateExistente?.titulo || '',
    conteudo: templateExistente?.conteudo || '',
    tipo: templateExistente?.tipo || 'relatorio_custom'
  });
  
  // Estados para ferramentas do relatório custom
  const [variavelEmpresaSelecionada, setVariavelEmpresaSelecionada] = useState('');
  const [variavelPFSelecionada, setVariavelPFSelecionada] = useState('');
  const [erroVariavel, setErroVariavel] = useState('');
  
  const [conteudoPreview, setConteudoPreview] = useState('');
  const [erro, setErro] = useState('');

  // Gera preview quando dados mudam
  useEffect(() => {
    gerarPreview();
  }, [dadosRelatorio]);

  // Função auxiliar para construir endereço completo no formato correto
  const construirEnderecoCompleto = (dados) => {
    const partes = [];
    
    // Logradouro + Número
    if (dados.logradouro && dados.numero) {
      partes.push(`${dados.logradouro.toUpperCase()}, ${dados.numero.padStart(5, '0')}`);
    } else if (dados.logradouro) {
      partes.push(dados.logradouro.toUpperCase());
    }
    
    // Complemento
    if (dados.complemento) {
      partes.push(dados.complemento.toUpperCase());
    }
    
    // Bairro
    if (dados.bairro) {
      partes.push(dados.bairro.toUpperCase());
    }
    
    // Município + UF
    if (dados.municipio && dados.uf) {
      partes.push(`${dados.municipio.toUpperCase()}, - ${dados.uf.toUpperCase()}`);
    } else if (dados.municipio) {
      partes.push(dados.municipio.toUpperCase());
    }
    
    // CEP
    if (dados.cep) {
      partes.push(`CEP: ${dados.cep}`);
    }
    
    return partes.join(', ') + '.';
  };

  // Funções para inserir variáveis no relatório custom
  const inserirVariavelEmpresa = () => {
    if (!variavelEmpresaSelecionada) return;
    
    // Limpa erro se tudo estiver ok
    setErroVariavel('');
    
    // Insere apenas a variável, sem o valor
    const textoAtual = dadosRelatorio.conteudo;
    const novoTexto = textoAtual + `{{${variavelEmpresaSelecionada}}}`;
    setDadosRelatorio(prev => ({ ...prev, conteudo: novoTexto }));
  };

  const inserirVariavelPF = () => {
    if (!variavelPFSelecionada) return;
    
    // Limpa erro se tudo estiver ok
    setErroVariavel('');
    
    // Insere apenas a variável, sem o valor
    const textoAtual = dadosRelatorio.conteudo;
    const novoTexto = textoAtual + `{{${variavelPFSelecionada}}}`;
    setDadosRelatorio(prev => ({ ...prev, conteudo: novoTexto }));
  };

  const gerarPreview = () => {
    if (!dadosRelatorio.conteudo) {
      setConteudoPreview('');
      return;
    }

    // Prepara dados de exemplo para preview
    const dadosExemplo = prepararDadosVariaveisExemplo();
    
    let preview = dadosRelatorio.conteudo;
    
    // Substitui variáveis por dados de exemplo
    Object.keys(dadosExemplo).forEach(variavel => {
      const regex = new RegExp(`{{${variavel}}}`, 'g');
      preview = preview.replace(regex, dadosExemplo[variavel]);
    });
    
    setConteudoPreview(preview);
  };

  const prepararDadosVariaveisExemplo = () => {
    return {
      // Dados da empresa (exemplo)
      razao_social: '[RAZÃO SOCIAL DA EMPRESA]',
      nome_fantasia: '[NOME FANTASIA]',
      cnpj: '[00.000.000/0000-00]',
      capital_social: '[R$ 0.000,00]',
      cnae_principal: '[CNAE PRINCIPAL]',
      endereco_completo: '[ENDEREÇO COMPLETO DA EMPRESA]',
      regime_tributario: '[REGIME TRIBUTÁRIO]',
      data_abertura: '[00/00/0000]',
      situacao_cadastral: '[SITUAÇÃO CADASTRAL]',
      natureza_juridica: '[NATUREZA JURÍDICA]',
      porte: '[PORTE DA EMPRESA]',
      telefone1: '[TELEFONE 1]',
      telefone2: '[TELEFONE 2]',
      email: '[EMAIL DA EMPRESA]',
      logradouro: '[LOGRADOURO]',
      numero: '[000]',
      complemento: '[COMPLEMENTO]',
      bairro: '[BAIRRO]',
      municipio: '[MUNICÍPIO]',
      uf: '[UF]',
      cep: '[00000-000]',
      
      // Dados da pessoa física (exemplo)
      nome_completo: '[NOME COMPLETO DA PESSOA]',
      cpf: '[000.000.000-00]',
      rg: '[000000000]',
      data_nascimento: '[00/00/0000]',
      estado_civil: '[ESTADO CIVIL]',
      regime_comunhao: '[REGIME DE COMUNHÃO]',
      endereco_completo_pf: '[ENDEREÇO COMPLETO DA PESSOA]',
      telefone1_pf: '[TELEFONE 1]',
      telefone2_pf: '[TELEFONE 2]',
      email_pf: '[EMAIL DA PESSOA]',
      logradouro_pf: '[LOGRADOURO]',
      numero_pf: '[000]',
      complemento_pf: '[COMPLEMENTO]',
      bairro_pf: '[BAIRRO]',
      municipio_pf: '[MUNICÍPIO]',
      uf_pf: '[UF]',
      cep_pf: '[00000-000]',
      
      // Dados gerais
      data_atual: new Date().toLocaleDateString('pt-BR')
    };
  };

  const handleAvancar = () => {
    if (etapaAtual === 1) {
      if (!dadosRelatorio.titulo.trim()) {
        setErro('Por favor, informe o título do relatório.');
        return;
      }
      if (!dadosRelatorio.conteudo.trim()) {
        setErro('Por favor, adicione conteúdo ao relatório.');
        return;
      }
      setErro('');
      setEtapaAtual(2);
    } else if (etapaAtual === 2) {
      // Criar o template do relatório
      criarTemplateRelatorioAPI();
    }
  };

  const handleVoltar = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
      setErro('');
    }
  };

  const criarTemplateRelatorioAPI = async () => {
    try {
      if (modoEdicao && templateExistente) {
        // Modo edição - atualizar template existente
        const template = await atualizarTemplateRelatorio(templateExistente.id, {
          titulo: dadosRelatorio.titulo,
          conteudo: dadosRelatorio.conteudo,
          tipo: dadosRelatorio.tipo,
          status: 'ativo'
        });
        
        console.log('Template atualizado com sucesso:', template);
      } else {
        // Modo criação - criar novo template
        const template = await criarTemplateRelatorio({
          titulo: dadosRelatorio.titulo,
          conteudo: dadosRelatorio.conteudo,
          tipo: dadosRelatorio.tipo,
          status: 'ativo'
        });
        
        console.log('Template criado com sucesso:', template);
      }
      
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Erro ao processar template:', error);
      setErro(`Erro ao ${modoEdicao ? 'atualizar' : 'criar'} template de relatório. Tente novamente.`);
    }
  };

  const renderEtapa1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {modoEdicao ? 'Editar Template de Relatório' : 'Criar Template de Relatório'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {modoEdicao 
            ? 'Edite o template de relatório personalizado usando variáveis que serão preenchidas posteriormente.'
            : 'Crie um template de relatório personalizado usando variáveis que serão preenchidas posteriormente.'
          }
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Título do Relatório <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={dadosRelatorio.titulo}
          onChange={(e) => setDadosRelatorio(prev => ({ ...prev, titulo: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Ex: Relatório de Análise Financeira"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Conteúdo do Relatório <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={dadosRelatorio.conteudo}
          onChange={(conteudo) => setDadosRelatorio(prev => ({ ...prev, conteudo }))}
          placeholder="Digite o conteúdo do relatório aqui..."
        />
      </div>


      {/* Ferramentas para inserir variáveis */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Ferramentas para Inserir Variáveis
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Selecione as variáveis que deseja incluir no relatório. As referências específicas serão escolhidas na geração do PDF.
        </p>
        
        {/* Linha 1: Variáveis da Empresa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variável da Empresa
            </label>
            <select
              value={variavelEmpresaSelecionada}
              onChange={(e) => setVariavelEmpresaSelecionada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione uma variável...</option>
              <option value="razao_social">Razão Social</option>
              <option value="nome_fantasia">Nome Fantasia</option>
              <option value="cnpj">CNPJ</option>
              <option value="capital_social">Capital Social</option>
              <option value="cnae_principal">CNAE Principal</option>
              <option value="endereco_completo">Endereço Completo</option>
              <option value="regime_tributario">Regime Tributário</option>
              <option value="data_abertura">Data de Abertura</option>
              <option value="situacao_cadastral">Situação Cadastral</option>
              <option value="natureza_juridica">Natureza Jurídica</option>
              <option value="porte">Porte</option>
              <option value="telefone1">Telefone 1</option>
              <option value="telefone2">Telefone 2</option>
              <option value="email">Email</option>
              <option value="logradouro">Logradouro</option>
              <option value="numero">Número</option>
              <option value="complemento">Complemento</option>
              <option value="bairro">Bairro</option>
              <option value="municipio">Município</option>
              <option value="uf">UF</option>
              <option value="cep">CEP</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={inserirVariavelEmpresa}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Inserir Variável da Empresa
            </button>
          </div>
        </div>

        {/* Linha 2: Variáveis da Pessoa Física */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variável da Pessoa Física
            </label>
            <select
              value={variavelPFSelecionada}
              onChange={(e) => setVariavelPFSelecionada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione uma variável...</option>
              <option value="nome_completo">Nome Completo</option>
              <option value="cpf">CPF</option>
              <option value="rg">RG</option>
              <option value="data_nascimento">Data de Nascimento</option>
              <option value="estado_civil">Estado Civil</option>
              <option value="regime_comunhao">Regime de Comunhão</option>
              <option value="endereco_completo_pf">Endereço Completo</option>
              <option value="telefone1_pf">Telefone 1</option>
              <option value="telefone2_pf">Telefone 2</option>
              <option value="email_pf">Email</option>
              <option value="logradouro_pf">Logradouro</option>
              <option value="numero_pf">Número</option>
              <option value="complemento_pf">Complemento</option>
              <option value="bairro_pf">Bairro</option>
              <option value="municipio_pf">Município</option>
              <option value="uf_pf">UF</option>
              <option value="cep_pf">CEP</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={inserirVariavelPF}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Inserir Variável da Pessoa Física
            </button>
          </div>
        </div>

        {/* Mensagem de erro */}
        {erroVariavel && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {erroVariavel}
          </div>
        )}
      </div>
    </div>
  );

  const renderEtapa2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preview do Template
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Visualize como ficará o relatório com dados de exemplo.
        </p>
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
          {dadosRelatorio.titulo}
        </h4>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div 
            className="text-sm text-gray-900 dark:text-white"
            dangerouslySetInnerHTML={{ __html: conteudoPreview || 'Nenhum conteúdo para preview...' }}
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          ℹ️ Informação
        </h5>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Este template será salvo e ficará disponível na lista de contratos. 
          Quando você clicar nele, poderá selecionar a empresa e/ou pessoa física 
          para gerar o relatório final com os dados reais.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Ferramenta de Criação de Relatórios
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${etapaAtual >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                etapaAtual >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">{modoEdicao ? 'Editar Template' : 'Criar Template'}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${etapaAtual >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                etapaAtual >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {etapaAtual === 1 && renderEtapa1()}
          {etapaAtual === 2 && renderEtapa2()}
          
          {erro && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleVoltar}
            disabled={etapaAtual === 1}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              etapaAtual === 1
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAvancar}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              {etapaAtual === 2 ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>{modoEdicao ? 'Atualizar Template' : 'Criar Template'}</span>
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span>Avançar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatorioCustomModal;
