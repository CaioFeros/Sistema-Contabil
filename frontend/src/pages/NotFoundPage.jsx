import React from 'react';
import { Link } from 'react-router-dom';

// Componente para a página 404, agora estilizado com Tailwind CSS.
function NotFoundPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-8xl font-black text-primary animate-pulse">404</h1>
            <h2 className="mt-4 text-3xl font-bold text-foreground">Página Não Encontrada</h2>
            <p className="mt-2 text-lg text-muted">
                Oops! A página que você está procurando não existe ou foi movida.
            </p>
            <Link 
                to="/app/dashboard" 
                className="mt-8 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
                Voltar para o Dashboard
            </Link>
        </div>
    );
}

export default NotFoundPage;