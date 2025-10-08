import { formatCurrency } from '../utils/formatters';
import StatCard from './StatCard';
import Plot from 'react-plotly.js';
import { useTheme } from '../context/ThemeContext';

// Helper para formatar a alíquota como porcentagem (ex: 0.06 -> 6,00%)
const formatPercentage = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

function RelatorioResult({ relatorio }) {
    const { theme } = useTheme();
    if (!relatorio) {
        return null;
    }

    return (
        <div className="space-y-8">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Relatório para" value={relatorio.cliente.razao_social} formatAsCurrency={false} />
                <StatCard title="Faturamento no Período" value={relatorio.faturamento_total} />
                <StatCard title="Imposto no Período" value={relatorio.imposto_total} />
            </div>

            {/* Detalhamento Mensal */}
            <div>
                <h2 className="text-xl font-bold mb-4 text-foreground dark:text-dark-foreground">Detalhamento Mensal</h2>
                <div className="overflow-x-auto bg-card dark:bg-dark-card rounded-lg shadow">
                    <table className="min-w-full divide-y divide-border-default dark:divide-dark-border-default">
                        <thead className="bg-background dark:bg-dark-muted/40">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Período</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Faturamento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Alíquota</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Imposto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Faturamento Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default dark:divide-dark-border-default text-foreground dark:text-dark-foreground">
                            {relatorio.detalhamento_mensal.map((item) => (
                                <tr key={`${item.ano}-${item.mes}`} className="even:bg-background dark:even:bg-dark-muted/40">
                                    <td className="px-6 py-4">{`${String(item.mes).padStart(2, '0')}/${item.ano}`}</td>
                                    <td className="px-6 py-4">{formatCurrency(item.faturamento_total)}</td>
                                    <td className="px-6 py-4">{formatPercentage(item.aliquota)}</td>
                                    <td className="px-6 py-4">{formatCurrency(item.imposto_calculado)}</td>
                                    <td className="px-6 py-4">{formatCurrency(item.faturamento_acumulado)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Gráficos */}
            {relatorio.dados_graficos && (
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Gráfico de Faturamento vs. Imposto */}
                    <div className="bg-card dark:bg-dark-card rounded-lg shadow p-4">
                        <Plot
                            data={[
                                {
                                    x: relatorio.dados_graficos.faturamento_vs_imposto.meses,
                                    y: relatorio.dados_graficos.faturamento_vs_imposto.faturamento,
                                    type: 'bar',
                                    name: 'Faturamento',
                                },
                                {
                                    x: relatorio.dados_graficos.faturamento_vs_imposto.meses,
                                    y: relatorio.dados_graficos.faturamento_vs_imposto.imposto,
                                    type: 'bar',
                                    name: 'Imposto',
                                },
                            ]}
                            layout={{
                                title: 'Faturamento vs. Imposto',
                                barmode: 'group',
                                autosize: true,
                                paper_bgcolor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                plot_bgcolor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                font: { color: theme === 'dark' ? '#cbd5e1' : '#334155' },
                            }}
                            useResizeHandler={true}
                            className="w-full h-full"
                        />
                    </div>

                    {/* Gráfico de Evolução da Alíquota */}
                    <div className="bg-card dark:bg-dark-card rounded-lg shadow p-4">
                        <Plot
                            data={[{
                                x: relatorio.dados_graficos.evolucao_aliquota.meses,
                                y: relatorio.dados_graficos.evolucao_aliquota.aliquotas.map(a => a * 100),
                                type: 'scatter',
                                mode: 'lines+markers',
                                name: 'Alíquota Efetiva (%)',
                            }]}
                            layout={{ title: 'Evolução da Alíquota Efetiva (%)', autosize: true, paper_bgcolor: theme === 'dark' ? '#1e293b' : '#ffffff', plot_bgcolor: theme === 'dark' ? '#1e293b' : '#ffffff', font: { color: theme === 'dark' ? '#cbd5e1' : '#334155' } }}
                            useResizeHandler={true}
                            className="w-full h-full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default RelatorioResult;