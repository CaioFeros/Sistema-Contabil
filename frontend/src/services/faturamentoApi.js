import api from './api'; // Importa a instância configurada do Axios
import { handleRequest } from './apiService';

/**
 * Busca a lista de todos os processamentos de faturamento.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de processamentos.
 */
export const getProcessamentos = async () => {
    return handleRequest(api.get('/faturamento/processamentos'));
};

/**
 * Envia os dados do formulário, incluindo o arquivo CSV, para processamento no backend.
 * @param {FormData} formData - O objeto FormData contendo cliente_id, mes, ano e o arquivo.
 * @param {function} onUploadProgress - Callback para monitorar o progresso do upload.
 * @returns {Promise<object>} Uma promessa que resolve para a resposta da API.
 */
export const processarFaturamento = async (formData, onUploadProgress) => {
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
    };
    return handleRequest(api.post('/faturamento/processar', formData, config));
};