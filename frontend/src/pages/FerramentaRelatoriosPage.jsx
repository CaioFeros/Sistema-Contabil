import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Plus, Eye, Edit, Trash2, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RelatorioCustomModal from '../components/RelatorioCustomModal';
import GerarPDFModal from '../components/GerarPDFModal';
import { listarTemplatesRelatorio, deletarTemplateRelatorio } from '../services/templateRelatorioService';

const FerramentaRelatoriosPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState(null);
  const [mostrarVisualizar, setMostrarVisualizar] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [templateParaEditar, setTemplateParaEditar] = useState(null);
  const [mostrarGerarPDF, setMostrarGerarPDF] = useState(false);

  useEffect(() => {
    carregarTemplates();
  }, []);

  const carregarTemplates = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const dados = await listarTemplatesRelatorio();
      setTemplates(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setErro('Erro ao carregar templates de relatórios.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCriarTemplate = () => {
    setMostrarModal(true);
  };

  const handleVisualizarTemplate = (template) => {
    setTemplateSelecionado(template);
    setMostrarVisualizar(true);
  };

  const handleEditarTemplate = (template) => {
    setTemplateParaEditar(template);
    setMostrarEditar(true);
  };

  const handleDeletarTemplate = async (templateId) => {
    if (window.confirm('Tem certeza que deseja deletar este template?')) {
      try {
        await deletarTemplateRelatorio(templateId);
        await carregarTemplates();
      } catch (error) {
        console.error('Erro ao deletar template:', error);
        setErro('Erro ao deletar template.');
      }
    }
  };

  const handleGerarRelatorio = (template) => {
    // Abrir modal de seleção de referências para gerar PDF
    setTemplateSelecionado(template);
    setMostrarGerarPDF(true);
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarStatus = (status) => {
    const statusMap = {
      'ativo': 'Ativo',
      'inativo': 'Inativo',
      'rascunho': 'Rascunho'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'ativo': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
      'inativo': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
      'rascunho': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </button>
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Ferramenta de Criação de Relatórios
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Crie e gerencie templates de relatórios personalizados
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleCriarTemplate}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md"
        >
          <Plus className="h-5 w-5" />
          <span>Novo Template</span>
        </button>
      </div>

      {/* Erro */}
      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {erro}
        </div>
      )}

      {/* Lista de Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Templates de Relatórios
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {templates.length} template(s) encontrado(s)
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crie seu primeiro template de relatório personalizado.
            </p>
            <button
              onClick={handleCriarTemplate}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Criar Primeiro Template</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {templates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.titulo}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(template.status)}`}>
                        {formatarStatus(template.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {template.conteudo.length > 100 
                        ? `${template.conteudo.substring(0, 100)}...` 
                        : template.conteudo
                      }
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Criado em: {formatarData(template.data_criacao)}</span>
                      <span>Tipo: {template.tipo}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVisualizarTemplate(template)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditarTemplate(template)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleGerarRelatorio(template)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Gerar Relatório"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletarTemplate(template.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {mostrarModal && (
        <RelatorioCustomModal
          onClose={() => setMostrarModal(false)}
          onSuccess={() => {
            setMostrarModal(false);
            carregarTemplates();
          }}
        />
      )}

      {/* Modal de Visualização */}
      {mostrarVisualizar && templateSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {templateSelecionado.titulo}
              </h2>
              <button
                onClick={() => setMostrarVisualizar(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                  {templateSelecionado.conteudo}
                </pre>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setMostrarVisualizar(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setMostrarVisualizar(false);
                  handleGerarRelatorio(templateSelecionado);
                }}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Gerar Relatório</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {mostrarEditar && templateParaEditar && (
        <RelatorioCustomModal
          templateExistente={templateParaEditar}
          modoEdicao={true}
          onClose={() => {
            setMostrarEditar(false);
            setTemplateParaEditar(null);
          }}
          onSuccess={() => {
            setMostrarEditar(false);
            setTemplateParaEditar(null);
            carregarTemplates();
          }}
        />
      )}

      {/* Modal de Geração de PDF */}
      {mostrarGerarPDF && templateSelecionado && (
        <GerarPDFModal
          template={templateSelecionado}
          onClose={() => {
            setMostrarGerarPDF(false);
            setTemplateSelecionado(null);
          }}
        />
      )}
    </div>
  );
};

export default FerramentaRelatoriosPage;
