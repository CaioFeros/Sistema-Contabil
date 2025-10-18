import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, ArrowLeft, User, Calendar, Filter, Database, HardDrive, AlertTriangle } from 'lucide-react';

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
    const [estatisticas, setEstatisticas] = useState(null);
    const [loadingLimpeza, setLoadingLimpeza] = useState(false);
    const [menuLimpezaAberto, setMenuLimpezaAberto] = useState(false);

    useEffect(() => {
        carregarAtividades();
        carregarUsuarios();
        carregarEstatisticas();
    }, [filtros.page, filtros.per_page]);

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuLimpezaAberto && !event.target.closest('#menu-limpeza-container')) {
                setMenuLimpezaAberto(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuLimpezaAberto]);

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

    const carregarEstatisticas = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/atividades/estatisticas', {
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

    const handleLimparLixeira = async (tipo) => {
        const mensagens = {
            'restaurados': 'Deseja remover apenas os itens já restaurados da lixeira?',
            'todos': 'ATENÇÃO: Esta ação irá remover TODOS os itens da lixeira permanentemente!\n\nItens não restaurados serão perdidos definitivamente.\n\nTem certeza?',
            'nao_restaurados': 'ATENÇÃO: Esta ação irá remover todos os itens NÃO RESTAURADOS da lixeira!\n\nVocê não poderá mais recuperar esses itens.\n\nTem certeza?'
        };

        if (!confirm(mensagens[tipo])) {
            return;
        }

        try {
            setLoadingLimpeza(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/atividades/limpar-lixeira', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tipo })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || 'Erro ao limpar lixeira');
            }

            alert(data.mensagem);
            carregarEstatisticas(); // Recarrega estatísticas
            carregarAtividades(); // Recarrega atividades
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            setLoadingLimpeza(false);
        }
    };

    const formatarTamanho = (bytes, mb) => {
        if (mb >= 1) {
            return `${mb} MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        } else {
            return `${bytes} bytes`;
        }
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

            {/* Estatísticas de Armazenamento */}
            {estatisticas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card Banco de Dados */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                        Banco de Dados
                                    </h3>
                                </div>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                                    {formatarTamanho(estatisticas.tamanho_banco_bytes, estatisticas.tamanho_banco_mb)}
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                    Tamanho total do arquivo
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="bg-blue-200 dark:bg-blue-800 rounded-full p-3">
                                    <HardDrive className="w-6 h-6 text-blue-700 dark:text-blue-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Lixeira/Backup */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg shadow p-6 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trash2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                                        Lixeira (Backup)
                                    </h3>
                                </div>
                                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                                    {formatarTamanho(estatisticas.tamanho_backup_bytes, estatisticas.tamanho_backup_mb)}
                                </p>
                                <div className="mt-2 space-y-1">
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                        📦 Total: {estatisticas.total_itens_lixeira} itens
                                    </p>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                        🔄 Não restaurados: {estatisticas.itens_nao_restaurados}
                                    </p>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                        ✅ Restaurados: {estatisticas.itens_restaurados}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right ml-4">
                                <div className="bg-purple-200 dark:bg-purple-800 rounded-full p-3 mb-3">
                                    <Database className="w-6 h-6 text-purple-700 dark:text-purple-300" />
                                </div>
                                {/* Botão Limpar Lixeira */}
                                <div id="menu-limpeza-container" className="relative group">
                                    <button
                                        onClick={() => setMenuLimpezaAberto(!menuLimpezaAberto)}
                                        disabled={loadingLimpeza || estatisticas.total_itens_lixeira === 0}
                                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        title="Limpar Lixeira"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Limpar
                                    </button>
                                    
                                    {/* Menu de Opções */}
                                    {menuLimpezaAberto && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                                            <div className="p-2 space-y-1">
                                                <button
                                                    onClick={() => {
                                                        setMenuLimpezaAberto(false);
                                                        handleLimparLixeira('restaurados');
                                                    }}
                                                    disabled={estatisticas.itens_restaurados === 0}
                                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    🔄 Limpar Restaurados ({estatisticas.itens_restaurados})
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMenuLimpezaAberto(false);
                                                        handleLimparLixeira('nao_restaurados');
                                                    }}
                                                    disabled={estatisticas.itens_nao_restaurados === 0}
                                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    ⚠️ Limpar Não Restaurados ({estatisticas.itens_nao_restaurados})
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMenuLimpezaAberto(false);
                                                        handleLimparLixeira('todos');
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold"
                                                >
                                                    🗑️ Limpar Tudo ({estatisticas.total_itens_lixeira})
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Estatísticas por Tipo */}
                        {estatisticas.tipos_entidade && estatisticas.tipos_entidade.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                    Por Tipo:
                                </p>
                                <div className="space-y-1">
                                    {estatisticas.tipos_entidade.map((tipo) => (
                                        <div key={tipo.tipo} className="flex justify-between text-xs text-purple-600 dark:text-purple-400">
                                            <span>{tipo.tipo}:</span>
                                            <span>{tipo.nao_restaurados} de {tipo.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
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
                                                title={atividade.acao === 'DELETE' ? 'Restaurar da lixeira' : 'Desfazer operação'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {atividade.acao === 'DELETE' ? 'Restaurar' : 'Desfazer'}
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

