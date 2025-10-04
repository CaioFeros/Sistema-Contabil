import api from './api'; // 1. Importa a instância configurada do Axios

/**
 * Busca a lista de todos os clientes.
 * Requer que o token de autenticação já esteja configurado no axios.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de clientes.
 */
export const getClientes = async () => {
    try {
        const response = await api.get('/clientes'); // 2. Usa a instância 'api'
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
        const response = await api.post('/clientes', clienteData); // 3. Usa a instância 'api'
        return response.data;
    } catch (error) {
        console.error("Erro ao criar cliente:", error.response?.data?.erro || error.message);
        throw error;
    }
};
