import React, { useState } from 'react';
import { X, Download, Edit, Check, FileText, FileDown, Eye } from 'lucide-react';
import { atualizarContrato, baixarPdfContrato, previewPdfContrato } from '../services/contratoService';

const VisualizarContratoModal = ({ contrato, onClose, onAtualizado }) => {
  const [editando, setEditando] = useState(false);
  const [conteudoEditado, setConteudoEditado] = useState(contrato.conteudo_gerado);
  const [salvando, setSalvando] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      await atualizarContrato(contrato.id, {
        conteudo_gerado: conteudoEditado,
        status: 'finalizado'
      });
      alert('Contrato atualizado com sucesso!');
      setEditando(false);
      if (onAtualizado) onAtualizado();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar contrato.');
    } finally {
      setSalvando(false);
    }
  };

  const handleBaixarTxt = () => {
    const blob = new Blob([conteudoEditado], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contrato.numero_contrato}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handlePreviewPdf = async () => {
    try {
      setGerandoPdf(true);
      // Abre preview em nova aba
      await previewPdfContrato(contrato.id);
    } catch (error) {
      console.error('Erro ao abrir preview:', error);
      alert('Erro ao abrir preview do PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleBaixarPdf = async () => {
    try {
      setGerandoPdf(true);
      const pdfBlob = await baixarPdfContrato(contrato.id);
      
      // Cria URL temporária para o blob
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contrato.numero_contrato}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full my-8">
        {/* Cabeçalho */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-lg z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {contrato.titulo}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contrato.numero_contrato}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Barra de Ações */}
          <div className="flex items-center space-x-2 mt-4">
            {!editando ? (
              <>
                <button
                  onClick={() => setEditando(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={handlePreviewPdf}
                  disabled={gerandoPdf}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  title="Visualizar PDF em nova aba"
                >
                  <Eye className="h-4 w-4" />
                  <span>{gerandoPdf ? 'Abrindo...' : 'Preview PDF'}</span>
                </button>
                <button
                  onClick={handleBaixarPdf}
                  disabled={gerandoPdf}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Baixar PDF</span>
                </button>
                <button
                  onClick={handleBaixarTxt}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar TXT</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{salvando ? 'Salvando...' : 'Salvar'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditando(false);
                    setConteudoEditado(contrato.conteudo_gerado);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
          {editando ? (
            <textarea
              value={conteudoEditado}
              onChange={(e) => setConteudoEditado(e.target.value)}
              className="w-full h-[600px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-white">
                {contrato.conteudo_gerado}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizarContratoModal;

