import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Filter, Download, Calendar, User, Activity, ArrowLeft } from 'lucide-react';

function HistoricoLogs() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtros, setFiltros] = useState({
        acao: '',
        entidade: '',
        usuario_id: '',
        page: 1,
        per_page: 50
    });
    const [acoes, setAcoes] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [estatisticas, setEstatisticas] = useState(null);
    const [paginacao, setPaginacao] = useState({});

    useEffect(() => {
        carregarDados();
    }, [filtros.page, filtros.per_page]);

    useEffect(() => {
        carregarFiltros();
        carregarEstatisticas();
    }, []);

    const carregarDados = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const params = new URLSearchParams();
            
            Object.entries(filtros).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await fetch(`/api/logs/?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar logs');
            }

            const data = await response.json();
            setLogs(data.logs);
            setPaginacao({
                total: data.total,
                pages: data.pages,
                current_page: data.current_page,
                per_page: data.per_page,
                has_next: data.has_next,
                has_prev: data.has_prev
            });
        } catch (err) {
            setError('Erro ao carregar logs: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const carregarFiltros = async () => {
        try {
            const token = localStorage.getItem('authToken');
            
            const [acoesRes, entidadesRes] = await Promise.all([
                fetch('/api/logs/acoes', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/logs/entidades', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const [acoesData, entidadesData] = await Promise.all([
                acoesRes.json(),
                entidadesRes.json()
            ]);

            setAcoes(acoesData);
            setEntidades(entidadesData);
        } catch (err) {
            console.error('Erro ao carregar filtros:', err);
        }
    };

    const carregarEstatisticas = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/logs/estatisticas', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEstatisticas(data);
            }
        } catch (err) {
            console.error('Erro ao carregar estatísticas:', err);
        }
    };

    const handleFiltroChange = (key, value) => {
        setFiltros({ ...filtros, [key]: value, page: 1 });
    };

    const aplicarFiltros = () => {
        setFiltros({ ...filtros, page: 1 });
        carregarDados();
    };

    const limparFiltros = () => {
        setFiltros({
            acao: '',
            entidade: '',
            usuario_id: '',
            page: 1,
            per_page: 50
        });
    };

    const formatarData = (dataStr) => {
        return new Date(dataStr).toLocaleString('pt-BR');
    };

    const getAcaoColor = (acao) => {
        const cores = {
            'CREATE': 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
            'UPDATE': 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
            'DELETE': 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200',
            'LOGIN_SUCCESS': 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
            'LOGIN_FAILED': 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
        };
        return cores[acao] || 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    };

    const getEntidadeColor = (entidade) => {
        const cores = {
            'CLIENTE': 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200',
            'USUARIO': 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200',
            'FATURAMENTO': 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-200',
            'SISTEMA': 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
        };
        return cores[entidade] || 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Carregando logs...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Botão Voltar */}
            <button
                onClick={() => navigate('/app/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground dark:text-dark-foreground bg-card dark:bg-dark-card hover:bg-primary/10 dark:hover:bg-primary/20 border border-border-default dark:border-dark-border-default rounded-lg transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Dashboard
            </button>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                    Histórico de Logs
                </h1>
                <button
                    onClick={() => carregarDados()}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Activity className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            {/* Estatísticas */}
            {estatisticas && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-dark-foreground">
                            Logs por Ação
                        </h3>
                        <div className="space-y-2">
                            {estatisticas.logs_por_acao.slice(0, 5).map((item, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className="text-sm text-muted">{item.acao}</span>
                                    <span className="text-sm font-medium">{item.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-dark-foreground">
                            Logs por Entidade
                        </h3>
                        <div className="space-y-2">
                            {estatisticas.logs_por_entidade.slice(0, 5).map((item, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className="text-sm text-muted">{item.entidade}</span>
                                    <span className="text-sm font-medium">{item.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-dark-foreground">
                            Usuários Ativos (30 dias)
                        </h3>
                        <div className="space-y-2">
                            {estatisticas.logs_por_usuario_30_dias.slice(0, 5).map((item, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className="text-sm text-muted">{item.usuario_nome}</span>
                                    <span className="text-sm font-medium">{item.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-dark-foreground">
                    <Filter className="w-5 h-5 inline mr-2" />
                    Filtros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                            Ação
                        </label>
                        <select
                            value={filtros.acao}
                            onChange={(e) => handleFiltroChange('acao', e.target.value)}
                            className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                        >
                            <option value="">Todas as ações</option>
                            {acoes.map(acao => (
                                <option key={acao} value={acao}>{acao}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                            Entidade
                        </label>
                        <select
                            value={filtros.entidade}
                            onChange={(e) => handleFiltroChange('entidade', e.target.value)}
                            className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                        >
                            <option value="">Todas as entidades</option>
                            {entidades.map(entidade => (
                                <option key={entidade} value={entidade}>{entidade}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                            Itens por página
                        </label>
                        <select
                            value={filtros.per_page}
                            onChange={(e) => handleFiltroChange('per_page', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end gap-2">
                        <button
                            onClick={aplicarFiltros}
                            className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Filtrar
                        </button>
                        <button
                            onClick={limparFiltros}
                            className="flex-1 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:bg-secondary/90 transition-colors"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Lista de Logs */}
            <div className="bg-card dark:bg-dark-card rounded-lg shadow">
                <div className="p-6">
                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">
                            Logs de Auditoria ({paginacao.total} total)
                        </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border-default dark:border-dark-border-default">
                                    <th className="text-left py-3 px-4 font-medium text-muted">Data</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Usuário</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Ação</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Entidade</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">ID</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Detalhes</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-border-default dark:border-dark-border-default">
                                        <td className="py-3 px-4 text-sm text-muted">
                                            {formatarData(log.data_acao)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                {log.usuario_nome}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAcaoColor(log.acao)}`}>
                                                {log.acao}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntidadeColor(log.entidade)}`}>
                                                {log.entidade}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted">
                                            {log.entidade_id || '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {log.detalhes && Object.keys(log.detalhes).length > 0 ? (
                                                <details className="text-sm">
                                                    <summary className="cursor-pointer text-primary hover:text-primary/80">
                                                        Ver detalhes
                                                    </summary>
                                                    <pre className="mt-2 p-2 bg-muted dark:bg-dark-muted rounded text-xs overflow-auto max-w-xs">
                                                        {JSON.stringify(log.detalhes, null, 2)}
                                                    </pre>
                                                </details>
                                            ) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted font-mono">
                                            {log.ip_address || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    {paginacao.pages > 1 && (
                        <div className="mt-6 flex justify-between items-center">
                            <div className="text-sm text-muted">
                                Página {paginacao.current_page} de {paginacao.pages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFiltros({...filtros, page: filtros.page - 1})}
                                    disabled={!paginacao.has_prev}
                                    className="px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border-default dark:hover:bg-dark-border-default transition-colors"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setFiltros({...filtros, page: filtros.page + 1})}
                                    disabled={!paginacao.has_next}
                                    className="px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-border-default dark:hover:bg-dark-border-default transition-colors"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HistoricoLogs;
