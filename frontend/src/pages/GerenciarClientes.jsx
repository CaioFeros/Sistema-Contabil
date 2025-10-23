import React, { useState, useMemo } from 'react';
import { useClientes } from '../hooks/useClientes';
import { useNavigate } from 'react-router-dom';
import { Building, User } from 'lucide-react';
import CNPJModal from '../components/CNPJModal';
import ClientePFModal from '../components/ClientePFModal';
import AdicionarClienteModal from '../components/AdicionarClienteModal';
import CadastroClientePFModal from '../components/CadastroClientePFModal';

function GerenciarClientes() {
    const navigate = useNavigate();
    const { clientes, loading, error, refreshClientes } = useClientes();
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdicionarModalOpen, setIsAdicionarModalOpen] = useState(false);
    const [isAdicionarPFModalOpen, setIsAdicionarPFModalOpen] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState('PJ'); // 'PJ' ou 'PF'

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

    const handleOpenAdicionarPFModal = () => {
        setIsAdicionarPFModalOpen(true);
    };

    const handleCloseAdicionarPFModal = () => {
        setIsAdicionarPFModalOpen(false);
    };

    // Filtra clientes por tipo de pessoa
    const clientesFiltrados = useMemo(() => {
        if (!clientes) return [];
        return clientes.filter(cliente => 
            abaAtiva === 'PJ' 
                ? (cliente.tipo_pessoa === 'PJ' || !cliente.tipo_pessoa) // Compatibilidade com dados antigos
                : cliente.tipo_pessoa === 'PF'
        );
    }, [clientes, abaAtiva]);

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
            
            <div className="flex flex-col space-y-4 mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                        Gerenciar Clientes
                    </h1>
                    <div className="flex items-center space-x-3">
                        {abaAtiva === 'PJ' ? (
                            <button 
                                onClick={handleOpenAdicionarModal}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center space-x-2"
                            >
                                <Building className="w-5 h-5" />
                                <span>Adicionar PJ</span>
                            </button>
                        ) : (
                            <button 
                                onClick={handleOpenAdicionarPFModal}
                                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all flex items-center space-x-2"
                            >
                                <User className="w-5 h-5" />
                                <span>Adicionar PF</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Abas PF/PJ */}
                <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setAbaAtiva('PJ')}
                        className={`px-6 py-3 font-medium transition-all flex items-center space-x-2 ${
                            abaAtiva === 'PJ'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Building className="w-5 h-5" />
                        <span>Pessoa Jurídica</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                            {clientes.filter(c => c.tipo_pessoa === 'PJ' || !c.tipo_pessoa).length}
                        </span>
                    </button>
                    <button
                        onClick={() => setAbaAtiva('PF')}
                        className={`px-6 py-3 font-medium transition-all flex items-center space-x-2 ${
                            abaAtiva === 'PF'
                                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <User className="w-5 h-5" />
                        <span>Pessoa Física</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
                            {clientes.filter(c => c.tipo_pessoa === 'PF').length}
                        </span>
                    </button>
                </div>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                {clientesFiltrados.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            {abaAtiva === 'PJ' ? (
                                <Building className="w-8 h-8 text-gray-400" />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhum cliente {abaAtiva === 'PJ' ? 'pessoa jurídica' : 'pessoa física'} cadastrado
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Clique no botão acima para adicionar o primeiro cliente
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border-default dark:divide-dark-border-default">
                            <thead className="bg-background dark:bg-dark-card">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                        {abaAtiva === 'PJ' ? 'Razão Social' : 'Nome Completo'}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                        {abaAtiva === 'PJ' ? 'CNPJ' : 'CPF'}
                                    </th>
                                    {abaAtiva === 'PJ' && (
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                            Regime Tributário
                                        </th>
                                    )}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                        {abaAtiva === 'PF' ? 'Email' : 'Ações'}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default dark:divide-dark-border-default">
                                {clientesFiltrados.map((cliente) => (
                                    <tr 
                                        key={cliente.id} 
                                        className="hover:bg-background dark:hover:bg-dark-background transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground dark:text-dark-foreground">
                                            {abaAtiva === 'PJ' ? cliente.razao_social : cliente.nome_completo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted dark:text-slate-400">
                                            {abaAtiva === 'PJ' ? cliente.cnpj : cliente.cpf}
                                        </td>
                                        {abaAtiva === 'PJ' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                                {cliente.regime_tributario}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted dark:text-slate-400">
                                            {abaAtiva === 'PF' ? (cliente.email || '-') : ''}
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
                )}
            </div>

            {isModalOpen && selectedCliente && (
                selectedCliente.tipo_pessoa === 'PF' ? (
                    <ClientePFModal 
                        cliente={selectedCliente} 
                        onClose={handleCloseModal}
                        onClienteDeleted={handleClienteDeleted}
                    />
                ) : (
                    <CNPJModal 
                        cliente={selectedCliente} 
                        onClose={handleCloseModal}
                        onClienteDeleted={handleClienteDeleted}
                    />
                )
            )}

            {isAdicionarModalOpen && (
                <AdicionarClienteModal 
                    onClose={handleCloseAdicionarModal}
                    onClienteAdded={handleClienteAdded}
                />
            )}

            {isAdicionarPFModalOpen && (
                <CadastroClientePFModal 
                    onCadastrado={(cliente) => {
                        handleClienteAdded();
                        handleCloseAdicionarPFModal();
                    }}
                    onCancelar={handleCloseAdicionarPFModal}
                />
            )}
        </>
    );
}

export default GerenciarClientes;
