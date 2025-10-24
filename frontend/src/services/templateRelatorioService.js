import api from './api';

export const listarTemplatesRelatorio = async () => {
    try {
        const response = await api.get('/templates-relatorio');
        return response.data;
    } catch (error) {
        console.error("Erro ao listar templates de relatório:", error.response?.data?.erro || error.message);
        throw error;
    }
};

export const obterTemplateRelatorio = async (id) => {
    try {
        const response = await api.get(`/templates-relatorio/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao obter template de relatório ${id}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};

export const criarTemplateRelatorio = async (dados) => {
    try {
        const response = await api.post('/templates-relatorio', dados);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar template de relatório:", error.response?.data?.erro || error.message);
        throw error;
    }
};

export const atualizarTemplateRelatorio = async (id, dados) => {
    try {
        const response = await api.put(`/templates-relatorio/${id}`, dados);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar template de relatório ${id}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};

export const deletarTemplateRelatorio = async (id) => {
    try {
        const response = await api.delete(`/templates-relatorio/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao deletar template de relatório ${id}:`, error.response?.data?.erro || error.message);
        throw error;
    }
};
