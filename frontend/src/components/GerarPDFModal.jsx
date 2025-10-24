import React, { useState, useEffect } from 'react';
import { X, Download, Building2, User, FileText } from 'lucide-react';
import { listarEmpresas, obterEmpresa } from '../services/empresaService';
import { listarPessoasFisicas, obterPessoaFisica } from '../services/pessoaFisicaService';

const GerarPDFModal = ({ template, onClose }) => {
  const [empresas, setEmpresas] = useState([]);
  const [pessoasFisicas, setPessoasFisicas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [pessoaFisicaSelecionada, setPessoaFisicaSelecionada] = useState(null);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [dadosPessoaFisica, setDadosPessoaFisica] = useState(null);
  const [conteudoFinal, setConteudoFinal] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarReferencias();
  }, []);

  const carregarReferencias = async () => {
    try {
      setCarregando(true);
      const [empresasData, pessoasFisicasData] = await Promise.all([
        listarEmpresas(),
        listarPessoasFisicas()
      ]);
      
      setEmpresas(empresasData || []);
      setPessoasFisicas(pessoasFisicasData || []);
    } catch (error) {
      console.error('Erro ao carregar referências:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleSelecionarEmpresa = async (empresaId) => {
    if (!empresaId) {
      setEmpresaSelecionada(null);
      setDadosEmpresa(null);
      return;
    }

    try {
      const empresa = await obterEmpresa(empresaId);
      setEmpresaSelecionada(empresa);
      setDadosEmpresa(empresa);
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
    }
  };

  const handleSelecionarPessoaFisica = async (pessoaId) => {
    if (!pessoaId) {
      setPessoaFisicaSelecionada(null);
      setDadosPessoaFisica(null);
      return;
    }

    try {
      const pessoa = await obterPessoaFisica(pessoaId);
      setPessoaFisicaSelecionada(pessoa);
      setDadosPessoaFisica(pessoa);
    } catch (error) {
      console.error('Erro ao carregar pessoa física:', error);
    }
  };

  // Função auxiliar para construir endereço completo
  const construirEnderecoCompleto = (dados) => {
    const partes = [];
    
    if (dados.logradouro && dados.numero) {
      partes.push(`${dados.logradouro.toUpperCase()}, ${dados.numero.padStart(5, '0')}`);
    } else if (dados.logradouro) {
      partes.push(dados.logradouro.toUpperCase());
    }
    
    if (dados.complemento) {
      partes.push(dados.complemento.toUpperCase());
    }
    
    if (dados.bairro) {
      partes.push(dados.bairro.toUpperCase());
    }
    
    if (dados.municipio && dados.uf) {
      partes.push(`${dados.municipio.toUpperCase()}, - ${dados.uf.toUpperCase()}`);
    } else if (dados.municipio) {
      partes.push(dados.municipio.toUpperCase());
    }
    
    if (dados.cep) {
      partes.push(`CEP: ${dados.cep}`);
    }
    
    return partes.join(', ') + '.';
  };

  const gerarConteudoFinal = () => {
    if (!template?.conteudo) return '';

    let conteudo = template.conteudo;

    // Aplicar dados da empresa se disponível
    if (dadosEmpresa) {
      const dadosEmpresaFormatados = {
        razao_social: dadosEmpresa.razao_social || '',
        nome_fantasia: dadosEmpresa.nome_fantasia || '',
        cnpj: dadosEmpresa.cnpj || '',
        capital_social: dadosEmpresa.capital_social || '',
        cnae_principal: dadosEmpresa.cnae_principal || '',
        endereco_completo: construirEnderecoCompleto(dadosEmpresa),
        regime_tributario: dadosEmpresa.regime_tributario || '',
        data_abertura: dadosEmpresa.data_abertura || '',
        situacao_cadastral: dadosEmpresa.situacao_cadastral || '',
        natureza_juridica: dadosEmpresa.natureza_juridica || '',
        porte: dadosEmpresa.porte || '',
        telefone1: dadosEmpresa.telefone1 || '',
        telefone2: dadosEmpresa.telefone2 || '',
        email: dadosEmpresa.email || '',
        logradouro: dadosEmpresa.logradouro || '',
        numero: dadosEmpresa.numero || '',
        complemento: dadosEmpresa.complemento || '',
        bairro: dadosEmpresa.bairro || '',
        municipio: dadosEmpresa.municipio || '',
        uf: dadosEmpresa.uf || '',
        cep: dadosEmpresa.cep || ''
      };

      Object.keys(dadosEmpresaFormatados).forEach(variavel => {
        const valor = dadosEmpresaFormatados[variavel];
        conteudo = conteudo.replace(new RegExp(`{{${variavel}}}`, 'g'), valor);
      });
    }

    // Aplicar dados da pessoa física se disponível
    if (dadosPessoaFisica) {
      const dadosPessoaFisicaFormatados = {
        nome_completo: dadosPessoaFisica.nome_completo || '',
        cpf: dadosPessoaFisica.cpf || '',
        rg: dadosPessoaFisica.rg || '',
        data_nascimento: dadosPessoaFisica.data_nascimento || '',
        estado_civil: dadosPessoaFisica.estado_civil || '',
        regime_comunhao: dadosPessoaFisica.regime_comunhao || '',
        endereco_completo_pf: construirEnderecoCompleto(dadosPessoaFisica),
        telefone1_pf: dadosPessoaFisica.telefone1 || '',
        telefone2_pf: dadosPessoaFisica.telefone2 || '',
        email_pf: dadosPessoaFisica.email || '',
        logradouro_pf: dadosPessoaFisica.logradouro || '',
        numero_pf: dadosPessoaFisica.numero || '',
        complemento_pf: dadosPessoaFisica.complemento || '',
        bairro_pf: dadosPessoaFisica.bairro || '',
        municipio_pf: dadosPessoaFisica.municipio || '',
        uf_pf: dadosPessoaFisica.uf || '',
        cep_pf: dadosPessoaFisica.cep || ''
      };

      Object.keys(dadosPessoaFisicaFormatados).forEach(variavel => {
        const valor = dadosPessoaFisicaFormatados[variavel];
        conteudo = conteudo.replace(new RegExp(`{{${variavel}}}`, 'g'), valor);
      });
    }

    return conteudo;
  };

  const handleGerarPDF = () => {
    const conteudo = gerarConteudoFinal();
    
    // Criar uma nova janela para impressão
    const janelaImpressao = window.open('', '_blank');
    
    janelaImpressao.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${template.titulo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .content {
              white-space: pre-wrap;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${template.titulo}</h1>
          </div>
          <div class="content">${conteudo}</div>
          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Sistema Contábil</p>
          </div>
        </body>
      </html>
    `);
    
    janelaImpressao.document.close();
    
    // Aguardar o conteúdo carregar e abrir a impressão
    setTimeout(() => {
      janelaImpressao.print();
    }, 500);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="h-6 w-6 mr-2" />
            Gerar PDF - {template?.titulo}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selecionar Referências para o Relatório
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Escolha a empresa e/ou pessoa física que serão usadas como referência para preencher as variáveis do relatório.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seleção de Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Empresa de Referência
                </label>
                <select
                  value={empresaSelecionada?.id || ''}
                  onChange={(e) => handleSelecionarEmpresa(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={carregando}
                >
                  <option value="">Selecione uma empresa...</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.razao_social} - {empresa.cnpj}
                    </option>
                  ))}
                </select>
                {empresaSelecionada && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Empresa selecionada:</strong> {empresaSelecionada.razao_social}
                    </p>
                  </div>
                )}
              </div>

              {/* Seleção de Pessoa Física */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Pessoa Física de Referência
                </label>
                <select
                  value={pessoaFisicaSelecionada?.id || ''}
                  onChange={(e) => handleSelecionarPessoaFisica(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={carregando}
                >
                  <option value="">Selecione uma pessoa física...</option>
                  {pessoasFisicas.map((pessoa) => (
                    <option key={pessoa.id} value={pessoa.id}>
                      {pessoa.nome_completo} - {pessoa.cpf}
                    </option>
                  ))}
                </select>
                {pessoaFisicaSelecionada && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Pessoa selecionada:</strong> {pessoaFisicaSelecionada.nome_completo}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview do Conteúdo */}
            {(dadosEmpresa || dadosPessoaFisica) && (
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Preview do Relatório
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                    {gerarConteudoFinal()}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGerarPDF}
            disabled={!dadosEmpresa && !dadosPessoaFisica}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Gerar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GerarPDFModal;
