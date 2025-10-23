import api from './api';

/**
 * Busca dados de endereço a partir de um CEP
 * @param {string} cep - CEP a ser consultado (pode conter pontuação)
 * @returns {Promise<object>} Dados do endereço
 */
export const consultarCep = async (cep) => {
    try {
        // Remove pontuação do CEP
        const cepLimpo = cep.replace(/\D/g, '');
        
        if (cepLimpo.length !== 8) {
            throw new Error('CEP deve conter 8 dígitos');
        }
        
        const response = await api.get(`/cep/${cepLimpo}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao consultar CEP:', error);
        throw error;
    }
};

