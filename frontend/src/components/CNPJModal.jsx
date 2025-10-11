import React, { useState, useEffect } from 'react';
import { getClienteById, updateCliente } from '../services/clienteApi';

// Componente InputField definido fora para evitar perda de foco
const InputField = ({ label, value, field, type = 'text', readOnly = false, onChange, disabled }) => (
    <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {label}
        </label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            disabled={disabled || readOnly}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
                !disabled && !readOnly
                    ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            } transition-colors`}
        />
    </div>
);

function CNPJModal({ cliente, onClose }) {
    const [dadosCNPJ, setDadosCNPJ] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Busca os dados completos do cliente ao abrir o modal
    useEffect(() => {
        const fetchClienteData = async () => {
            try {
                setLoading(true);
                const data = await getClienteById(cliente.id);
                
                // Mapeia os dados da API para o formato usado no componente
                setDadosCNPJ({
                    cnpj: data.cnpj || '',
                    razaoSocial: data.razao_social || '',
                    regimeTributario: data.regime_tributario || '',
                    nomeFantasia: data.nome_fantasia || '',
                    dataAbertura: data.data_abertura || '',
                    situacaoCadastral: data.situacao_cadastral || '',
                    dataSituacao: data.data_situacao || '',
                    motivoSituacao: data.motivo_situacao || '',
                    naturezaJuridica: data.natureza_juridica || '',
                    cnaePrincipal: data.cnae_principal || '',
                    cnaeSecundarias: data.cnae_secundarias || [],
                    logradouro: data.logradouro || '',
                    numero: data.numero || '',
                    complemento: data.complemento || '',
                    bairro: data.bairro || '',
                    cep: data.cep || '',
                    municipio: data.municipio || '',
                    uf: data.uf || '',
                    telefone1: data.telefone1 || '',
                    telefone2: data.telefone2 || '',
                    email: data.email || '',
                    capitalSocial: data.capital_social || '',
                    porte: data.porte || '',
                    opcaoSimples: data.opcao_simples || '',
                    dataOpcaoSimples: data.data_opcao_simples || '',
                    opcaoMEI: data.opcao_mei || '',
                    dataExclusaoSimples: data.data_exclusao_simples || '',
                    situacaoEspecial: data.situacao_especial || '',
                    dataSituacaoEspecial: data.data_situacao_especial || ''
                });
                setError(null);
            } catch (err) {
                console.error('Erro ao buscar dados do cliente:', err);
                setError('Erro ao carregar dados do cliente');
            } finally {
                setLoading(false);
            }
        };

        fetchClienteData();
    }, [cliente.id]);

    const handleInputChange = (field, value) => {
        setDadosCNPJ(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddCnaeSecundaria = () => {
        setDadosCNPJ(prev => ({
            ...prev,
            cnaeSecundarias: [...prev.cnaeSecundarias, '']
        }));
    };

    const handleRemoveCnaeSecundaria = (index) => {
        setDadosCNPJ(prev => ({
            ...prev,
            cnaeSecundarias: prev.cnaeSecundarias.filter((_, i) => i !== index)
        }));
    };

    const handleCnaeSecundariaChange = (index, value) => {
        setDadosCNPJ(prev => ({
            ...prev,
            cnaeSecundarias: prev.cnaeSecundarias.map((cnae, i) => 
                i === index ? value : cnae
            )
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // Mapeia os dados do componente para o formato da API
            const dataToSave = {
                razao_social: dadosCNPJ.razaoSocial,
                regime_tributario: dadosCNPJ.regimeTributario,
                nome_fantasia: dadosCNPJ.nomeFantasia,
                data_abertura: dadosCNPJ.dataAbertura,
                situacao_cadastral: dadosCNPJ.situacaoCadastral,
                data_situacao: dadosCNPJ.dataSituacao,
                motivo_situacao: dadosCNPJ.motivoSituacao,
                natureza_juridica: dadosCNPJ.naturezaJuridica,
                cnae_principal: dadosCNPJ.cnaePrincipal,
                cnae_secundarias: dadosCNPJ.cnaeSecundarias,
                logradouro: dadosCNPJ.logradouro,
                numero: dadosCNPJ.numero,
                complemento: dadosCNPJ.complemento,
                bairro: dadosCNPJ.bairro,
                cep: dadosCNPJ.cep,
                municipio: dadosCNPJ.municipio,
                uf: dadosCNPJ.uf,
                telefone1: dadosCNPJ.telefone1,
                telefone2: dadosCNPJ.telefone2,
                email: dadosCNPJ.email,
                capital_social: dadosCNPJ.capitalSocial,
                porte: dadosCNPJ.porte,
                opcao_simples: dadosCNPJ.opcaoSimples,
                data_opcao_simples: dadosCNPJ.dataOpcaoSimples,
                opcao_mei: dadosCNPJ.opcaoMEI,
                data_exclusao_simples: dadosCNPJ.dataExclusaoSimples,
                situacao_especial: dadosCNPJ.situacaoEspecial,
                data_situacao_especial: dadosCNPJ.dataSituacaoEspecial
            };
            
            await updateCliente(cliente.id, dataToSave);
            setIsEditing(false);
            alert('Dados salvos com sucesso!');
        } catch (err) {
            console.error('Erro ao salvar dados:', err);
            alert('Erro ao salvar dados. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    // Exibe loading enquanto carrega os dados
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-700 dark:text-gray-300">Carregando dados do cliente...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Exibe erro se falhar ao carregar
    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md">
                    <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Exibe o conteúdo se os dados foram carregados
    if (!dadosCNPJ) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white rounded-full p-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Cartão CNPJ</h2>
                            <p className="text-blue-100 text-sm">Comprovante de Inscrição e de Situação Cadastral</p>
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
                    <div className="mb-4 flex justify-end space-x-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Editar</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:bg-green-400 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Salvar</span>
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>
                                <strong>Informação:</strong> Os dados são armazenados no banco de dados. Em uma próxima fase, será integrada a API da Receita Federal para busca automática.
                            </span>
                        </p>
                    </div>

                    {/* Seção 1: Dados Cadastrais */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Número de Inscrição
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="CNPJ" value={dadosCNPJ.cnpj} field="cnpj" readOnly onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Razão Social" value={dadosCNPJ.razaoSocial} field="razaoSocial" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Regime Tributário" value={dadosCNPJ.regimeTributario} field="regimeTributario" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Nome Fantasia" value={dadosCNPJ.nomeFantasia} field="nomeFantasia" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Data de Abertura" value={dadosCNPJ.dataAbertura} field="dataAbertura" onChange={handleInputChange} disabled={!isEditing} />
                        </div>
                    </div>

                    {/* Seção 2: Situação Cadastral */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Situação Cadastral
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Situação Cadastral" value={dadosCNPJ.situacaoCadastral} field="situacaoCadastral" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Data da Situação Cadastral" value={dadosCNPJ.dataSituacao} field="dataSituacao" onChange={handleInputChange} disabled={!isEditing} />
                            <div className="md:col-span-2">
                                <InputField label="Motivo de Situação Cadastral" value={dadosCNPJ.motivoSituacao} field="motivoSituacao" onChange={handleInputChange} disabled={!isEditing} />
                            </div>
                        </div>
                    </div>

                    {/* Seção 3: Natureza Jurídica */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Natureza Jurídica
                        </h3>
                        <InputField label="Código e Descrição da Natureza Jurídica" value={dadosCNPJ.naturezaJuridica} field="naturezaJuridica" onChange={handleInputChange} disabled={!isEditing} />
                    </div>

                    {/* Seção 4: Atividade Econômica */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Atividade Econômica Principal
                        </h3>
                        <InputField label="CNAE Fiscal Principal" value={dadosCNPJ.cnaePrincipal} field="cnaePrincipal" onChange={handleInputChange} disabled={!isEditing} />
                        
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Atividades Econômicas Secundárias
                                </label>
                                {isEditing && (
                                    <button
                                        onClick={handleAddCnaeSecundaria}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Adicionar CNAE
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                {dadosCNPJ.cnaeSecundarias.map((cnae, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={cnae}
                                            onChange={(e) => handleCnaeSecundariaChange(index, e.target.value)}
                                            disabled={!isEditing}
                                            className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                                                isEditing
                                                    ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500'
                                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                        />
                                        {isEditing && (
                                            <button
                                                onClick={() => handleRemoveCnaeSecundaria(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Seção 5: Endereço */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Endereço
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <InputField label="Logradouro" value={dadosCNPJ.logradouro} field="logradouro" onChange={handleInputChange} disabled={!isEditing} />
                            </div>
                            <InputField label="Número" value={dadosCNPJ.numero} field="numero" onChange={handleInputChange} disabled={!isEditing} />
                            <div className="md:col-span-2">
                                <InputField label="Complemento" value={dadosCNPJ.complemento} field="complemento" onChange={handleInputChange} disabled={!isEditing} />
                            </div>
                            <InputField label="CEP" value={dadosCNPJ.cep} field="cep" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Bairro/Distrito" value={dadosCNPJ.bairro} field="bairro" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Município" value={dadosCNPJ.municipio} field="municipio" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="UF" value={dadosCNPJ.uf} field="uf" onChange={handleInputChange} disabled={!isEditing} />
                        </div>
                    </div>

                    {/* Seção 6: Contato */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Contato
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Telefone 1" value={dadosCNPJ.telefone1} field="telefone1" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Telefone 2" value={dadosCNPJ.telefone2} field="telefone2" onChange={handleInputChange} disabled={!isEditing} />
                            <div className="md:col-span-2">
                                <InputField label="E-mail" value={dadosCNPJ.email} field="email" type="email" onChange={handleInputChange} disabled={!isEditing} />
                            </div>
                        </div>
                    </div>

                    {/* Seção 7: Informações Empresariais */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Informações Empresariais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Capital Social" value={dadosCNPJ.capitalSocial} field="capitalSocial" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Porte" value={dadosCNPJ.porte} field="porte" onChange={handleInputChange} disabled={!isEditing} />
                        </div>
                    </div>

                    {/* Seção 8: Opções Fiscais */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Opções Fiscais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Opção pelo Simples" value={dadosCNPJ.opcaoSimples} field="opcaoSimples" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Data de Opção pelo Simples" value={dadosCNPJ.dataOpcaoSimples} field="dataOpcaoSimples" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Opção pelo MEI" value={dadosCNPJ.opcaoMEI} field="opcaoMEI" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Data de Exclusão do Simples" value={dadosCNPJ.dataExclusaoSimples} field="dataExclusaoSimples" onChange={handleInputChange} disabled={!isEditing} />
                        </div>
                    </div>

                    {/* Seção 9: Situação Especial */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b-2 border-blue-600">
                            Situação Especial
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Situação Especial" value={dadosCNPJ.situacaoEspecial} field="situacaoEspecial" onChange={handleInputChange} disabled={!isEditing} />
                            <InputField label="Data da Situação Especial" value={dadosCNPJ.dataSituacaoEspecial} field="dataSituacaoEspecial" onChange={handleInputChange} disabled={!isEditing} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CNPJModal;

