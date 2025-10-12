/**
 * Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX
 * @param {string} cnpj - CNPJ com ou sem formatação
 * @returns {string} CNPJ formatado
 */
export const formatarCNPJ = (cnpj) => {
    // Remove tudo que não é dígito
    const apenasNumeros = cnpj.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    const limitado = apenasNumeros.slice(0, 14);
    
    // Aplica a máscara
    if (limitado.length <= 2) {
        return limitado;
    } else if (limitado.length <= 5) {
        return `${limitado.slice(0, 2)}.${limitado.slice(2)}`;
    } else if (limitado.length <= 8) {
        return `${limitado.slice(0, 2)}.${limitado.slice(2, 5)}.${limitado.slice(5)}`;
    } else if (limitado.length <= 12) {
        return `${limitado.slice(0, 2)}.${limitado.slice(2, 5)}.${limitado.slice(5, 8)}/${limitado.slice(8)}`;
    } else {
        return `${limitado.slice(0, 2)}.${limitado.slice(2, 5)}.${limitado.slice(5, 8)}/${limitado.slice(8, 12)}-${limitado.slice(12)}`;
    }
};

/**
 * Remove formatação do CNPJ, deixando apenas números
 * @param {string} cnpj - CNPJ formatado
 * @returns {string} CNPJ apenas com números
 */
export const limparCNPJ = (cnpj) => {
    return cnpj.replace(/\D/g, '');
};

/**
 * Valida se um CNPJ é válido usando o algoritmo de dígitos verificadores
 * @param {string} cnpj - CNPJ com ou sem formatação
 * @returns {boolean} true se válido, false se inválido
 */
export const validarCNPJ = (cnpj) => {
    const cnpjLimpo = limparCNPJ(cnpj);
    
    // Verifica se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
        return false;
    }
    
    // Verifica se todos os dígitos são iguais (ex: 00000000000000)
    if (/^(\d)\1+$/.test(cnpjLimpo)) {
        return false;
    }
    
    // Validação do primeiro dígito verificador
    let tamanho = cnpjLimpo.length - 2;
    let numeros = cnpjLimpo.substring(0, tamanho);
    const digitos = cnpjLimpo.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) {
            pos = 9;
        }
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) {
        return false;
    }
    
    // Validação do segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpjLimpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) {
            pos = 9;
        }
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) {
        return false;
    }
    
    return true;
};

/**
 * Retorna uma mensagem de erro amigável para validação de CNPJ
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {string|null} Mensagem de erro ou null se válido
 */
export const validarCNPJComMensagem = (cnpj) => {
    const cnpjLimpo = limparCNPJ(cnpj);
    
    if (!cnpj || cnpjLimpo.length === 0) {
        return 'Por favor, digite um CNPJ.';
    }
    
    if (cnpjLimpo.length < 14) {
        return `CNPJ incompleto. Digite os 14 dígitos (faltam ${14 - cnpjLimpo.length}).`;
    }
    
    if (!validarCNPJ(cnpj)) {
        return 'CNPJ inválido. Verifique os dígitos verificadores.';
    }
    
    return null;
};

