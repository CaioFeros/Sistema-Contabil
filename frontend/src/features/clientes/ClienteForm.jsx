import { useState } from 'react';

function ClienteForm({ onAddCliente }) {
    const [razaoSocial, setRazaoSocial] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [regimeTributario, setRegimeTributario] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        if (!razaoSocial || !cnpj || !regimeTributario) {
            setError('Todos os campos são obrigatórios.');
            setSubmitting(false);
            return;
        }

        const result = await onAddCliente({ 
            razao_social: razaoSocial, 
            cnpj, 
            regime_tributario: regimeTributario 
        });

        if (result.success) {
            setSuccess('Cliente adicionado com sucesso!');
            // Limpa o formulário
            setRazaoSocial('');
            setCnpj('');
            setRegimeTributario('');
        } else {
            setError(result.error);
        }
        setSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-gray-50">
            {error && <div className="p-2 mb-4 text-red-700 bg-red-100 rounded">{error}</div>}
            {success && <div className="p-2 mb-4 text-green-700 bg-green-100 rounded">{success}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                    type="text"
                    placeholder="Razão Social"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="p-2 border rounded"
                />
                <input
                    type="text"
                    placeholder="CNPJ (XX.XXX.XXX/XXXX-XX)"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="p-2 border rounded"
                />
                <input
                    type="text"
                    placeholder="Regime Tributário"
                    value={regimeTributario}
                    onChange={(e) => setRegimeTributario(e.target.value)}
                    className="p-2 border rounded"
                />
            </div>
            <button 
                type="submit" 
                disabled={submitting}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
                {submitting ? 'Adicionando...' : 'Adicionar Cliente'}
            </button>
        </form>
    );
}

export default ClienteForm;
