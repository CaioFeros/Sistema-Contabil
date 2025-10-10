import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2 } from 'lucide-react'; // Ícone para o novo botão

const NavButton = ({ to, children }) => (
    <Link
        to={to}
        className="flex items-center justify-center w-full text-center bg-card dark:bg-dark-card text-primary font-bold py-8 px-6 rounded-xl shadow-md hover:shadow-xl border border-border-default dark:border-dark-border-default hover:border-primary transition-all duration-300 transform hover:-translate-y-1"
    >
        {children}
    </Link>
);

// Componente para links externos, com o mesmo estilo
const ExternalNavButton = ({ href, children }) => (
    <a
        href={href}
        target="_blank" // Abre em uma nova aba
        rel="noopener noreferrer" // Boa prática de segurança para links externos
        className="flex items-center justify-center w-full text-center bg-card dark:bg-dark-card text-primary font-bold py-8 px-6 rounded-xl shadow-md hover:shadow-xl border border-border-default dark:border-dark-border-default hover:border-primary transition-all duration-300 transform hover:-translate-y-1"
    >
        {children}
    </a>
);

function DashboardPage() {
    return (
        <>
            <h1 className="text-4xl md:text-5xl font-bold text-center text-foreground dark:text-dark-foreground mb-16">Painel Principal</h1>
            {/* Grid ajustado para 2x2 em telas médias e 4 colunas em telas grandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                <NavButton to="/app/clientes">
                    Gerenciar Clientes
                </NavButton>
                <NavButton to="/app/faturamento">
                    Processar Faturamento
                </NavButton>
                <NavButton to="/app/relatorios">
                    Gerar Relatórios
                </NavButton>
                <ExternalNavButton href="http://localhost:8501">
                    <BarChart2 className="mr-2" /> Dashboard Analítico
                </ExternalNavButton>
            </div>
        </>
    );
}

export default DashboardPage;