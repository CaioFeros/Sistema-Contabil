import api from './api';

/**
 * Service para gerenciar contratos
 */

// Templates
export const listarTemplates = async (tipo = null) => {
  const params = tipo ? { tipo } : {};
  const response = await api.get('/contratos/templates', { params });
  return response.data;
};

export const obterTemplate = async (templateId) => {
  const response = await api.get(`/contratos/templates/${templateId}`);
  return response.data;
};

// Contratos
export const listarContratos = async (filtros = {}) => {
  const response = await api.get('/contratos', { params: filtros });
  return response.data;
};

export const obterContrato = async (contratoId) => {
  const response = await api.get(`/contratos/${contratoId}`);
  return response.data;
};

export const criarContrato = async (dadosContrato) => {
  const response = await api.post('/contratos', dadosContrato);
  return response.data;
};

export const atualizarContrato = async (contratoId, dadosContrato) => {
  const response = await api.put(`/contratos/${contratoId}`, dadosContrato);
  return response.data;
};

export const deletarContrato = async (contratoId, motivo = '') => {
  const params = motivo ? { motivo } : {};
  const response = await api.delete(`/contratos/${contratoId}`, { params });
  return response.data;
};

export const baixarPdfContrato = async (contratoId) => {
  const response = await api.get(`/contratos/${contratoId}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};

export const previewPdfContrato = async (contratoId) => {
  // Busca o PDF e abre em nova aba
  const response = await api.get(`/contratos/${contratoId}/pdf?preview=true`, {
    responseType: 'blob'
  });
  
  // Cria URL do blob e abre em nova aba
  const pdfBlob = response.data;
  const url = window.URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  
  // Limpa a URL após um tempo
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
};

// Funções auxiliares
export const formatarStatus = (status) => {
  const statusMap = {
    'rascunho': { label: 'Rascunho', color: 'gray' },
    'finalizado': { label: 'Finalizado', color: 'green' },
    'arquivado': { label: 'Arquivado', color: 'blue' }
  };
  return statusMap[status] || { label: status, color: 'gray' };
};

export const formatarTipoContrato = (tipo) => {
  const tipoMap = {
    'contrato_social': 'Contrato Social',
    'alteracao_contratual': 'Alteração Contratual',
    'extincao_unipessoal': 'Extinção Unipessoal',
    'extincao_individual': 'Extinção Individual',
    'distrato': 'Distrato/Dissolução',
    'entrada_socio': 'Entrada de Sócio',
    'contrato_custom': 'Contrato Custom'
  };
  return tipoMap[tipo] || tipo;
};

