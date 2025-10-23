import React, { useState } from 'react';
import { X, Eye, Save, FileText, Settings } from 'lucide-react';

const ContratoCustomModal = ({ onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('Contrato Custom');
  const [conteudo, setConteudo] = useState('');
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      // Aqui futuramente será implementada a lógica de salvamento
      // Por enquanto, apenas simula o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Contrato Custom salvo com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      alert('Erro ao salvar contrato.');
    } finally {
      setSalvando(false);
    }
  };

  const previewContent = conteudo || `
# Contrato Custom

Este é um contrato personalizado que pode ser editado conforme necessário.

## Seção 1: Objeto do Contrato
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Seção 2: Cláusulas Específicas
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Seção 3: Condições Gerais
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

---
*Contrato gerado automaticamente pelo Sistema Contábil*
  `;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Contrato Custom
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crie e personalize seu contrato
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setMostrarPreview(!mostrarPreview)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>{mostrarPreview ? 'Editar' : 'Preview'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 flex overflow-hidden">
          {!mostrarPreview ? (
            /* Editor */
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Contrato
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Digite o título do contrato"
                />
              </div>
              
              <div className="flex-1 p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conteúdo do Contrato
                </label>
                <textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="w-full h-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Digite o conteúdo do contrato aqui..."
                />
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="prose dark:prose-invert max-w-none">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {titulo}
                  </h1>
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                    {previewContent}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <FileText className="h-4 w-4 inline mr-1" />
            Contrato Custom - Sistema Contábil
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Contrato'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContratoCustomModal;
