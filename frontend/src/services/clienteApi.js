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

/**
 * Consulta os dados de um CNPJ na Receita Federal via BrasilAPI.
 * @param {string} cnpj - O CNPJ a ser consultado (com ou sem formatação).
 * @returns {Promise<object>} Uma promessa que resolve para os dados do CNPJ.
 */
export const consultarCNPJ = async (cnpj) => {
    try {
        const response = await api.get(`/cnpj/${cnpj}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao consultar CNPJ ${cnpj}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};

/**
 * Deleta um cliente e todos os seus dados relacionados.
 * @param {number} id - O ID do cliente a ser deletado.
 * @returns {Promise<object>} Uma promessa que resolve para a mensagem de sucesso.
 */
export const deleteCliente = async (id) => {
    try {
        const response = await api.delete(`/clientes/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao deletar cliente ${id}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};

// ==================== FUNÇÕES DE BACKUP E RESTAURAÇÃO ====================

/**
 * Lista todos os backups de clientes disponíveis para restauração.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de backups.
 */
export const getBackups = async () => {
    try {
        const response = await api.get('/backups');
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar backups:", error.response?.data?.erro || error.message);
        throw error;
    }
};

/**
 * Obtém detalhes de um backup específico.
 * @param {number} backupId - O ID do backup a ser buscado.
 * @returns {Promise<object>} Uma promessa que resolve para os dados do backup.
 */
export const getBackupById = async (backupId) => {
    try {
        const response = await api.get(`/backups/${backupId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar backup ${backupId}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};

/**
 * Restaura um cliente a partir de um backup.
 * @param {number} backupId - O ID do backup a ser restaurado.
 * @returns {Promise<object>} Uma promessa que resolve para os dados do cliente restaurado.
 */
export const restaurarCliente = async (backupId) => {
    try {
        const response = await api.post(`/backups/${backupId}/restaurar`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao restaurar cliente do backup ${backupId}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};