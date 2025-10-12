import React, { useState } from 'react';
import { useClientes } from '../hooks/useClientes';
import { useNavigate } from 'react-router-dom';
import CNPJModal from '../components/CNPJModal';
import AdicionarClienteModal from '../components/AdicionarClienteModal';

function GerenciarClientes() {
    const navigate = useNavigate();
    const { clientes, loading, error, refreshClientes } = useClientes();
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdicionarModalOpen, setIsAdicionarModalOpen] = useState(false);

    const handleClienteClick = (cliente) => {
        setSelectedCliente(cliente);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCliente(null);
    };

    const handleClienteDeleted = () => {
        refreshClientes(); // Recarrega a lista após deletar
    };

    const handleOpenAdicionarModal = () => {
        setIsAdicionarModalOpen(true);
    };

    const handleCloseAdicionarModal = () => {
        setIsAdicionarModalOpen(false);
    };

    const handleClienteAdded = () => {
        refreshClientes(); // Recarrega a lista de clientes
    };

    if (loading) {
        return (
            <div className="text-center mt-8 text-foreground dark:text-dark-foreground">
                Carregando clientes...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-danger bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="mb-6 inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-opacity-90 dark:bg-dark-muted transition-colors"
            >
                &larr; Voltar à página anterior
            </button>
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                    Gerenciar Clientes
                </h1>
                <button 
                    onClick={handleOpenAdicionarModal}
                    className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Adicionar Cliente</span>
                </button>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-default dark:divide-dark-border-default">
                        <thead className="bg-background dark:bg-dark-card">
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default dark:divide-dark-border-default">
                            {clientes.map((cliente) => (
                                <tr 
                                    key={cliente.id} 
                                    className="hover:bg-background dark:hover:bg-dark-background transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground dark:text-dark-foreground">
                                        {cliente.razao_social}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted dark:text-slate-400">
                                        {cliente.cnpj}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                        {cliente.regime_tributario}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleClienteClick(cliente)}
                                            className="text-primary hover:text-primary-hover font-medium transition-colors"
                                        >
                                            Ver Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && selectedCliente && (
                <CNPJModal 
                    cliente={selectedCliente} 
                    onClose={handleCloseModal}
                    onClienteDeleted={handleClienteDeleted}
                />
            )}

            {isAdicionarModalOpen && (
                <AdicionarClienteModal 
                    onClose={handleCloseAdicionarModal}
                    onClienteAdded={handleClienteAdded}
                />
            )}
        </>
    );
}

export default GerenciarClientes;
