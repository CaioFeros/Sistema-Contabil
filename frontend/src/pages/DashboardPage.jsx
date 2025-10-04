import React from 'react';
import { Link } from 'react-router-dom';

const NavButton = ({ to, children }) => (
    <Link
        to={to}
        className="flex items-center justify-center w-full text-center bg-card dark:bg-dark-card text-primary font-bold py-8 px-6 rounded-xl shadow-md hover:shadow-xl border border-border-default dark:border-dark-border-default hover:border-primary transition-all duration-300 transform hover:-translate-y-1"
    >
        {children}
    </Link>
);

function DashboardPage() {
    return (
        <>
            <h1 className="text-4xl md:text-5xl font-bold text-center text-foreground dark:text-dark-foreground mb-16">Painel Principal</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
        </>
    );
}

export default DashboardPage;