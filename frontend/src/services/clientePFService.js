import api from './api';

/**
 * Lista todos os clientes pessoa física
 * @returns {Promise<Array>} Lista de clientes PF
 */
export const listarClientesPF = async () => {
    try {
        const response = await api.get('/clientes/pessoa-fisica');
        return response.data;
    } catch (error) {
        console.error('Erro ao listar clientes pessoa física:', error);
        throw error;
    }
};

/**
 * Cadastra um novo cliente pessoa física
 * @param {object} dadosCliente - Dados do cliente PF
 * @returns {Promise<object>} Resposta da API com o cliente cadastrado
 */
export const cadastrarClientePF = async (dadosCliente) => {
    try {
        const response = await api.post('/clientes/pessoa-fisica', dadosCliente);
        return response.data;
    } catch (error) {
        console.error('Erro ao cadastrar cliente pessoa física:', error);
        throw error;
    }
};

/**
 * Valida CPF no formato brasileiro
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} true se válido
 */
export const validarCPF = (cpf) => {
    // Remove caracteres não numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpfLimpo.length !== 11) return false;
    
    // Verifica se não é uma sequência de números iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    // Valida primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpfLimpo.charAt(9)) !== digito1) return false;
    
    // Valida segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpfLimpo.charAt(10)) !== digito2) return false;
    
    return true;
};

/**
 * Formata CPF no padrão XXX.XXX.XXX-XX
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado
 */
export const formatarCPF = (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return cpf;
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CEP no padrão XXXXX-XXX
 * @param {string} cep - CEP sem formatação
 * @returns {string} CEP formatado
 */
export const formatarCEP = (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return cep;
    return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
};

/**
 * Formata telefone no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * @param {string} telefone - Telefone sem formatação
 * @returns {string} Telefone formatado
 */
export const formatarTelefone = (telefone) => {
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo.length === 11) {
        return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (telLimpo.length === 10) {
        return telLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
};

