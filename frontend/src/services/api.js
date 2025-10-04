import axios from 'axios';

// Cria uma instância do Axios com a URL base da sua API.
// Isso evita ter que repetir 'http://localhost:5000/api' em todo lugar.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Este é o "interceptor". Ele é uma função que o Axios executa
// ANTES de cada requisição ser enviada.
api.interceptors.request.use(
  (config) => {
    // 1. Pega o token que foi salvo no localStorage durante o login
    const token = localStorage.getItem('authToken');
    // 2. Se o token existir, adiciona ao cabeçalho 'Authorization'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Retorna a configuração modificada para o Axios continuar
  },
  (error) => Promise.reject(error)
);

export default api;