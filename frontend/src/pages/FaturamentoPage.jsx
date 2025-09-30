import React from 'react';
import { useNavigate } from 'react-router-dom';

function FaturamentoPage() {
    const navigate = useNavigate();

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="mb-6 inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
                &larr; Voltar à página anterior
            </button>
            <div className="bg-white p-8 rounded-xl shadow-md">
                <h1 className="text-3xl font-bold mb-6">Página de Faturamento</h1>
                <p className="text-gray-600">Conteúdo da página de faturamento (upload de arquivos, histórico, etc.) virá aqui.</p>
            </div>
        </>
    );
}

export default FaturamentoPage;