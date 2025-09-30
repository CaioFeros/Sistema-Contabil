import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes } from '../services/clienteApi';
import { getRelatorioAnual } from '../services/relatoriosApi';
// Componente reutilizável para exibir estatísticas em cards
const StatCard = ({ title, value, formatAsCurrency = true }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">
            {formatAsCurrency ? `R$ ${Number(value).toFixed(2)}` : value}
        </p>
    </div>
);

function RelatoriosPage() {
    const navigate = useNavigate();
    // Estado para os filtros
    const [clienteId, setClienteId] = useState('');
    const [ano, setAno] = useState(new Date().getFullYear());
    const [clientes, setClientes] = useState([]);

    // Estado para controle da UI e dados do relatório
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [relatorio, setRelatorio] = useState(null);

    // Busca a lista de clientes ao carregar a página
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const data = await getClientes();
                setClientes(data);
            } catch (err) {
                setError('Falha ao carregar a lista de clientes.');
            }
        };
        fetchClientes();
    }, []);

    const handleGerarRelatorio = async (e) => {
        e.preventDefault();
        if (!clienteId || !ano) {
            setError('Por favor, selecione um cliente e um ano.');
            return;
        }

        setLoading(true);
        setError('');
        setRelatorio(null);

        try {
            const data = await getRelatorioAnual({ cliente_id: clienteId, ano });
            setRelatorio(data);
        } catch (err) {
            setRelatorio(null); // Limpa dados antigos em caso de erro
            setError(err.response?.data?.erro || 'Ocorreu um erro ao gerar o relatório.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="mb-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
                &larr; Voltar à página anterior
            </button>
            <h1 className="text-2xl font-bold mb-6">Relatório Anual de Faturamento</h1>

            {/* Seção de Filtros */}
            <form onSubmit={handleGerarRelatorio} className="p-6 border rounded-lg bg-white shadow-md mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <select
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        className="w-full p-2 border rounded md:col-span-2"
                        required
                    >
                        <option value="">Selecione um Cliente</option>
                        {clientes.map((c) => (
                            <option key={c.id} value={c.id}>{c.razao_social}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        placeholder="Ano (AAAA)"
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 transition-colors"
                >
                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
            </form>

            {error && <div className="p-3 mb-4 text-red-800 bg-red-100 rounded-lg">{error}</div>}

            {/* Seção de Resultados */}
            {relatorio && (
                <div className="space-y-8">
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Cliente" value={relatorio.cliente.razao_social} formatAsCurrency={false} />
                        <StatCard title="Faturamento Anual Total" value={relatorio.faturamento_anual_total} />
                        <StatCard title="Imposto Anual Total" value={relatorio.imposto_anual_total} />
                    </div>

                    {/* Detalhamento Mensal */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">Detalhamento Mensal</h2>
                        <div className="overflow-x-auto bg-white rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mês</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imposto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {relatorio.detalhamento_mensal.map((item) => (
                                        <tr key={item.mes}>
                                            <td className="px-6 py-4">{item.mes}</td>
                                            <td className="px-6 py-4">R$ {item.faturamento_total.toFixed(2)}</td>
                                            <td className="px-6 py-4">R$ {item.imposto_calculado.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detalhamento por Serviço */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">Detalhamento por Serviço (Top 10)</h2>
                        <div className="overflow-x-auto bg-white rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total Faturado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {relatorio.detalhamento_servicos.slice(0, 10).map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4">{item.servico}</td>
                                            <td className="px-6 py-4">R$ {item.valor_total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RelatoriosPage;