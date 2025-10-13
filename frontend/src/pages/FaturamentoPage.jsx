import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImportacaoCSV from '../components/ImportacaoCSV';
import PreviewImportacao from '../components/PreviewImportacao';

function FaturamentoPage() {
    const navigate = useNavigate();
    const [dadosPreview, setDadosPreview] = useState(null);
    const [sucessoImportacao, setSucessoImportacao] = useState(null);

    const handlePreviewCarregado = (dados) => {
        setDadosPreview(dados);
    };

    const handleConsolidacaoCompleta = (resultado) => {
        setSucessoImportacao(resultado);
        setDadosPreview(null);
        
        // Recarrega a página após 3 segundos para mostrar os novos processamentos
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    };

    const handleCancelarPreview = () => {
        setDadosPreview(null);
    };

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="mb-6 px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-opacity-90 dark:bg-dark-muted transition-colors"
            >
                &larr; Voltar à página anterior
            </button>
            <h1 className="text-2xl font-bold mb-6 text-foreground dark:text-dark-foreground">Processar Faturamento</h1>

            {/* Conteúdo de Importação */}
            <div className="p-6 border border-border-default dark:border-dark-border-default rounded-lg bg-card dark:bg-dark-card shadow-md">
                {/* Mensagem de sucesso da importação */}
                {sucessoImportacao && (
                    <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                        <h3 className="font-bold text-green-800 dark:text-green-400 mb-2">
                            ✅ Importação Concluída!
                        </h3>
                        <div className="text-sm text-green-700 dark:text-green-500 space-y-1">
                            <p>Sucesso: {sucessoImportacao.resumo.sucesso} competência(s)</p>
                            <p>Ignorado: {sucessoImportacao.resumo.ignorado} competência(s)</p>
                            <p>Erro: {sucessoImportacao.resumo.erro} competência(s)</p>
                        </div>
                        <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                            Recarregando página em 3 segundos...
                        </p>
                    </div>
                )}
                
                {/* Exibe preview ou formulário de upload */}
                {dadosPreview ? (
                    <PreviewImportacao
                        dadosPreview={dadosPreview}
                        onConsolidacaoCompleta={handleConsolidacaoCompleta}
                        onCancelar={handleCancelarPreview}
                    />
                ) : (
                    <ImportacaoCSV onPreviewCarregado={handlePreviewCarregado} />
                )}
            </div>
        </>
    );
}

export default FaturamentoPage;