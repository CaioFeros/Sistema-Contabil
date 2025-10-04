import { useState, useEffect, useCallback } from 'react';
import { getClientes } from '../services/clienteApi';
import { processarFaturamento, getProcessamentos } from '../services/faturamentoApi';

export function useFaturamento() {
    // Estados para os dados do formulário
    const [clienteId, setClienteId] = useState('');
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [arquivo, setArquivo] = useState(null);
    const [clientes, setClientes] = useState([]);

    // Estados para controle da UI
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingClientes, setIsLoadingClientes] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Estado para processamentos recentes
    const [recentProcessamentos, setRecentProcessamentos] = useState([]);

    const fetchProcessamentos = useCallback(async () => {
        try {
            const data = await getProcessamentos();
            setRecentProcessamentos(data.slice(0, 5));
        } catch (err) {
            console.error("Erro ao buscar processamentos recentes:", err);
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingClientes(true);
            try {
                const clientesData = await getClientes();
                setClientes(clientesData);
                await fetchProcessamentos();
            } catch (err) {
                setError('Falha ao carregar dados iniciais. Tente recarregar a página.');
                console.error(err);
            } finally {
                setIsLoadingClientes(false);
            }
        };
        fetchInitialData();
    }, [fetchProcessamentos]);

    const handleFileChange = (e) => {
        setArquivo(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clienteId || !mes || !ano || !arquivo) {
            setError('Todos os campos, incluindo o arquivo, são obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setSuccess('');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('cliente_id', clienteId);
        formData.append('mes', mes);
        formData.append('ano', ano);
        formData.append('arquivo', arquivo);

        try {
            const onUploadProgress = (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            };

            const response = await processarFaturamento(formData, onUploadProgress);
            setSuccess(response.mensagem || 'Faturamento processado com sucesso!');
            setTimeout(() => setSuccess(''), 5000);

            await fetchProcessamentos();

            setClienteId('');
            setArquivo(null);
            document.getElementById('arquivo').value = '';
        } catch (err) {
            setError(err.response?.data?.erro || 'Ocorreu um erro ao processar o faturamento.');
            setTimeout(() => setError(''), 5000);
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    return {
        formState: { clienteId, mes, ano, arquivo, clientes },
        uiState: { isSubmitting, isLoadingClientes, error, success, uploadProgress },
        recentProcessamentos,
        setters: { setClienteId, setMes, setAno },
        handlers: { handleFileChange, handleSubmit },
    };
}