import React from 'react';
import { AlertTriangle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { getIconeCategoria, getCorCategoria, CATEGORIAS_ERRO } from '../utils/errosImportacao';

/**
 * Componente para exibir erros detalhados e acionáveis
 */
const ErroDetalhado = ({ erro, onFechar }) => {
  if (!erro) return null;

  const getIconeErro = () => {
    switch (erro.categoria) {
      case CATEGORIAS_ERRO.VALIDACAO:
        return <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
      case CATEGORIAS_ERRO.REDE:
        return <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />;
      case CATEGORIAS_ERRO.ARQUIVO:
      case CATEGORIAS_ERRO.SERVIDOR:
      case CATEGORIAS_ERRO.CONSOLIDACAO:
        return <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case CATEGORIAS_ERRO.DADOS:
        return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      default:
        return <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />;
    }
  };

  const getCorFundo = () => {
    switch (erro.categoria) {
      case CATEGORIAS_ERRO.VALIDACAO:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case CATEGORIAS_ERRO.REDE:
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case CATEGORIAS_ERRO.DADOS:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
  };

  const getCorTexto = () => {
    switch (erro.categoria) {
      case CATEGORIAS_ERRO.VALIDACAO:
        return {
          titulo: 'text-yellow-900 dark:text-yellow-300',
          mensagem: 'text-yellow-800 dark:text-yellow-400',
          solucao: 'text-yellow-700 dark:text-yellow-500'
        };
      case CATEGORIAS_ERRO.REDE:
        return {
          titulo: 'text-orange-900 dark:text-orange-300',
          mensagem: 'text-orange-800 dark:text-orange-400',
          solucao: 'text-orange-700 dark:text-orange-500'
        };
      case CATEGORIAS_ERRO.DADOS:
        return {
          titulo: 'text-blue-900 dark:text-blue-300',
          mensagem: 'text-blue-800 dark:text-blue-400',
          solucao: 'text-blue-700 dark:text-blue-500'
        };
      default:
        return {
          titulo: 'text-red-900 dark:text-red-300',
          mensagem: 'text-red-800 dark:text-red-400',
          solucao: 'text-red-700 dark:text-red-500'
        };
    }
  };

  const cores = getCorTexto();

  return (
    <div className={`border rounded-lg p-4 ${getCorFundo()}`}>
      <div className="flex items-start space-x-3">
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          {getIconeErro()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Título */}
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-bold text-lg ${cores.titulo}`}>
              {getIconeCategoria(erro.categoria)} {erro.titulo}
            </h3>
            {onFechar && (
              <button
                onClick={onFechar}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Mensagem */}
          <p className={`text-sm mb-3 whitespace-pre-line ${cores.mensagem}`}>
            {erro.mensagem}
          </p>

          {/* Solução */}
          {erro.solucao && (
            <div className="bg-white/50 dark:bg-black/20 rounded p-3 mb-2">
              <p className={`text-sm font-medium mb-1 ${cores.titulo}`}>
                💡 Como resolver:
              </p>
              <p className={`text-sm whitespace-pre-line ${cores.solucao}`}>
                {erro.solucao}
              </p>
            </div>
          )}

          {/* Detalhes técnicos (expansível) */}
          {erro.detalhes && (
            <details className="mt-3">
              <summary className={`text-xs cursor-pointer ${cores.solucao} hover:underline`}>
                Ver detalhes técnicos
              </summary>
              <pre className={`mt-2 text-xs p-2 bg-black/10 dark:bg-white/10 rounded overflow-x-auto ${cores.solucao}`}>
                {typeof erro.detalhes === 'string' 
                  ? erro.detalhes 
                  : JSON.stringify(erro.detalhes, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErroDetalhado;

