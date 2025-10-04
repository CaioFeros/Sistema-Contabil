import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientes } from '../hooks/useClientes';
import { useRelatorio } from '../hooks/useRelatorio';
import RelatorioFilterForm from '../components/RelatorioFilterForm';
import RelatorioResult from '../components/RelatorioResult';

function RelatoriosPage() {
    const navigate = useNavigate();

    // Hooks para encapsular a lógica
    const { clientes, loading: loadingClientes, error: errorClientes } = useClientes();
    const { relatorio, loading, error, infoMessage, gerarRelatorio } = useRelatorio();
    const [formError, setFormError] = useState('');

    const handleGerarRelatorio = async (params) => {
        setFormError('');
        await gerarRelatorio(params);
    };

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="mb-6 px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-opacity-90 dark:bg-dark-muted transition-colors"
            >
                &larr; Voltar à página anterior
            </button>
            <h1 className="text-2xl font-bold mb-6 text-foreground dark:text-dark-foreground">Relatório Anual de Faturamento</h1>

            {/* Seção de Filtros */}
            <RelatorioFilterForm
                clientes={clientes}
                loading={loading || loadingClientes}
                onSubmit={handleGerarRelatorio}
                formError={formError}
            />

            {errorClientes && <div className="p-3 mb-4 text-danger bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">{errorClientes}</div>}
            {error && <div className="p-3 mb-4 text-danger bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">{error}</div>}
            {infoMessage && <div className="p-3 mb-4 text-sky-800 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 rounded-lg">{infoMessage}</div>}

            {/* Seção de Resultados */}
            <RelatorioResult relatorio={relatorio} />
        </>
    );
}

export default RelatoriosPage;