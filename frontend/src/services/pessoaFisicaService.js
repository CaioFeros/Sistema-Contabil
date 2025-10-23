import api from './api';

/**
 * Service para gerenciamento de pessoas físicas
 */

/**
 * Lista todas as pessoas físicas
 * @returns {Promise<Array>} Lista de pessoas físicas
 */
export const listarPessoasFisicas = async () => {
    try {
        const response = await api.get('/pessoas-fisicas');
        return response.data;
    } catch (error) {
        console.error('Erro ao listar pessoas físicas:', error);
        throw error;
    }
};

/**
 * Obtém dados de uma pessoa física específica
 * @param {number} pessoaId - ID da pessoa física
 * @returns {Promise<object>} Dados da pessoa física
 */
export const obterPessoaFisica = async (pessoaId) => {
    try {
        const response = await api.get(`/pessoas-fisicas/${pessoaId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao obter pessoa física ${pessoaId}:`, error);
        throw error;
    }
};

/**
 * Cadastra uma nova pessoa física
 * @param {object} dadosPessoa - Dados da pessoa física
 * @returns {Promise<object>} Resposta da API com a pessoa cadastrada
 */
export const cadastrarPessoaFisica = async (dadosPessoa) => {
    try {
        const response = await api.post('/pessoas-fisicas', dadosPessoa);
        return response.data;
    } catch (error) {
        console.error('Erro ao cadastrar pessoa física:', error);
        throw error;
    }
};

/**
 * Atualiza dados de uma pessoa física
 * @param {number} pessoaId - ID da pessoa física
 * @param {object} dadosPessoa - Dados atualizados
 * @returns {Promise<object>} Resposta da API
 */
export const atualizarPessoaFisica = async (pessoaId, dadosPessoa) => {
    try {
        const response = await api.put(`/pessoas-fisicas/${pessoaId}`, dadosPessoa);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar pessoa física ${pessoaId}:`, error);
        throw error;
    }
};

/**
 * Remove uma pessoa física (soft delete)
 * @param {number} pessoaId - ID da pessoa física
 * @returns {Promise<object>} Resposta da API
 */
export const removerPessoaFisica = async (pessoaId) => {
    try {
        const response = await api.delete(`/pessoas-fisicas/${pessoaId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao remover pessoa física ${pessoaId}:`, error);
        throw error;
    }
};

const pessoaFisicaService = {
    listarPessoasFisicas,
    obterPessoaFisica,
    cadastrarPessoaFisica,
    atualizarPessoaFisica,
    removerPessoaFisica
};

export default pessoaFisicaService;
