import React, { useState, useEffect } from 'react';
import { getBackups, restaurarCliente } from '../services/clienteApi';

function BackupManager({ onClienteRestaurado }) {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restaurando, setRestaurando] = useState(null);

    useEffect(() => {
        carregarBackups();
    }, []);

    const carregarBackups = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getBackups();
            setBackups(response.backups || []);
        } catch (err) {
            setError('Erro ao carregar backups: ' + (err.response?.data?.erro || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRestaurar = async (backupId, razaoSocial) => {
        if (!window.confirm(`Tem certeza que deseja restaurar o cliente "${razaoSocial}"?`)) {
            return;
        }

        try {
            setRestaurando(backupId);
            const response = await restaurarCliente(backupId);
            
            // Remove o backup da lista local
            setBackups(prev => prev.filter(backup => backup.id !== backupId));
            
            // Notifica o componente pai
            if (onClienteRestaurado) {
                onClienteRestaurado(response.cliente);
            }
            
            alert(`Cliente "${response.cliente.razao_social}" restaurado com sucesso!`);
        } catch (err) {
            alert('Erro ao restaurar cliente: ' + (err.response?.data?.erro || err.message));
        } finally {
            setRestaurando(null);
        }
    };

    const formatarData = (dataString) => {
        if (!dataString) return 'N/A';
        const data = new Date(dataString);
        return data.toLocaleString('pt-BR');
    };

    if (loading) {
        return (
            <div className="text-center p-4">
                <div className="text-foreground dark:text-dark-foreground">
                    Carregando backups...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-danger bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                {error}
                <button 
                    onClick={carregarBackups}
                    className="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    if (backups.length === 0) {
        return (
            <div className="text-center p-8 text-foreground dark:text-dark-foreground">
                <div className="text-lg mb-2">📦</div>
                <div className="text-lg font-medium mb-2">Nenhum backup encontrado</div>
                <div className="text-sm text-muted-foreground dark:text-dark-muted-foreground">
                    Os backups aparecerão aqui quando clientes forem excluídos
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
                    Clientes Excluídos ({backups.length})
                </h3>
                <button 
                    onClick={carregarBackups}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                    Atualizar
                </button>
            </div>
            
            <div className="space-y-3">
                {backups.map((backup) => (
                    <div 
                        key={backup.id} 
                        className="p-4 border border-border dark:border-dark-border rounded-lg bg-card dark:bg-dark-card"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-foreground dark:text-dark-foreground">
                                        {backup.razao_social}
                                    </h4>
                                    <span className="text-xs px-2 py-1 bg-muted dark:bg-dark-muted text-muted-foreground dark:text-dark-muted-foreground rounded">
                                        {backup.cnpj}
                                    </span>
                                </div>
                                
                                <div className="text-sm text-muted-foreground dark:text-dark-muted-foreground mb-2">
                                    <div>Regime: {backup.regime_tributario}</div>
                                    {backup.nome_fantasia && (
                                        <div>Fantasia: {backup.nome_fantasia}</div>
                                    )}
                                </div>
                                
                                <div className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
                                    Excluído em: {formatarData(backup.data_exclusao)}
                                </div>
                            </div>
                            
                            <button
                                onClick={() => handleRestaurar(backup.id, backup.razao_social)}
                                disabled={restaurando === backup.id}
                                className="ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {restaurando === backup.id ? 'Restaurando...' : 'Restaurar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BackupManager;