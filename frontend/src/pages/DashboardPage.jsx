import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, FileText, History } from 'lucide-react';

const NavButton = ({ to, children }) => (
    <Link
        to={to}
        className="flex items-center justify-center w-full text-center bg-card dark:bg-dark-card text-primary font-bold py-8 px-6 rounded-xl shadow-md hover:shadow-xl border border-border-default dark:border-dark-border-default hover:border-primary transition-all duration-300 transform hover:-translate-y-1"
    >
        {children}
    </Link>
);

function DashboardPage() {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarUsuario();
    }, []);

    const carregarUsuario = async () => {
        try {
            const token = localStorage.getItem('authToken');
            console.log('Token encontrado:', token ? 'Sim' : 'Não');
            
            if (!token) {
                console.log('Token não encontrado no localStorage');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const userData = await response.json();
                console.log('Dados do usuário:', userData);
                setUsuario(userData);
            } else {
                const errorData = await response.json();
                console.error('Erro na resposta:', errorData);
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = usuario?.papel === 'ADMIN';

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-4xl md:text-5xl font-bold text-center text-foreground dark:text-dark-foreground mb-16">Painel Principal</h1>
            
            {/* Grid principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
                <NavButton to="/app/clientes">
                    Gerenciar Clientes
                </NavButton>
                <NavButton to="/app/faturamento">
                    Processar Faturamento
                </NavButton>
                <NavButton to="/app/relatorios">
                    Gerar Relatórios
                </NavButton>
            </div>

            {/* Seção de Administração */}
            {isAdmin && (
                <>
                    <div className="border-t border-border-default dark:border-dark-border-default my-8"></div>
                    <h2 className="text-2xl font-bold text-center text-foreground dark:text-dark-foreground mb-8 flex items-center justify-center gap-2">
                        <Shield className="w-6 h-6" />
                        Administração
                    </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <NavButton to="/app/admin/usuarios">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="w-8 h-8" />
                                    <span>Gerenciar Usuários</span>
                                </div>
                            </NavButton>
                            <NavButton to="/app/admin/logs">
                                <div className="flex flex-col items-center gap-2">
                                    <FileText className="w-8 h-8" />
                                    <span>Histórico de Logs</span>
                                </div>
                            </NavButton>
                            <NavButton to="/app/admin/atividades">
                                <div className="flex flex-col items-center gap-2">
                                    <History className="w-8 h-8" />
                                    <span>Histórico de Atividades</span>
                                </div>
                            </NavButton>
                        </div>
                </>
            )}
        </>
    );
}

export default DashboardPage;