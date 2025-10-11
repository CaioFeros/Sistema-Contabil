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

/**
 * Busca os dados completos de um cliente específico.
 * @param {number} id - O ID do cliente a ser buscado.
 * @returns {Promise<object>} Uma promessa que resolve para os dados completos do cliente.
 */
export const getClienteById = async (id) => {
    try {
        const response = await api.get(`/clientes/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar cliente ${id}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};

/**
 * Atualiza os dados de um cliente existente.
 * @param {number} id - O ID do cliente a ser atualizado.
 * @param {object} clienteData - Os novos dados do cliente.
 * @returns {Promise<object>} Uma promessa que resolve para a mensagem de sucesso.
 */
export const updateCliente = async (id, clienteData) => {
    try {
        const response = await api.put(`/clientes/${id}`, clienteData);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar cliente ${id}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};
