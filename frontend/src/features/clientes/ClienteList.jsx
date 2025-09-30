function ClienteList({ clientes }) {
    if (clientes.length === 0) {
        return <p className="text-gray-500">Nenhum cliente cadastrado ainda.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="py-2 px-4 border-b text-left">Razão Social</th>
                        <th className="py-2 px-4 border-b text-left">CNPJ</th>
                        <th className="py-2 px-4 border-b text-left">Regime Tributário</th>
                    </tr>
                </thead>
                <tbody>
                    {clientes.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b">{cliente.razao_social}</td>
                            <td className="py-2 px-4 border-b">{cliente.cnpj}</td>
                            <td className="py-2 px-4 border-b">{cliente.regime_tributario}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ClienteList;
