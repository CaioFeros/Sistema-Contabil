import { useState, useEffect } from 'react';
import { getClientes as fetchClientesApi } from '../services/clienteApi';

/**
 * Hook para buscar e gerenciar a lista de clientes.
 * Encapsula o estado de loading, erro e os dados dos clientes.
 * @returns {{clientes: Array, loading: boolean, error: string}}
 */
export function useClientes() {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchClientes = async () => {
        try {
            setLoading(true);
            const data = await fetchClientesApi();
            setClientes(data);
            setError('');
        } catch (err) {
            setError(err.message || 'Falha ao carregar a lista de clientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClientes();
    }, []); // Executa apenas uma vez na montagem do componente

    const refreshClientes = () => {
        fetchClientes();
    };

    return { clientes, loading, error, refreshClientes };
}