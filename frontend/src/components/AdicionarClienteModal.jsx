import React, { useState } from 'react';
import { createCliente, consultarCNPJ } from '../services/clienteApi';
import { formatarCNPJ, validarCNPJComMensagem, limparCNPJ } from '../utils/cnpjUtils';

function AdicionarClienteModal({ onClose, onClienteAdded }) {
    const [cnpj, setCnpj] = useState('');
    const [dadosCliente, setDadosCliente] = useState({
        razaoSocial: '',
        regimeTributario: 'Simples Nacional',
        nomeFantasia: '',
        dataAbertura: '',
        situacaoCadastral: '',
        dataSituacao: '',
        motivoSituacao: '',
        naturezaJuridica: '',
        cnaePrincipal: '',
        cnaeSecundarias: [],
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cep: '',
        municipio: '',
        uf: '',
        telefone1: '',
        telefone2: '',
        email: '',
        capitalSocial: '',
        porte: '',
        opcaoSimples: '',
        dataOpcaoSimples: '',
        opcaoMEI: '',
        dataExclusaoSimples: '',
        situacaoEspecial: '',
        dataSituacaoEspecial: '',
        valorHonorarios: '500.00'
    });
    const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [dadosBuscados, setDadosBuscados] = useState(false);
    const [erroValidacao, setErroValidacao] = useState('');

    const handleCNPJChange = (valor) => {
        const cnpjFormatado = formatarCNPJ(valor);
        setCnpj(cnpjFormatado);
        setErroValidacao('');
    };

    const handleBuscarCNPJ = async () => {
        // Valida o CNPJ antes de buscar
        const erroValidacao = validarCNPJComMensagem(cnpj);
        if (erroValidacao) {
            setErroValidacao(erroValidacao);
            alert(erroValidacao);
            return;
        }

        try {
            setBuscandoCNPJ(true);
            setErroValidacao('');
            const dadosReceita = await consultarCNPJ(limparCNPJ(cnpj));
            
            // Preenche os dados retornados da API
            setDadosCliente({
                razaoSocial: dadosReceita.razao_social || '',
                regimeTributario: dadosCliente.regimeTributario, // Mantém o selecionado
                nomeFantasia: dadosReceita.nome_fantasia || '',
                dataAbertura: dadosReceita.data_abertura || '',
                situacaoCadastral: dadosReceita.situacao_cadastral || '',
                dataSituacao: dadosReceita.data_situacao || '',
                motivoSituacao: dadosReceita.motivo_situacao || '',
                naturezaJuridica: dadosReceita.natureza_juridica || '',
                cnaePrincipal: dadosReceita.cnae_principal || '',
                cnaeSecundarias: dadosReceita.cnae_secundarias || [],
                logradouro: dadosReceita.logradouro || '',
                numero: dadosReceita.numero || '',
                complemento: dadosReceita.complemento || '',
                bairro: dadosReceita.bairro || '',
                cep: dadosReceita.cep || '',
                municipio: dadosReceita.municipio || '',
                uf: dadosReceita.uf || '',
                telefone1: dadosReceita.telefone1 || '',
                telefone2: dadosReceita.telefone2 || '',
                email: dadosReceita.email || '',
                capitalSocial: dadosReceita.capital_social || '',
                porte: dadosReceita.porte || '',
                opcaoSimples: dadosReceita.opcao_simples || '',
                dataOpcaoSimples: dadosReceita.data_opcao_simples || '',
                opcaoMEI: dadosReceita.opcao_mei || '',
                situacaoEspecial: dadosReceita.situacao_especial || '',
                dataSituacaoEspecial: dadosReceita.data_situacao_especial || ''
            });
            
            setDadosBuscados(true);
            alert('✅ Dados do CNPJ carregados com sucesso! Revise e complete as informações necessárias.');
        } catch (err) {
            console.error('Erro completo ao buscar CNPJ:', err);
            console.error('Resposta da API:', err.response);
            
            let mensagemErro = 'Erro ao consultar CNPJ.';
            
            if (err.response) {
                // Servidor respondeu com erro
                if (err.response.status === 404) {
                    mensagemErro = '❌ CNPJ não encontrado na Receita Federal. Verifique se o número está correto.';
                } else if (err.response.status === 400) {
                    mensagemErro = '❌ CNPJ inválido. Verifique os dígitos verificadores.';
                } else if (err.response.status === 504 || err.response.status === 502) {
                    mensagemErro = '⏱️ Timeout ao consultar a Receita Federal. A API pode estar lenta. Tente novamente em alguns segundos.';
                } else {
                    mensagemErro = `❌ ${err.response.data?.erro || 'Erro ao consultar a Receita Federal'}`;
                }
            } else if (err.request) {
                // Requisição foi feita mas não houve resposta
                mensagemErro = '🌐 Sem resposta do servidor. Verifique sua conexão com a internet ou se o backend está rodando.';
            } else {
                // Erro ao configurar a requisição
                mensagemErro = `❌ Erro: ${err.message}`;
            }
            
            setErroValidacao(mensagemErro);
            alert(mensagemErro);
        } finally {
            setBuscandoCNPJ(false);
        }
    };

    const handleSalvar = async () => {
        // Validação básica
        if (!cnpj || !dadosCliente.razaoSocial || !dadosCliente.regimeTributario) {
            alert('Por favor, preencha CNPJ, Razão Social e Regime Tributário.');
            return;
        }

        try {
            setSalvando(true);
            
            // Mapeia para o formato da API
            const novoCliente = {
                cnpj: cnpj,
                razao_social: dadosCliente.razaoSocial,
                regime_tributario: dadosCliente.regimeTributario,
                nome_fantasia: dadosCliente.nomeFantasia,
                data_abertura: dadosCliente.dataAbertura,
                situacao_cadastral: dadosCliente.situacaoCadastral,
                data_situacao: dadosCliente.dataSituacao,
                motivo_situacao: dadosCliente.motivoSituacao,
                natureza_juridica: dadosCliente.naturezaJuridica,
                cnae_principal: dadosCliente.cnaePrincipal,
                cnae_secundarias: dadosCliente.cnaeSecundarias,
                logradouro: dadosCliente.logradouro,
                numero: dadosCliente.numero,
                complemento: dadosCliente.complemento,
                bairro: dadosCliente.bairro,
                cep: dadosCliente.cep,
                municipio: dadosCliente.municipio,
                uf: dadosCliente.uf,
                telefone1: dadosCliente.telefone1,
                telefone2: dadosCliente.telefone2,
                email: dadosCliente.email,
                capital_social: dadosCliente.capitalSocial,
                porte: dadosCliente.porte,
                opcao_simples: dadosCliente.opcaoSimples,
                data_opcao_simples: dadosCliente.dataOpcaoSimples,
                opcao_mei: dadosCliente.opcaoMEI,
                data_exclusao_simples: dadosCliente.dataExclusaoSimples,
                situacao_especial: dadosCliente.situacaoEspecial,
                data_situacao_especial: dadosCliente.dataSituacaoEspecial,
                valor_honorarios: dadosCliente.valorHonorarios ? parseFloat(dadosCliente.valorHonorarios) : null
            };
            
            await createCliente(novoCliente);
            alert('Cliente adicionado com sucesso!');
            onClienteAdded?.(); // Callback para atualizar lista
            onClose();
        } catch (err) {
            console.error('Erro ao criar cliente:', err);
            const mensagemErro = err.response?.data?.erro || 'Erro ao adicionar cliente. Tente novamente.';
            alert(mensagemErro);
        } finally {
            setSalvando(false);
        }
    };

    const handleInputChange = (field, value) => {
        setDadosCliente(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white rounded-full p-2">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Adicionar Novo Cliente</h2>
                            <p className="text-green-100 text-sm">Busque os dados pela Receita Federal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Passo 1: Buscar CNPJ */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">
                            1️⃣ Digite o CNPJ e busque os dados
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={cnpj}
                                onChange={(e) => handleCNPJChange(e.target.value)}
                                placeholder="00.000.000/0000-00"
                                maxLength="18"
                                className={`flex-1 px-4 py-3 border rounded-lg text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 ${
                                    erroValidacao 
                                        ? 'border-red-500 dark:border-red-600' 
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}
                            />
                            <button
                                onClick={handleBuscarCNPJ}
                                disabled={buscandoCNPJ || !cnpj}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 font-semibold"
                            >
                                {buscandoCNPJ ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Buscando...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span>Buscar</span>
                                    </>
                                )}
                            </button>
                        </div>
                        {erroValidacao ? (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {erroValidacao}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                Os dados serão buscados diretamente da Receita Federal via BrasilAPI
                            </p>
                        )}
                    </div>

                    {/* Passo 2: Preencher dados */}
                    {dadosBuscados && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">
                                2️⃣ Revise e complete as informações
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Razão Social *
                                    </label>
                                    <input
                                        type="text"
                                        value={dadosCliente.razaoSocial}
                                        onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Regime Tributário *
                                    </label>
                                    <select
                                        value={dadosCliente.regimeTributario}
                                        onChange={(e) => handleInputChange('regimeTributario', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Simples Nacional">Simples Nacional</option>
                                        <option value="Lucro Presumido">Lucro Presumido</option>
                                        <option value="Lucro Real">Lucro Real</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Valor Honorários Mensais (R$)
                                    </label>
                                    <input
                                        type="number"
                                        value={dadosCliente.valorHonorarios}
                                        onChange={(e) => handleInputChange('valorHonorarios', e.target.value)}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            if (!isNaN(value) && value > 0) {
                                                handleInputChange('valorHonorarios', value.toFixed(2));
                                            } else if (!e.target.value || e.target.value === '') {
                                                handleInputChange('valorHonorarios', '500.00');
                                            }
                                        }}
                                        placeholder="500.00"
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Valor padrão para recibos de honorários
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Nome Fantasia
                                    </label>
                                    <input
                                        type="text"
                                        value={dadosCliente.nomeFantasia}
                                        onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Situação Cadastral
                                    </label>
                                    <input
                                        type="text"
                                        value={dadosCliente.situacaoCadastral}
                                        readOnly
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Município
                                    </label>
                                    <input
                                        type="text"
                                        value={dadosCliente.municipio}
                                        onChange={(e) => handleInputChange('municipio', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                                * Campos obrigatórios. Outros dados podem ser editados após a criação.
                            </p>
                        </div>
                    )}

                    {!dadosBuscados && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>Digite um CNPJ e clique em "Buscar" para começar</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSalvar}
                        disabled={salvando || !dadosBuscados}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                    >
                        {salvando ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Salvando...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Salvar Cliente</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdicionarClienteModal;

