/**
 * API de Importação de Faturamento via CSV
 */
import api from './api';

/**
 * Upload de arquivos CSV para preview
 * @param {File[]} arquivos - Array de arquivos CSV
 * @returns {Promise} Dados do preview
 */
export const uploadPreviewCSV = async (arquivos) => {
  const formData = new FormData();
  
  arquivos.forEach(arquivo => {
    formData.append('arquivos', arquivo);
  });
  
  const response = await api.post('/faturamento/upload-preview', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000  // 60 segundos para upload
  });
  
  return response.data;
};

/**
 * Consolida os dados do CSV no banco de dados
 * @param {Object} dados - Dados processados do preview
 * @param {Object} substituicoes - Dict com substituições por competência {arquivo_id: {mes_ano: bool}}
 * @returns {Promise} Resultado da consolidação
 */
export const consolidarCSV = async (dados, substituicoes = {}) => {
  const response = await api.post('/faturamento/consolidar', {
    arquivos: dados,
    substituicoes
  });
  
  return response.data;
};

/**
 * Cadastra um cliente automaticamente via API da Receita Federal
 * @param {string} cnpj - CNPJ do cliente
 * @returns {Promise} Dados do cliente cadastrado
 */
export const cadastrarClienteCSV = async (cnpj) => {
  const response = await api.post('/faturamento/cadastrar-cliente-csv', {
    cnpj
  });
  
  return response.data;
};

