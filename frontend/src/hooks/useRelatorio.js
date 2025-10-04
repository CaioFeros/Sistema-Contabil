import { useState } from 'react';
import { getRelatorioFaturamento } from '../services/relatoriosApi';

/**
 * Hook para gerenciar a geração e o estado de relatórios de faturamento.
 * @returns {{
 *   relatorio: object|null,
 *   loading: boolean,
 *   error: string,
 *   infoMessage: string,
 *   gerarRelatorio: (params: object) => Promise<void>
 * }}
 */
export function useRelatorio() {
    const [relatorio, setRelatorio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [infoMessage, setInfoMessage] = useState('');

    const gerarRelatorio = async (params) => {
        setLoading(true);
        setError('');
        setInfoMessage('');
        setRelatorio(null);

        try {
            const data = await getRelatorioFaturamento(params);

            if (data.mensagem) {
                setInfoMessage(data.mensagem);
            } else {
                setRelatorio(data);
            }
        } catch (err) {
            setError(err.message || 'Ocorreu um erro ao gerar o relatório.');
        } finally {
            setLoading(false);
        }
    };

    return { relatorio, loading, error, infoMessage, gerarRelatorio };
}