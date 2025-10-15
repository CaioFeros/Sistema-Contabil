import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, ArrowLeft, User, Calendar, Filter } from 'lucide-react';

function HistoricoAtividades() {
    const navigate = useNavigate();
    const [atividades, setAtividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtros, setFiltros] = useState({
        tipo: '',
        usuario_id: '',
        page: 1,
        per_page: 50
    });
    const [usuarios, setUsuarios] = useState([]);
    const [paginacao, setPaginacao] = useState({});

    useEffect(() => {
        carregarAtividades();
        carregarUsuarios();
    }, [filtros.page, filtros.per_page]);

    const carregarAtividades = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            const params = new URLSearchParams();
            if (filtros.tipo) params.append('tipo', filtros.tipo);
            if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
            params.append('page', filtros.page);
            params.append('per_page', filtros.per_page);

            const response = await fetch(`/api/atividades/?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar atividades');

            const data = await response.json();
            setAtividades(data.atividades);
            setPaginacao({
                total: data.total,
                total_pages: data.total_pages,
                current_page: data.current_page
            });
        } catch (err) {
            setError('Erro ao carregar atividades: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const carregarUsuarios = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/atividades/usuarios', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsuarios(data);
            }
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
        }
    };

    const handleDesfazer = async (logId, descricao) => {
        if (!confirm(`Tem certeza que deseja desfazer esta atividade?\n\n"${descricao}"`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/atividades/${logId}/desfazer`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || 'Erro ao desfazer atividade');
            }

            alert(data.mensagem);
            carregarAtividades(); // Recarrega a lista
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    };

    const aplicarFiltros = () => {
        setFiltros({ ...filtros, page: 1 });
        carregarAtividades();
    };

    const limparFiltros = () => {
        setFiltros({ tipo: '', usuario_id: '', page: 1, per_page: 50 });
        setTimeout(() => carregarAtividades(), 100);
    };

    const formatarData = (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleString('pt-BR');
    };

    const getTipoClass = (entidade) => {
        return entidade === 'CLIENTE' 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    };

    if (loading && atividades.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Carregando atividades...</div>
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
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-2">
                    <History className="w-8 h-8" />
                    Histórico de Atividades
                </h1>
            </div>

            {error && (
                <div className="bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">{error}</p>
                </div>
            )}

            {/* Filtros */}
            <div className="bg-card dark:bg-dark-card rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">Filtros</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select
                            value={filtros.tipo}
                            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg bg-background dark:bg-dark-background"
                        >
                            <option value="">Todos</option>
                            <option value="CLIENTE">Clientes</option>
                            <option value="FATURAMENTO">Faturamentos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Usuário</label>
                        <select
                            value={filtros.usuario_id}
                            onChange={(e) => setFiltros({...filtros, usuario_id: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg bg-background dark:bg-dark-background"
                        >
                            <option value="">Todos</option>
                            {usuarios.map(u => (
                                <option key={u.id} value={u.id}>{u.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={aplicarFiltros}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Aplicar
                        </button>
                        <button
                            onClick={limparFiltros}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Atividades */}
            <div className="bg-card dark:bg-dark-card rounded-lg shadow">
                <div className="p-6">
                    <div className="space-y-4">
                        {atividades.length === 0 ? (
                            <p className="text-center text-muted py-8">Nenhuma atividade encontrada</p>
                        ) : (
                            atividades.map((atividade) => (
                                <div
                                    key={atividade.id}
                                    className="border border-border-default dark:border-dark-border-default rounded-lg p-4 hover:bg-primary/5 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoClass(atividade.entidade)}`}>
                                                    {atividade.entidade}
                                                </span>
                                                <span className="text-sm text-muted flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {atividade.usuario_nome}
                                                </span>
                                                <span className="text-sm text-muted flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatarData(atividade.data_acao)}
                                                </span>
                                            </div>
                                            <p className="text-foreground dark:text-dark-foreground font-medium">
                                                {atividade.descricao}
                                            </p>
                                        </div>
                                        {atividade.pode_desfazer && (
                                            <button
                                                onClick={() => handleDesfazer(atividade.id, atividade.descricao)}
                                                className="ml-4 flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                                                title="Desfazer operação"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Desfazer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Paginação */}
                    {paginacao.total_pages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                                onClick={() => setFiltros({...filtros, page: filtros.page - 1})}
                                disabled={filtros.page === 1}
                                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
                            >
                                Anterior
                            </button>
                            <span className="text-sm">
                                Página {paginacao.current_page} de {paginacao.total_pages}
                            </span>
                            <button
                                onClick={() => setFiltros({...filtros, page: filtros.page + 1})}
                                disabled={filtros.page >= paginacao.total_pages}
                                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HistoricoAtividades;

