import api from './api';

/**
 * Serviço para operações relacionadas a CNAE
 */

/**
 * Busca CNAEs por termo (código ou descrição)
 * @param {string} termo - Termo de busca
 * @param {number} limite - Número máximo de resultados (padrão: 50)
 * @returns {Promise<{total: number, resultados: Array}>}
 */
export const buscarCNAE = async (termo, limite = 50) => {
  try {
    const response = await api.get('/cnae/buscar', {
      params: {
        q: termo,
        limite
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar CNAE:', error);
    throw error;
  }
};

/**
 * Busca detalhes de um CNAE específico
 * @param {string} codigo - Código do CNAE
 * @returns {Promise<Object>}
 */
export const buscarCNAEPorCodigo = async (codigo) => {
  try {
    const response = await api.get(`/cnae/${encodeURIComponent(codigo)}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes do CNAE:', error);
    throw error;
  }
};

/**
 * Busca todas as seções CNAE
 * @returns {Promise<Array<{codigo: string, descricao: string}>>}
 */
export const buscarSecoesCNAE = async () => {
  try {
    const response = await api.get('/cnae/secoes');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar seções CNAE:', error);
    throw error;
  }
};

/**
 * Busca divisões CNAE
 * @param {string} secao - Código da seção (opcional)
 * @returns {Promise<Array<{codigo: string, descricao: string}>>}
 */
export const buscarDivisoesCNAE = async (secao = null) => {
  try {
    const params = secao ? { secao } : {};
    const response = await api.get('/cnae/divisoes', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar divisões CNAE:', error);
    throw error;
  }
};

/**
 * Busca grupos CNAE
 * @param {string} divisao - Código da divisão (opcional)
 * @returns {Promise<Array<{codigo: string, descricao: string}>>}
 */
export const buscarGruposCNAE = async (divisao = null) => {
  try {
    const params = divisao ? { divisao } : {};
    const response = await api.get('/cnae/grupos', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar grupos CNAE:', error);
    throw error;
  }
};

/**
 * Busca estatísticas da base de CNAEs
 * @returns {Promise<Object>}
 */
export const buscarEstatisticasCNAE = async () => {
  try {
    const response = await api.get('/cnae/estatisticas');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas CNAE:', error);
    throw error;
  }
};

/**
 * Lista todos os CNAEs do banco (paginado)
 * @param {number} pagina - Número da página (padrão: 1)
 * @param {number} porPagina - Itens por página (padrão: 50)
 * @returns {Promise<Object>}
 */
export const listarTodosCNAE = async (pagina = 1, porPagina = 50) => {
  try {
    const response = await api.get('/cnae/listar-todos', {
      params: {
        pagina,
        por_pagina: porPagina
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao listar todos CNAEs:', error);
    throw error;
  }
};

// Alias para compatibilidade
export const buscarCNAEs = buscarCNAE;

export default {
  buscarCNAE,
  buscarCNAEs,
  buscarCNAEPorCodigo,
  buscarSecoesCNAE,
  buscarDivisoesCNAE,
  buscarGruposCNAE,
  buscarEstatisticasCNAE,
  listarTodosCNAE
};

