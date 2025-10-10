import { BarChart } from '@mui/x-charts/BarChart';
import { useThemeColors } from '@/hooks/useThemeColors';

function FaturamentoVsImpostoChart({ data }) {
    const colors = useThemeColors();
    
    // Converte os dados para o formato esperado pelo MUI Charts
    const chartData = data.meses.map((mes, index) => ({
        mes: mes,
        faturamento: data.faturamento[index],
        imposto: data.imposto[index],
    }));

    return (
        <div className="w-full h-full">
            <BarChart
                // Removemos width e height para que o gráfico se ajuste 100% ao container pai.
                // Controlamos o espaço interno com a propriedade 'margin'.
                margin={{ top: 30, bottom: 40, left: 70, right: 20 }}
                series={[
                    {
                        data: chartData.map(item => item.faturamento),
                        label: 'Faturamento',
                        color: colors.primary,
                    },
                    {
                        data: chartData.map(item => item.imposto),
                        label: 'Imposto',
                        color: colors.secondary,
                    },
                ]}
                xAxis={[
                    {
                        data: chartData.map(item => item.mes),
                        scaleType: 'band',
                    },
                ]}
                yAxis={[
                    {
                        label: 'Valores (R$)',
                        valueFormatter: (value) => `R$ ${value.toLocaleString('pt-BR')}`,
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

export default FaturamentoVsImpostoChart;