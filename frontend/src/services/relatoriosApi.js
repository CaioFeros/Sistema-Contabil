import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Busca o relatório anual consolidado para um cliente.
 * @param {object} params - Objeto com { cliente_id, ano }.
 * @returns {Promise<object>} Uma promessa que resolve para os dados do relatório.
 */
export const getRelatorioAnual = async ({ cliente_id, ano }) => {
    try {
        const response = await axios.get(`${API_URL}/relatorios/anual`, {
            params: { cliente_id, ano }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar relatório anual:", error.response?.data?.erro || error.message);
        throw error;
    }
};