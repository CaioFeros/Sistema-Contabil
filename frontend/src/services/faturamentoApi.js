import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Envia os dados e o arquivo de faturamento para processamento.
 * @param {FormData} formData - Objeto FormData contendo cliente_id, mes, ano, e o arquivo.
 * @returns {Promise<object>} Uma promessa que resolve para a resposta da API.
 */
export const processarFaturamento = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/faturamento/processar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(
            "Erro ao processar faturamento:", 
            error.response?.data?.erro || error.message
        );
        throw error;
    }
};

/**
 * Busca a lista de processamentos de faturamento já realizados.
 * @param {object} filters - Objeto opcional com filtros (cliente_id, mes, ano).
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de processamentos.
 */
export const getProcessamentos = async (filters = {}) => {
    try {
        const response = await axios.get(`${API_URL}/faturamento/processamentos`, { params: filters });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar processamentos:", error.response?.data?.erro || error.message);
        throw error;
    }
};