import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Building } from 'lucide-react';
import { cadastrarClienteCSV } from '../services/importacaoApi';
import { formatarErroImportacao } from '../utils/errosImportacao';
import ErroDetalhado from './ErroDetalhado';

/**
 * Modal para cadastrar cliente automaticamente via API da Receita Federal
 * durante a importação de CSV
 */
const CadastroClienteModal = ({ cnpj, razaoSocial, onCadastrado, onCancelar }) => {
  const [cadastrando, setCadastrando] = useState(false);
  const [erro, setErro] = useState(null); // Agora é objeto

  // Reseta o estado quando o CNPJ muda (novo cliente)
  useEffect(() => {
    setCadastrando(false);
    setErro(null);
  }, [cnpj]);

  const handleCadastrar = async () => {
    setCadastrando(true);
    setErro(null);

    try {
      const resultado = await cadastrarClienteCSV(cnpj);
      
      if (resultado.sucesso) {
        // Aguarda 1 segundo para feedback visual
        setTimeout(() => {
          onCadastrado(resultado.cliente);
        }, 1000);
      } else {
        setErro({
          categoria: 'consolidacao',
          titulo: 'Erro ao Cadastrar',
          mensagem: 'Não foi possível cadastrar o cliente.',
          solucao: 'Tente novamente ou cadastre manualmente em "Gerenciar Clientes".',
          detalhes: null
        });
        setCadastrando(false);
      }
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      
      // Usa o formatador de erros
      const erroFormatado = formatarErroImportacao(error);
      setErro(erroFormatado);
      setCadastrando(false);
    }
  };

  // Formata CNPJ para exibição
  const formatarCNPJ = (cnpjStr) => {
    const limpo = cnpjStr.replace(/\D/g, '');
    if (limpo.length !== 14) return cnpjStr;
    return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Cliente Não Cadastrado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cadastro automático via Receita Federal
              </p>
            </div>
          </div>
          <button
            onClick={onCancelar}
            disabled={cadastrando}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informações do Cliente */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                CNPJ:
              </span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatarCNPJ(cnpj)}
              </p>
            </div>
            {razaoSocial && (
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Razão Social:
                </span>
                <p className="text-gray-900 dark:text-white">
                  {razaoSocial}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mensagem */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">O que acontecerá:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Buscaremos os dados na Receita Federal</li>
                <li>Cliente será cadastrado automaticamente</li>
                <li>Importação do CSV continuará após o cadastro</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="mb-6">
            <ErroDetalhado 
              erro={erro} 
              onFechar={() => setErro(null)} 
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex space-x-3">
          <button
            onClick={onCancelar}
            disabled={cadastrando}
            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar Importação
          </button>
          <button
            onClick={handleCadastrar}
            disabled={cadastrando}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {cadastrando ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Cadastrando...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Cadastrar Cliente
              </>
            )}
          </button>
        </div>

        {/* Info adicional */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          Os dados serão buscados na Receita Federal via BrasilAPI
        </p>
      </div>
    </div>
  );
};

export default CadastroClienteModal;

