import { formatCurrency } from '@/utils/formatters';
import StatCard from './StatCard';
import FaturamentoVsImpostoChart from './charts/FaturamentoVsImpostoChart';
import EvolucaoAliquotaChart from './charts/EvolucaoAliquotaChart';

// Helper para formatar a alíquota como porcentagem (ex: 0.06 -> 6,00%)
const formatPercentage = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

function RelatorioResult({ relatorio }) {
    if (!relatorio) {
        return null;
    }

    return (
        <div className="space-y-8">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 avoid-break">
                <StatCard title="Relatório para" value={relatorio.cliente.razao_social} formatAsCurrency={false} />
                <StatCard title="Faturamento no Período" value={relatorio.faturamento_total} />
                <StatCard title="Imposto no Período" value={relatorio.imposto_total} />
            </div>

            {/* Detalhamento Mensal */}
            <div className="avoid-break">
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Fator R</th>
                                {relatorio.historico_13_meses && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Alíquota Próx. Mês</th>
                                )}
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
                                    <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-400">
                                        {formatCurrency(item.fator_r || 0)}
                                    </td>
                                    {relatorio.historico_13_meses && (
                                        <td className="px-6 py-4">{formatPercentage(item.aliquota_futura)}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Boxes de Lista - APENAS PARA RELATÓRIO MENSAL */}
            {relatorio.historico_13_meses && (
                <>
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-dark-foreground">Notas Fiscais do Mês</h3>
                            <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break" style={{ height: '36rem' }}>
                                <div className="h-full p-4 overflow-y-auto print:overflow-visible">
                                    {Array.isArray(relatorio.notas_fiscais_mes) && relatorio.notas_fiscais_mes.length > 0 ? (
                                        <ul className="space-y-2 text-foreground dark:text-dark-foreground">
                                            {relatorio.notas_fiscais_mes.map((n, idx) => (
                                                <li key={idx} className="flex items-center justify-between border-b border-border-default dark:border-dark-border-default pb-2 last:border-b-0 last:pb-0">
                                                    <span className="font-medium truncate pr-4" title={n.descricao_servico}>{n.descricao_servico}</span>
                                                    <span className="text-sm font-mono whitespace-nowrap">{formatCurrency(n.valor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-foreground/80 dark:text-dark-foreground/80">Nenhuma nota fiscal encontrada para o mês selecionado.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-dark-foreground">Histórico (Faturamento e Alíquota)</h3>
                            <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break" style={{ height: '36rem' }}>
                                <div className="h-full p-4 overflow-y-auto print:overflow-visible">
                                    {relatorio.historico_13_meses ? (
                                        <ul className="space-y-2 text-foreground dark:text-dark-foreground">
                                            {relatorio.historico_13_meses.meses.map((mesLabel, idx) => {
                                                const [mm, aa] = mesLabel.split('/');
                                                const mesNum = Math.max(1, Math.min(12, parseInt(mm, 10) || 0));
                                                const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
                                                const nomeMes = nomesMes[mesNum - 1] || mesLabel;
                                                const fatur = relatorio.historico_13_meses.faturamento[idx] || 0;
                                                const aliq = relatorio.historico_13_meses.aliquotas[idx] || 0;
                                                return (
                                                    <li key={mesLabel} className="flex items-center justify-between border-b border-border-default dark:border-dark-border-default pb-2 last:border-b-0 last:pb-0">
                                                        <span className="font-medium">{`${nomeMes} / ${aa || ''}`}</span>
                                                        <span className="text-sm font-mono whitespace-nowrap">{formatCurrency(fatur)} - {formatPercentage(aliq)}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="text-foreground/80 dark:text-dark-foreground/80">Sem histórico disponível.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Gráficos de Histórico (Relatório Mensal) */}
            {relatorio.historico_13_meses && (
                <div className="mt-8 avoid-break">
                    <h2 className="text-xl font-bold mb-4 text-foreground dark:text-dark-foreground">Histórico dos Últimos 13 Meses</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break" style={{ height: '24rem' }}>
                            <FaturamentoVsImpostoChart
                                data={{
                                    meses: relatorio.historico_13_meses.meses,
                                    faturamento: relatorio.historico_13_meses.faturamento,
                                    imposto: relatorio.historico_13_meses.imposto,
                                }}
                            />
                        </div>
                        <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break" style={{ height: '24rem' }}>
                            <EvolucaoAliquotaChart
                                data={{
                                    meses: relatorio.historico_13_meses.meses,
                                    aliquotas: relatorio.historico_13_meses.aliquotas,
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Gráficos do Período (Relatório Anual/Outros) */}
            {relatorio.dados_graficos && !relatorio.historico_13_meses && (
                <div className="mt-8 avoid-break">
                    <h2 className="text-xl font-bold mb-4 text-foreground dark:text-dark-foreground">Resumo Gráfico do Período</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break" style={{ height: '24rem' }}>
                            <FaturamentoVsImpostoChart
                                data={relatorio.dados_graficos.faturamento_vs_imposto}
                            />
                        </div>
                        <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break" style={{ height: '24rem' }}>
                            <EvolucaoAliquotaChart
                                data={relatorio.dados_graficos.evolucao_aliquota}
                            />
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}

export default RelatorioResult;