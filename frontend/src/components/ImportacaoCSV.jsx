import React, { useState } from 'react';
import { Upload, X, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { uploadPreviewCSV } from '../services/importacaoApi';
import { validarArquivoCSV, formatarErroImportacao, consolidarErros } from '../utils/errosImportacao';
import ErroDetalhado from './ErroDetalhado';

/**
 * Componente para upload múltiplo de arquivos CSV
 */
const ImportacaoCSV = ({ onPreviewCarregado }) => {
  const [arquivosSelecionados, setArquivosSelecionados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null); // Agora é objeto, não string
  const [dragActive, setDragActive] = useState(false);

  const handleArquivosSelecionados = (event) => {
    const arquivos = Array.from(event.target.files);
    adicionarArquivos(arquivos);
  };

  const adicionarArquivos = (novosArquivos) => {
    // Valida cada arquivo
    const errosValidacao = [];
    const arquivosValidos = [];

    novosArquivos.forEach(arquivo => {
      const errosArquivo = validarArquivoCSV(arquivo);
      if (errosArquivo.length > 0) {
        errosValidacao.push(...errosArquivo);
      } else {
        arquivosValidos.push(arquivo);
      }
    });

    // Se houver erros, mostra e não adiciona nenhum arquivo
    if (errosValidacao.length > 0) {
      setErro(consolidarErros(errosValidacao));
      return;
    }

    setArquivosSelecionados(prev => [...prev, ...arquivosValidos]);
    setErro(null);
  };

  const removerArquivo = (index) => {
    setArquivosSelecionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const arquivos = Array.from(e.dataTransfer.files);
    adicionarArquivos(arquivos);
  };

  const handleUpload = async () => {
    if (arquivosSelecionados.length === 0) {
      setErro({
        categoria: 'validacao',
        titulo: 'Nenhum Arquivo Selecionado',
        mensagem: 'Você precisa selecionar pelo menos um arquivo CSV para processar.',
        solucao: 'Arraste arquivos para a área acima ou clique em "Selecionar Arquivos".',
        detalhes: null
      });
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const resultado = await uploadPreviewCSV(arquivosSelecionados);
      
      // Passa os dados para o componente pai
      onPreviewCarregado(resultado);
      
      // Limpa os arquivos selecionados
      setArquivosSelecionados([]);
      
    } catch (error) {
      console.error('Erro no upload:', error);
      
      // Usa o formatador de erros
      const erroFormatado = formatarErroImportacao(error);
      setErro(erroFormatado);
    } finally {
      setCarregando(false);
    }
  };

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Área de upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          Arraste arquivos CSV aqui ou clique para selecionar
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Você pode selecionar múltiplos arquivos de uma vez
        </p>
        <input
          type="file"
          multiple
          accept=".csv,text/csv,text/tab-separated-values"
          onChange={handleArquivosSelecionados}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
        >
          Selecionar Arquivos
        </label>
      </div>

      {/* Lista de arquivos selecionados */}
      {arquivosSelecionados.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Arquivos Selecionados ({arquivosSelecionados.length})
          </h3>
          <div className="space-y-2">
            {arquivosSelecionados.map((arquivo, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {arquivo.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatarTamanho(arquivo.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removerArquivo(index)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  title="Remover arquivo"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {erro && (
        <ErroDetalhado 
          erro={erro} 
          onFechar={() => setErro(null)} 
        />
      )}

      {/* Botão de processar */}
      {arquivosSelecionados.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={carregando}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            carregando
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {carregando ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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
              Processando...
            </span>
          ) : (
            `Processar ${arquivosSelecionados.length} arquivo(s)`
          )}
        </button>
      )}

      {/* Informações */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-400">
            <p className="font-semibold mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Cada arquivo deve conter apenas 1 cliente (mesmo CNPJ)</li>
              <li>O cliente deve estar cadastrado no sistema</li>
              <li>Você pode enviar múltiplos arquivos de clientes diferentes</li>
              <li>Uma tela de conferência será exibida antes de salvar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportacaoCSV;

