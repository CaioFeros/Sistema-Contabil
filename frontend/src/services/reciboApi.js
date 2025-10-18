import api from './api';

export const reciboApi = {
  // Listar todos os recibos
  listar: async () => {
    const response = await api.get('/recibos');
    return response.data;
  },

  // Buscar um recibo específico
  buscar: async (id) => {
    const response = await api.get(`/recibos/${id}`);
    return response.data;
  },

  // Criar novo recibo
  criar: async (dados) => {
    const response = await api.post('/recibos', dados);
    return response.data;
  }
};

export default reciboApi;

