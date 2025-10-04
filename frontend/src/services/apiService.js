import api from './api';

/**
 * Extrai a mensagem de erro de uma resposta de erro da API.
 * @param {object} error - O objeto de erro do Axios.
 * @returns {string} A mensagem de erro tratada.
 */
const getErrorMessage = (error) => {
    return error.response?.data?.erro || error.message || 'Ocorreu um erro inesperado.';
};

/**
 * Wrapper para requisições da API que centraliza o tratamento de try/catch e erros.
 * @param {Promise} request - A chamada da API (ex: api.get('/url')).
 * @returns {Promise<any>} Retorna os dados da resposta em caso de sucesso.
 * @throws {Error} Lança um erro com a mensagem tratada em caso de falha.
 */
export const handleRequest = async (request) => {
    try {
        const response = await request;
        return response.data;
    } catch (error) {
        console.error("Erro na requisição API:", getErrorMessage(error));
        throw new Error(getErrorMessage(error));
    }
};