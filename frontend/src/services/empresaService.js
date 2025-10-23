import api from './api';

/**
 * Service para gerenciamento de empresas (pessoas jurídicas)
 */

/**
 * Lista todas as empresas
 * @returns {Promise<Array>} Lista de empresas
 */
export const listarEmpresas = async () => {
    try {
        const response = await api.get('/empresas');
        return response.data;
    } catch (error) {
        console.error('Erro ao listar empresas:', error);
        throw error;
    }
};

/**
 * Obtém dados de uma empresa específica
 * @param {number} empresaId - ID da empresa
 * @returns {Promise<object>} Dados da empresa
 */
export const obterEmpresa = async (empresaId) => {
    try {
        const response = await api.get(`/empresas/${empresaId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao obter empresa ${empresaId}:`, error);
        throw error;
    }
};

/**
 * Cadastra uma nova empresa
 * @param {object} dadosEmpresa - Dados da empresa
 * @returns {Promise<object>} Resposta da API com a empresa cadastrada
 */
export const cadastrarEmpresa = async (dadosEmpresa) => {
    try {
        const response = await api.post('/empresas', dadosEmpresa);
        return response.data;
    } catch (error) {
        console.error('Erro ao cadastrar empresa:', error);
        throw error;
    }
};

/**
 * Atualiza dados de uma empresa
 * @param {number} empresaId - ID da empresa
 * @param {object} dadosEmpresa - Dados atualizados
 * @returns {Promise<object>} Resposta da API
 */
export const atualizarEmpresa = async (empresaId, dadosEmpresa) => {
    try {
        const response = await api.put(`/empresas/${empresaId}`, dadosEmpresa);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar empresa ${empresaId}:`, error);
        throw error;
    }
};

/**
 * Remove uma empresa (soft delete)
 * @param {number} empresaId - ID da empresa
 * @returns {Promise<object>} Resposta da API
 */
export const removerEmpresa = async (empresaId) => {
    try {
        const response = await api.delete(`/empresas/${empresaId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao remover empresa ${empresaId}:`, error);
        throw error;
    }
};

const empresaService = {
    listarEmpresas,
    obterEmpresa,
    cadastrarEmpresa,
    atualizarEmpresa,
    removerEmpresa
};

export default empresaService;
