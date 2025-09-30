import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Busca a lista de todos os clientes.
 * Requer que o token de autenticação já esteja configurado no axios.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de clientes.
 */
export const getClientes = async () => {
    try {
        const response = await axios.get(`${API_URL}/clientes`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar clientes:", error.response?.data?.erro || error.message);
        throw error; // Lança o erro para ser tratado pelo componente que chamou
    }
};

/**
 * Cria um novo cliente.
 * @param {object} clienteData - Os dados do novo cliente { razao_social, cnpj, regime_tributario }.
 * @returns {Promise<object>} Uma promessa que resolve para os dados do cliente criado.
 */
export const createCliente = async (clienteData) => {
    try {
        const response = await axios.post(`${API_URL}/clientes`, clienteData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar cliente:", error.response?.data?.erro || error.message);
        throw error;
    }
};
