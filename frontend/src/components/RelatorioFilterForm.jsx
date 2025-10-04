import { useState } from 'react';

function RelatorioFilterForm({ clientes, loading, onSubmit, formError }) {
    const [filterType, setFilterType] = useState('ano');
    const [clienteId, setClienteId] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [ano, setAno] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [internalFormError, setInternalFormError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setInternalFormError('');

        if (!clienteId) {
            setInternalFormError('Por favor, selecione um cliente.');
            return;
        }
        if (filterType === 'periodo' && (!dataInicio || !dataFim)) {
            setInternalFormError('Por favor, preencha a data de início e a data de fim.');
            return;
        }

        onSubmit({
            cliente_id: clienteId,
            tipo_filtro: filterType,
            ano,
            mes,
            data_inicio: dataInicio,
            data_fim: dataFim,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border border-border-default dark:border-dark-border-default rounded-lg bg-card dark:bg-dark-card shadow-md mb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground"
                    required
                >
                    <option value="">Selecione um Cliente</option>
                    {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.razao_social}</option>
                    ))}
                </select>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground"
                >
                    <option value="ano">Por Ano</option>
                    <option value="mes">Por Mês</option>
                    <option value="ultimos_12_meses">Últimos 12 Meses</option>
                    <option value="ultimos_13_meses">Últimos 13 Meses</option>
                    <option value="periodo">Por Período</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filterType === 'mes' && (
                    <input
                        type="number"
                        placeholder="Mês (1-12)"
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground"
                        required min="1" max="12"
                    />
                )}
                {(filterType === 'ano' || filterType === 'mes') && (
                    <input
                        type="number"
                        placeholder="Ano (AAAA)"
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground"
                        required
                    />
                )}
                {filterType === 'periodo' && (
                    <>
                        <input
                            type="month"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground"
                            required
                        />
                        <input
                            type="month"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground"
                            required
                        />
                    </>
                )}
            </div>

            {internalFormError && <div className="p-3 text-danger bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">{internalFormError}</div>}
            {formError && <div className="p-3 text-danger bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">{formError}</div>}

            <button type="submit" disabled={loading} className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 transition-colors">
                {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
        </form>
    );
}

export default RelatorioFilterForm;