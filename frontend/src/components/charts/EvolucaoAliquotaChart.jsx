import Plot from 'react-plotly.js';
import { useThemeColors } from '@/hooks/useThemeColors';

function EvolucaoAliquotaChart({ data }) {
    const colors = useThemeColors();
    
    const plotData = [
        {
            x: data.meses,
            y: data.aliquotas, // Mantém o valor original (ex: 0.06)
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Alíquota Efetiva',
            marker: {
                color: colors.secondary,
            },
        },
    ];

    const layout = {
        title: 'Evolução da Alíquota Efetiva (%)',
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
            color: colors.foreground,
        },
        xaxis: { gridcolor: colors.border },
        yaxis: {
            gridcolor: colors.border,
            tickformat: '.2%', // Formata o eixo Y como porcentagem (ex: 0.06 -> 6.00%)
        },
        // Margens ajustadas para um visual mais limpo
        margin: { l: 60, r: 20, t: 60, b: 40 },
    };

    return (
        <Plot data={plotData} layout={layout} useResizeHandler={true} className="w-full h-full" />
    );
}

export default EvolucaoAliquotaChart;