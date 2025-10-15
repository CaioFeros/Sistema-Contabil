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
            {relatorio.historico_13_meses && (() => {
                // Verifica quantas notas fiscais existem
                const totalNotas = Array.isArray(relatorio.notas_fiscais_mes) ? relatorio.notas_fiscais_mes.length : 0;
                const muitasNotas = totalNotas >= 15;

                // Componente do Box de Histórico
                const BoxHistorico = (
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-dark-foreground print:text-base">Histórico (Faturamento e Alíquota)</h3>
                        <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break print:shadow-none" style={{ height: '36rem' }}>
                            <div className="h-full p-4 overflow-y-auto print:overflow-visible print:h-auto">
                                {relatorio.historico_13_meses ? (
                                    <ul className="space-y-2 text-foreground dark:text-dark-foreground print:space-y-1">
                                        {relatorio.historico_13_meses.meses.map((mesLabel, idx) => {
                                            const [mm, aa] = mesLabel.split('/');
                                            const mesNum = Math.max(1, Math.min(12, parseInt(mm, 10) || 0));
                                            const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
                                            const nomeMes = nomesMes[mesNum - 1] || mesLabel;
                                            const fatur = relatorio.historico_13_meses.faturamento[idx] || 0;
                                            const aliq = relatorio.historico_13_meses.aliquotas[idx] || 0;
                                            return (
                                                <li key={mesLabel} className="flex items-center justify-between border-b border-border-default dark:border-dark-border-default pb-2 last:border-b-0 last:pb-0 print:pb-1 print:text-sm">
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
                );

                // Componente do Box de Notas Fiscais
                const BoxNotas = (
                    <div>
                        <div 
                            className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break print:shadow-none" 
                            style={muitasNotas ? { maxHeight: '60rem' } : { height: '36rem' }}
                        >
                            <div className={`p-4 ${muitasNotas ? 'overflow-y-auto' : 'h-full overflow-y-auto'} print:overflow-visible print:h-auto`}>
                                <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-dark-foreground print:text-base print:mt-4 print:mb-4">
                                    Notas Fiscais do Mês {totalNotas > 0 && `(${totalNotas} nota${totalNotas > 1 ? 's' : ''})`}
                                </h3>
                                {totalNotas > 0 ? (
                                    <ul className="space-y-2 text-foreground dark:text-dark-foreground print:space-y-1">
                                        {relatorio.notas_fiscais_mes.map((n, idx) => (
                                            <li key={idx} className="flex items-center justify-between border-b border-border-default dark:border-dark-border-default pb-2 last:border-b-0 last:pb-0 print:pb-1 print:text-sm">
                                                <span className="font-medium truncate pr-4" title={n.descricao_servico}>{n.descricao_servico}</span>
                                                <span className="text-sm font-mono whitespace-nowrap print:text-xs">{formatCurrency(n.valor)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-foreground/80 dark:text-dark-foreground/80">Nenhuma nota fiscal encontrada para o mês selecionado.</div>
                                )}
                            </div>
                        </div>
                    </div>
                );

                // Layout condicional
                if (muitasNotas) {
                    // Muitas notas (>=15): Apenas Histórico aqui (largura total)
                    // Notas serão renderizadas depois dos gráficos
                    return (
                        <div className="mt-8">
                            {BoxHistorico}
                        </div>
                    );
                } else {
                    // Poucas notas (<15): Layout lado a lado (2 colunas)
                    return (
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {BoxNotas}
                            {BoxHistorico}
                        </div>
                    );
                }
            })()}

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

            {/* Box de Notas Fiscais - DEPOIS DOS GRÁFICOS quando há muitas notas (>=15) */}
            {relatorio.historico_13_meses && (() => {
                const totalNotas = Array.isArray(relatorio.notas_fiscais_mes) ? relatorio.notas_fiscais_mes.length : 0;
                const muitasNotas = totalNotas >= 15;

                if (!muitasNotas) return null; // Só renderiza se houver 15+ notas

                // Nova lógica: Dividir em boxes de até 99 notas
                const notasPorBox = 99;
                const totalBoxes = Math.ceil(totalNotas / notasPorBox);
                const boxes = [];

                // Criar os boxes
                for (let boxIdx = 0; boxIdx < totalBoxes; boxIdx++) {
                    const inicio = boxIdx * notasPorBox;
                    const fim = Math.min(inicio + notasPorBox, totalNotas);
                    const notasDoBox = relatorio.notas_fiscais_mes.slice(inicio, fim);
                    
                    // Determina quantas colunas usar baseado na quantidade de notas do box
                    let numColunas = 1;
                    let gridClass = '';
                    let printGridClass = '';
                    
                    if (notasDoBox.length <= 33) {
                        numColunas = 1;
                        gridClass = 'grid-cols-1';
                        printGridClass = 'print:grid-cols-1';
                    } else if (notasDoBox.length <= 66) {
                        numColunas = 2;
                        gridClass = 'grid-cols-1 lg:grid-cols-2';
                        printGridClass = 'print:grid-cols-2';
                    } else {
                        // Mais de 66 notas: 3 colunas
                        numColunas = 3;
                        gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
                        printGridClass = 'print:grid-cols-3';
                    }

                    // Divide as notas do box em colunas
                    const notasPorColuna = Math.ceil(notasDoBox.length / numColunas);
                    const colunas = [];
                    for (let i = 0; i < numColunas; i++) {
                        const inicioCol = i * notasPorColuna;
                        const fimCol = Math.min(inicioCol + notasPorColuna, notasDoBox.length);
                        colunas.push(notasDoBox.slice(inicioCol, fimCol));
                    }

                    // Criar o título do box
                    const numeroInicio = inicio + 1;
                    const numeroFim = fim;
                    const tituloBox = totalBoxes > 1 
                        ? `Notas Fiscais do Mês - ${numeroInicio} a ${numeroFim} (${notasDoBox.length} nota${notasDoBox.length > 1 ? 's' : ''})`
                        : `Notas Fiscais do Mês (${totalNotas} nota${totalNotas > 1 ? 's' : ''})`;

                    boxes.push(
                        <div key={boxIdx} className={boxIdx > 0 ? "mt-8 print:mt-16" : "pt-4 print:pt-4"}>
                            <div className="bg-card dark:bg-dark-card rounded-lg shadow avoid-break print:shadow-none">
                                <div className="p-4 print:p-2">
                                    <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-dark-foreground print:text-xs print:mt-8 print:mb-4">
                                        {tituloBox}
                                        {numColunas > 1 && (
                                            <span className="text-sm font-normal text-muted ml-2 print:text-xs">
                                                • {numColunas} colunas
                                            </span>
                                        )}
                                    </h3>
                                    <div className={`grid ${gridClass} ${printGridClass} gap-6 print:gap-4`}>
                                        {colunas.map((notasColuna, colIdx) => (
                                            <div key={colIdx}>
                                                <ul className="space-y-2 text-foreground dark:text-dark-foreground print:space-y-1">
                                                    {notasColuna.map((n, idx) => (
                                                        <li key={idx} className="flex items-center justify-between border-b border-border-default dark:border-dark-border-default pb-2 last:border-b-0 last:pb-0 print:pb-1 print:text-xs">
                                                            <span className="font-medium truncate pr-4 print:font-normal print:text-[0.7rem]" title={n.descricao_servico}>{n.descricao_servico}</span>
                                                            <span className="text-sm font-mono whitespace-nowrap print:text-[0.7rem]">{formatCurrency(n.valor)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                return <>{boxes}</>;
            })()}

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