import api from './api';

export const contadorApi = {
  // Listar todos os contadores
  listar: async () => {
    const response = await api.get('/contadores');
    return response.data;
  },

  // Buscar um contador específico
  buscar: async (id) => {
    const response = await api.get(`/contadores/${id}`);
    return response.data;
  },

  // Criar novo contador (apenas admin)
  criar: async (dados) => {
    const response = await api.post('/contadores', dados);
    return response.data;
  },

  // Atualizar contador (apenas admin)
  atualizar: async (id, dados) => {
    const response = await api.put(`/contadores/${id}`, dados);
    return response.data;
  },

  // Desativar contador (apenas admin)
  excluir: async (id) => {
    const response = await api.delete(`/contadores/${id}`);
    return response.data;
  }
};

export default contadorApi;

