import { useState, useEffect } from 'react';
import { getClientes } from '../services/clienteApi';

function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await getClientes();
                setClientes(data);
            } catch (err) {
                setError('Não foi possível carregar os clientes. Verifique a conexão com o servidor.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, []); // O array vazio garante que a busca seja feita apenas uma vez

    if (loading) {
        return <div className="text-center mt-8">Carregando clientes...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-danger bg-red-100 rounded-lg">{error}</div>;
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground">Gerenciar Clientes</h1>
                <button className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                    Adicionar Cliente
                </button>
            </div>

            <div className="bg-card rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-default">
                        <thead className="bg-card">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                    Razão Social
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                    CNPJ
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                    Regime Tributário
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {clientes.map((cliente) => (
                                <tr key={cliente.id} className="hover:bg-background transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{cliente.razao_social}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{cliente.cnpj}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{cliente.regime_tributario}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default ClientesPage;