/**
 * Formata um número para o padrão de moeda BRL (R$ 1.234,56).
 * @param {number} value - O valor a ser formatado.
 */
export const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);