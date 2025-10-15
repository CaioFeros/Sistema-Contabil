import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Pega a página de origem para redirecionar após o login, ou vai para o dashboard
    const from = location.state?.from?.pathname || '/app/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const response = await axios.post('/api/auth/login', {
                username: username,
                senha: password
            });

            if (response.data.token) {
                setSuccess(true);
                setError('');
                login(response.data.token);
                
                // Pequeno delay para mostrar feedback de sucesso
                setTimeout(() => {
                    navigate(from, { replace: true });
                }, 500);
            } else {
                setError('Erro: Token não recebido do servidor.');
            }
        } catch (error) {
            console.error('Erro de login:', error);
            
            if (error.response) {
                // O servidor respondeu com um status de erro
                switch (error.response.status) {
                    case 400:
                        setError('Username e senha são obrigatórios.');
                        break;
                    case 401:
                        if (error.response.data?.erro) {
                            setError(error.response.data.erro);
                        } else {
                            setError('Username ou senha incorretos.');
                        }
                        break;
                    case 500:
                        setError('Erro interno do servidor. Tente novamente mais tarde.');
                        break;
                    default:
                        setError(error.response.data?.erro || 'Erro ao fazer login.');
                }
            } else if (error.request) {
                // A requisição foi feita mas não houve resposta
                setError('Servidor não respondeu. Verifique sua conexão.');
            } else {
                // Algo aconteceu ao configurar a requisição
                setError('Erro ao fazer login. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-foreground mb-8">Acessar Sistema</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-foreground text-sm font-bold mb-2">Username:</label>
                        <input
                            type="text" id="username" value={username}
                            onChange={(e) => setUsername(e.target.value)} required
                            className="shadow-sm appearance-none border border-border-default rounded w-full py-3 px-4 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-foreground text-sm font-bold mb-2">Senha:</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="shadow-sm appearance-none border border-border-default rounded w-full py-3 px-4 pr-12 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-700 px-4 py-3 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-red-900 dark:text-red-100">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-100 dark:bg-green-900/40 border-2 border-green-400 dark:border-green-700 px-4 py-3 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100">✓ Login realizado com sucesso! Redirecionando...</p>
                        </div>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;