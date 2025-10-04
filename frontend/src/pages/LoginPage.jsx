import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Pega a página de origem para redirecionar após o login, ou vai para o dashboard
    const from = location.state?.from?.pathname || '/app/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // --- BYPASS DE DESENVOLVIMENTO ---
        // Em vez de chamar a API, apenas definimos um token falso e navegamos.
        // O backend em modo de debug irá ignorar o conteúdo do token.
        console.log("Modo de desenvolvimento: pulando login real.");
        login("dev-bypass-token");
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-foreground mb-8">Acessar Sistema</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-foreground text-sm font-bold mb-2">Email:</label>
                        <input
                            type="email" id="email" value={email}
                            onChange={(e) => setEmail(e.target.value)} required
                            className="shadow-sm appearance-none border border-border-default rounded w-full py-3 px-4 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-foreground text-sm font-bold mb-2">Senha:</label>
                        <input
                            type="password" id="password" value={password}
                            onChange={(e) => setPassword(e.target.value)} required
                            className="shadow-sm appearance-none border border-border-default rounded w-full py-3 px-4 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    {error && <p className="text-danger text-sm italic mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300">Entrar</button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;