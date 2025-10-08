import Plot from 'react-plotly.js';
import { useThemeColors } from '@/hooks/useThemeColors';

function FaturamentoVsImpostoChart({ data }) {
    const colors = useThemeColors();
    
    const plotData = [
        {
            x: data.meses,
            y: data.faturamento,
            type: 'bar',
            name: 'Faturamento',
            marker: {
                color: colors.primary,
            },
        },
        {
            x: data.meses,
            y: data.imposto,
            type: 'bar',
            name: 'Imposto',
            marker: {
                color: colors.secondary,
            },
        },
    ];

    const layout = {
        title: 'Faturamento vs. Imposto',
        barmode: 'group',
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
            color: colors.foreground,
        },
        xaxis: {
            gridcolor: colors.border,
        },
        yaxis: {
            title: 'Valores (R$)',
            gridcolor: colors.border,
        },
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
        },
        // Margens ajustadas para um visual mais limpo
        margin: { l: 60, r: 20, t: 60, b: 40 },
    };

    return (
        <Plot
            data={plotData}
            layout={layout}
            useResizeHandler={true}
            className="w-full h-full"
        />
    );
}

export default FaturamentoVsImpostoChart;