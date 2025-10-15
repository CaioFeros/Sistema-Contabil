import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';

function GerenciarUsuarios() {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        nome: '',
        email: '',
        senha: '',
        papel: 'USER'
    });
    const [showPasswords, setShowPasswords] = useState({});

    useEffect(() => {
        carregarUsuarios();
    }, []);

    const carregarUsuarios = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/usuarios', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar usuários');
            }

            const data = await response.json();
            setUsuarios(data);
        } catch (err) {
            setError('Erro ao carregar usuários: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            // Verifica se a resposta é JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Servidor retornou uma resposta inválida. Verifique sua autenticação.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || 'Erro ao criar usuário');
            }

            // Sucesso!
            setShowModal(false);
            setFormData({ username: '', nome: '', email: '', senha: '', papel: 'USER' });
            carregarUsuarios();
        } catch (err) {
            console.error('Erro ao criar usuário:', err);
            setError('Erro ao criar usuário: ' + err.message);
        }
    };

    const handleExcluir = async (usuarioId, nome) => {
        if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/auth/usuarios/${usuarioId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.erro || 'Erro ao excluir usuário');
            }

            carregarUsuarios();
        } catch (err) {
            setError('Erro ao excluir usuário: ' + err.message);
        }
    };

    const handleToggleStatus = async (usuarioId, ativo, nome) => {
        const acao = ativo ? 'desativar' : 'ativar';
        if (!confirm(`Tem certeza que deseja ${acao} o usuário "${nome}"?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/auth/usuarios/${usuarioId}/toggle`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.erro || 'Erro ao alterar status do usuário');
            }

            carregarUsuarios();
        } catch (err) {
            setError('Erro ao alterar status do usuário: ' + err.message);
        }
    };

    const formatarData = (dataStr) => {
        if (!dataStr) return 'Nunca';
        return new Date(dataStr).toLocaleString('pt-BR');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Carregando usuários...</div>
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
                    Gerenciar Usuários
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Novo Usuário
                </button>
            </div>

            {error && (
                <div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-card dark:bg-dark-card rounded-lg shadow">
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border-default dark:border-dark-border-default">
                                    <th className="text-left py-3 px-4 font-medium text-muted">Username</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Nome</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Email</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Papel</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Último Login</th>
                                    <th className="text-left py-3 px-4 font-medium text-muted">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id} className="border-b border-border-default dark:border-dark-border-default">
                                        <td className="py-3 px-4 font-mono text-sm">{usuario.username}</td>
                                        <td className="py-3 px-4">{usuario.nome}</td>
                                        <td className="py-3 px-4">{usuario.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                usuario.papel === 'ADMIN' 
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            }`}>
                                                {usuario.papel}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                usuario.ativo 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                            }`}>
                                                {usuario.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted">
                                            {formatarData(usuario.ultimo_login)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(usuario.id, usuario.ativo, usuario.nome)}
                                                    className="p-2 rounded-lg hover:bg-border-default dark:hover:bg-dark-border-default transition-colors"
                                                    title={usuario.ativo ? 'Desativar' : 'Ativar'}
                                                >
                                                    {usuario.ativo ? 
                                                        <ToggleRight className="w-4 h-4 text-green-600" /> : 
                                                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => handleExcluir(usuario.id, usuario.nome)}
                                                    className="p-2 rounded-lg hover:bg-border-default dark:hover:bg-dark-border-default transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Novo Usuário */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-background dark:bg-dark-background p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-foreground dark:text-dark-foreground">
                            Novo Usuário
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                                    Nome
                                </label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    value={formData.senha}
                                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-dark-foreground mb-1">
                                    Papel
                                </label>
                                <select
                                    value={formData.papel}
                                    onChange={(e) => setFormData({...formData, papel: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-default dark:border-dark-border-default rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground"
                                >
                                    <option value="USER">Usuário</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Criar Usuário
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg hover:bg-secondary/90 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GerenciarUsuarios;
