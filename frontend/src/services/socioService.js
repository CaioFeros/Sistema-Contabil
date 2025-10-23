import api from './api';

/**
 * Service para gerenciamento de sócios de empresas
 */

/**
 * Lista todos os sócios de uma empresa
 * @param {number} empresaId - ID da empresa (cliente PJ)
 * @param {boolean} dadosCompletos - Se true, retorna dados completos da PF
 * @returns {Promise<Array>} Lista de sócios
 */
export const listarSocios = async (empresaId, dadosCompletos = false) => {
    try {
        const params = dadosCompletos ? { completos: 'true' } : {};
        const response = await api.get(`/empresas/${empresaId}/socios`, { params });
        return response.data;
    } catch (error) {
        console.error('Erro ao listar sócios:', error);
        throw error;
    }
};

/**
 * Adiciona um sócio a uma empresa
 * @param {number} empresaId - ID da empresa (cliente PJ)
 * @param {object} dadosSocio - Dados do sócio {socio_id, percentual_participacao, data_entrada, cargo}
 * @returns {Promise<object>} Sócio adicionado
 */
export const adicionarSocio = async (empresaId, dadosSocio) => {
    try {
        const response = await api.post(`/empresas/${empresaId}/socios`, dadosSocio);
        return response.data;
    } catch (error) {
        console.error('Erro ao adicionar sócio:', error);
        throw error;
    }
};

/**
 * Remove um sócio de uma empresa
 * @param {number} empresaId - ID da empresa (cliente PJ)
 * @param {number} socioId - ID do sócio (cliente PF)
 * @returns {Promise<object>} Resposta da API
 */
export const removerSocio = async (empresaId, socioId) => {
    try {
        const response = await api.delete(`/empresas/${empresaId}/socios/${socioId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao remover sócio:', error);
        throw error;
    }
};

/**
 * Lista todos os clientes Pessoa Física disponíveis para serem sócios
 * @returns {Promise<Array>} Lista de clientes PF
 */
export const listarClientesPF = async () => {
    try {
        const response = await api.get('/clientes/pessoa-fisica/lista');
        return response.data;
    } catch (error) {
        console.error('Erro ao listar clientes PF:', error);
        throw error;
    }
};

/**
 * Busca todos os sócios de uma empresa (alias para listarSocios)
 * @param {number} clienteId - ID da empresa (cliente PJ)
 * @param {boolean} completos - Se true, retorna dados completos
 * @returns {Promise<Array>} Lista de sócios
 */
export const buscarSociosPorCliente = async (clienteId, completos = true) => {
    return listarSocios(clienteId, completos);
};

