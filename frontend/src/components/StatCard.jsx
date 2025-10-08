import { formatCurrency } from '@/utils/formatters';

/**
 * Componente de card para exibir uma estatística ou valor chave.
 */
const StatCard = ({ title, value, formatAsCurrency = true }) => (
    <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-foreground dark:text-dark-foreground">
            {formatAsCurrency ? formatCurrency(value) : value}
        </p>
    </div>
);

export default StatCard;
