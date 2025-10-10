import { LineChart } from '@mui/x-charts/LineChart';
import { useThemeColors } from '@/hooks/useThemeColors';

function EvolucaoAliquotaChart({ data }) {
    const colors = useThemeColors();
    
    // Converte os dados para o formato esperado pelo MUI Charts
    const chartData = data.meses.map((mes, index) => ({
        x: mes,
        y: data.aliquotas[index] * 100, // Converte para porcentagem (0.06 -> 6)
    }));

    return (
        <div className="w-full h-full">
            <LineChart
                // Removemos width e height para que o gráfico se ajuste 100% ao container pai.
                // A biblioteca de gráficos fará isso por padrão se as props forem omitidas.
                // Controlamos o espaço interno com a propriedade 'margin'.
                margin={{ top: 30, bottom: 40, left: 70, right: 20 }}
                series={[
                    {
                        data: chartData.map(item => item.y),
                        label: 'Alíquota Efetiva',
                        color: colors.secondary,
                    },
                ]}
                xAxis={[
                    {
                        data: chartData.map(item => item.x),
                        scaleType: 'point',
                    },
                ]}
                yAxis={[
                    {
                        label: 'Alíquota (%)',
                        valueFormatter: (value) => `${value.toFixed(2)}%`,
                    },
                ]}
                grid={{ vertical: true, horizontal: true }}
                sx={{
                    '& .MuiChartsAxis-root': {
                        stroke: colors.border,
                    },
                    '& .MuiChartsGrid-root': {
                        stroke: colors.border,
                    },
                    '& .MuiChartsAxis-tickLabel': {
                        fill: colors.foreground,
                    },
                    '& .MuiChartsAxis-label': {
                        fill: colors.foreground,
                    },
                    '& .MuiChartsLegend-root': {
                        fill: colors.foreground,
                    },
                }}
            />
        </div>
    );
}

export default EvolucaoAliquotaChart;