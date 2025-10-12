import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaturamento } from '../hooks/useFaturamento';
import ImportacaoCSV from '../components/ImportacaoCSV';
import PreviewImportacao from '../components/PreviewImportacao';
import { FileSpreadsheet, Upload } from 'lucide-react';

function FaturamentoPage() {
    const navigate = useNavigate();
    const [abaAtiva, setAbaAtiva] = useState('manual'); // 'manual' ou 'csv'
    const [dadosPreview, setDadosPreview] = useState(null);
    const [sucessoImportacao, setSucessoImportacao] = useState(null);
    
    const {
        formState: { clienteId, mes, ano, clientes },
        uiState: { isSubmitting, isLoadingClientes, error, success, uploadProgress },
        recentProcessamentos,
        setters: { setClienteId, setMes, setAno },
        handlers: { handleFileChange, handleSubmit },
    } = useFaturamento();

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

            {/* Abas de Navegação */}
            <div className="flex space-x-2 mb-6 border-b border-border-default dark:border-dark-border-default">
                <button
                    onClick={() => setAbaAtiva('manual')}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                        abaAtiva === 'manual'
                            ? 'border-primary text-primary dark:text-sky-400'
                            : 'border-transparent text-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <FileSpreadsheet className="h-5 w-5" />
                    <span>Importação Manual</span>
                </button>
                <button
                    onClick={() => setAbaAtiva('csv')}
                    className={`flex items-center space-x-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                        abaAtiva === 'csv'
                            ? 'border-primary text-primary dark:text-sky-400'
                            : 'border-transparent text-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Upload className="h-5 w-5" />
                    <span>Importação via CSV</span>
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                        Novo
                    </span>
                </button>
            </div>

            {/* Conteúdo da Aba Ativa */}
            {abaAtiva === 'manual' ? (
                <form onSubmit={handleSubmit} className="p-6 border border-border-default dark:border-dark-border-default rounded-lg bg-card dark:bg-dark-card shadow-md">
                    {error && <div className="p-3 mb-4 text-danger bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg">{error}</div>}
                    {success && <div className="p-3 mb-4 text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-lg">{success}</div>}

                    {isSubmitting && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                            <div 
                                className="bg-primary h-2.5 rounded-full transition-all duration-150" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="cliente" className="block text-sm font-medium text-muted mb-1">Cliente</label>
                            <select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required disabled={isLoadingClientes} className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground disabled:opacity-50">
                                <option value="">{isLoadingClientes ? 'Carregando clientes...' : 'Selecione um Cliente'}</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.razao_social}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label htmlFor="mes" className="block text-sm font-medium text-muted mb-1">Mês</label><input id="mes" type="number" value={mes} onChange={(e) => setMes(e.target.value)} required min="1" max="12" className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground" /></div>
                            <div><label htmlFor="ano" className="block text-sm font-medium text-muted mb-1">Ano</label><input id="ano" type="number" value={ano} onChange={(e) => setAno(e.target.value)} required placeholder="AAAA" className="w-full p-2 border border-border-default dark:border-dark-border-default rounded bg-background dark:bg-dark-muted text-foreground dark:text-dark-foreground" /></div>
                        </div>
                        <div>
                            <label htmlFor="arquivo" className="block text-sm font-medium text-muted mb-1">Arquivo de Faturamento (.csv)</label>
                            <input id="arquivo" type="file" onChange={handleFileChange} required accept=".csv" className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/20 dark:file:text-sky-300 dark:hover:file:bg-primary/30" />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoadingClientes || isSubmitting} className="mt-8 w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover disabled:bg-sky-300 dark:disabled:bg-sky-800 transition-all">
                        {isSubmitting ? 'Processando...' : 'Enviar Arquivo'}
                    </button>
                </form>
            ) : (
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
            )}

            <div className="mt-12">
                <h2 className="text-xl font-bold mb-4 text-foreground dark:text-dark-foreground">Processamentos Recentes</h2>
                <div className="bg-card dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border-default dark:divide-dark-border-default">
                            <thead className="bg-background dark:bg-dark-card">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Período</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Faturamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default dark:divide-dark-border-default">
                                {recentProcessamentos.map((p) => (
                                    <tr key={p.id} className="hover:bg-background dark:hover:bg-dark-background transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground dark:text-dark-foreground">{p.razao_social_cliente}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted dark:text-slate-400">{`${String(p.mes).padStart(2, '0')}/${p.ano}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted dark:text-slate-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.faturamento_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default FaturamentoPage;