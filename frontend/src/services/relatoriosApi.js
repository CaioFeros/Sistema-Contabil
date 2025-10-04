import api from './api';
import { handleRequest } from './apiService';

/**
 * Busca o relatório de faturamento consolidado para um cliente.
 * @param {object} params - Objeto com os parâmetros de filtro (cliente_id, tipo_filtro, etc.).
 * @returns {Promise<object>} Uma promessa que resolve para os dados do relatório.
 */
export const getRelatorioFaturamento = async (params) => {
    return handleRequest(api.get('/relatorios/faturamento', { params }));
};