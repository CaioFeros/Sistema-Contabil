import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, Download, Archive, ArrowLeft } from 'lucide-react';
import { listarContratos, deletarContrato, formatarStatus, formatarTipoContrato } from '../services/contratoService';
import WizardContratoModal from '../components/WizardContratoModal';
import VisualizarContratoModal from '../components/VisualizarContratoModal';

const ContratosPage = () => {
  const navigate = useNavigate();
  const [contratos, setContratos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  
  // Modais
  const [mostrarWizard, setMostrarWizard] = useState(false);
  const [contratoSelecionado, setContratoSelecionado] = useState(null);
  const [mostrarVisualizar, setMostrarVisualizar] = useState(false);

  useEffect(() => {
    carregarContratos();
  }, [filtroTipo, filtroStatus]);

  const carregarContratos = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const filtros = {};
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroStatus) filtros.status = filtroStatus;
      if (busca) filtros.busca = busca;
      
      const dados = await listarContratos(filtros);
      
      // Garante que sempre temos um array
      if (Array.isArray(dados)) {
        setContratos(dados);
      } else {
        console.error('Resposta da API não é um array:', dados);
        setContratos([]);
        setErro('Erro ao carregar contratos. Formato inválido.');
      }
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      setContratos([]); // Garante que contratos é sempre um array
      setErro('Erro ao carregar contratos. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    carregarContratos();
  };

  const handleExcluir = async (contrato) => {
    if (!window.confirm(`Tem certeza que deseja excluir o contrato "${contrato.titulo}"?`)) {
      return;
    }

    try {
      await deletarContrato(contrato.id);
      setContratos(contratos.filter(c => c.id !== contrato.id));
      alert('Contrato excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert('Erro ao excluir contrato.');
    }
  };

  const handleVisualizar = (contrato) => {
    setContratoSelecionado(contrato);
    setMostrarVisualizar(true);
  };

  const contratosFiltrados = contratos;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Cabeçalho */}
      <div className="max-w-7xl mx-auto mb-8">
        {/* Botão Voltar */}
        <button
          onClick={() => navigate('/app/dashboard')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar ao Dashboard</span>
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Contratos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie contratos societários
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setMostrarWizard(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Contrato</span>
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por título ou número..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os tipos</option>
                <option value="contrato_social">Contrato Social</option>
                <option value="alteracao_contratual">Alteração Contratual</option>
                <option value="extincao_unipessoal">Extinção Unipessoal</option>
                <option value="extincao_individual">Extinção Individual</option>
                <option value="distrato">Distrato/Dissolução</option>
                <option value="entrada_socio">Entrada de Sócio</option>
                <option value="contrato_custom">Contrato Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os status</option>
                <option value="rascunho">Rascunho</option>
                <option value="finalizado">Finalizado</option>
                <option value="arquivado">Arquivado</option>
              </select>
            </div>
          </form>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Contratos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contratos.length}
                </p>
              </div>
              <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rascunhos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contratos.filter(c => c.status === 'rascunho').length}
                </p>
              </div>
              <Edit className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Finalizados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {contratos.filter(c => c.status === 'finalizado').length}
                </p>
              </div>
              <Archive className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Lista de Contratos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {carregando ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando contratos...</p>
            </div>
          ) : erro ? (
            <div className="p-12 text-center">
              <p className="text-red-600 dark:text-red-400">{erro}</p>
              <button
                onClick={carregarContratos}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          ) : contratosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Nenhum contrato encontrado
              </p>
              <button
                onClick={() => setMostrarWizard(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Criar Primeiro Contrato
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {contratosFiltrados.map((contrato) => {
                const statusInfo = formatarStatus(contrato.status);
                return (
                  <div
                    key={contrato.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {contrato.titulo}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 dark:bg-${statusInfo.color}-900/30 dark:text-${statusInfo.color}-400`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div>
                            <span className="font-medium">Número:</span> {contrato.numero_contrato}
                          </div>
                          <div>
                            <span className="font-medium">Tipo:</span> {formatarTipoContrato(contrato.tipo)}
                          </div>
                          <div>
                            <span className="font-medium">Empresa:</span> {contrato.empresa_razao_social || contrato.empresa_nome_completo || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Criado em:</span> {new Date(contrato.data_criacao).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        {contrato.observacoes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {contrato.observacoes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleVisualizar(contrato)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleExcluir(contrato)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {mostrarWizard && (
        <WizardContratoModal
          onClose={() => setMostrarWizard(false)}
          onSuccess={() => {
            setMostrarWizard(false);
            carregarContratos();
          }}
        />
      )}

      {mostrarVisualizar && contratoSelecionado && (
        <VisualizarContratoModal
          contrato={contratoSelecionado}
          onClose={() => {
            setMostrarVisualizar(false);
            setContratoSelecionado(null);
          }}
          onAtualizado={carregarContratos}
        />
      )}
    </div>
  );
};

export default ContratosPage;

