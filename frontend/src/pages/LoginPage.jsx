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

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                // CORREÇÃO AQUI: Mudando 'senha' para 'password'
                password, // Esta é a forma resumida para { password: password }
            });

            const token = response.data.token_de_acesso;
            if (token) {
                login(token);
                navigate(from, { replace: true }); // Redireciona para a página original ou dashboard
            }
        } catch (err) {
            console.error('Erro de login:', err);
            // Melhorando a mensagem de erro para o usuário caso haja resposta do servidor
            if (err.response && err.response.status === 401) {
                setError('E-mail ou senha incorretos. Tente novamente.');
            } else {
                setError('Falha no login. Verifique seu e-mail e senha.');
            }
        }
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
                <div className="mt-6 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Ou</span></div>
                    </div>
                    <button
                        onClick={() => {
                            // Usa um token de teste válido para desenvolvimento.
                            // Este token corresponde ao usuário 'testuser' no backend.
                            const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidGVzdHVzZXIiLCJleHAiOjE3OTk5OTk5OTl9.k-e1zJ2a-A2i5gSo_2Bw2Kj5sL3a_zXvY8cZ8bQ4wJg';
                            login(testToken); 
                            navigate(from, { replace: true });
                        }}
                        className="mt-6 w-full bg-secondary hover:bg-secondary-hover text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300"
                    >
                        Entrar sem Credencial
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;