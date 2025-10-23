import React, { useState, useEffect } from 'react';
import { getClienteById, updateCliente, deleteCliente } from '../services/clienteApi';
import { validarCPF, formatarCPF, formatarCEP, formatarTelefone } from '../services/clientePFService';
import { consultarCep } from '../services/cepService';
import { 
    X, 
    Edit, 
    Save, 
    Trash2, 
    User, 
    MapPin, 
    Phone, 
    Mail, 
    DollarSign,
    Calendar,
    CreditCard,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

// Componente InputField
const InputField = ({ label, value, field, type = 'text', readOnly = false, onChange, disabled, error, icon: Icon }) => (
    <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
            {Icon && <Icon className="h-4 w-4 mr-1" />}
            {label}
        </label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            disabled={disabled || readOnly}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
                error
                    ? 'border-red-300 focus:ring-red-500'
                    : !disabled && !readOnly
                    ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            } transition-colors`}
        />
        {error && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {error}
            </p>
        )}
    </div>
);

// Componente SelectField
const SelectField = ({ label, value, field, options, onChange, disabled, icon: Icon }) => (
    <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
            {Icon && <Icon className="h-4 w-4 mr-1" />}
            {label}
        </label>
        <select
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
                !disabled
                    ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            } transition-colors`}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

function ClientePFModal({ cliente, onClose, onClienteDeleted }) {
    const [dadosCliente, setDadosCliente] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [errosCampos, setErrosCampos] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);

    // Busca os dados completos do cliente ao abrir o modal
    useEffect(() => {
        const fetchClienteData = async () => {
            try {
                setLoading(true);
                const data = await getClienteById(cliente.id);
                
                setDadosCliente({
                    id: data.id,
                    tipo_pessoa: data.tipo_pessoa,
                    nome_completo: data.nome_completo || '',
                    cpf: data.cpf || '',
                    rg: data.rg || '',
                    data_nascimento: data.data_nascimento || '',
                    estado_civil: data.estado_civil || '',
                    regime_comunhao: data.regime_comunhao || '',
                    // Endereço
                    logradouro: data.logradouro || '',
                    numero: data.numero || '',
                    complemento: data.complemento || '',
                    bairro: data.bairro || '',
                    cep: data.cep || '',
                    municipio: data.municipio || '',
                    uf: data.uf || '',
                    // Contato
                    telefone1: data.telefone1 || '',
                    telefone2: data.telefone2 || '',
                    email: data.email || '',
                    // Honorários
                    valor_honorarios: data.valor_honorarios || ''
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

    const handleFieldChange = (field, value) => {
        setDadosCliente(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Remove erro do campo quando usuário começa a editar
        if (errosCampos[field]) {
            setErrosCampos(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Valida CPF ao mudar
    const handleCpfChange = (field, value) => {
        const cpfLimpo = value.replace(/\D/g, '');
        const cpfFormatado = formatarCPF(cpfLimpo);
        
        handleFieldChange(field, cpfFormatado);
        
        if (cpfLimpo.length === 11 && !validarCPF(cpfLimpo)) {
            setErrosCampos(prev => ({ ...prev, cpf: 'CPF inválido' }));
        }
    };

    // Busca CEP automaticamente
    const handleCepChange = async (field, value) => {
        const cepLimpo = value.replace(/\D/g, '');
        const cepFormatado = formatarCEP(cepLimpo);
        
        handleFieldChange(field, cepFormatado);
        
        if (cepLimpo.length === 8) {
            setBuscandoCep(true);
            try {
                const dadosCep = await consultarCep(cepLimpo);
                
                setDadosCliente(prev => ({
                    ...prev,
                    cep: cepFormatado,
                    logradouro: dadosCep.logradouro || prev.logradouro,
                    bairro: dadosCep.bairro || prev.bairro,
                    municipio: dadosCep.municipio || prev.municipio,
                    uf: dadosCep.uf || prev.uf,
                }));
                
                setErrosCampos(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.cep;
                    return newErrors;
                });
            } catch (error) {
                setErrosCampos(prev => ({ ...prev, cep: 'CEP não encontrado' }));
            } finally {
                setBuscandoCep(false);
            }
        }
    };

    // Formata telefone ao mudar
    const handleTelefoneChange = (field, value) => {
        const telLimpo = value.replace(/\D/g, '');
        const telFormatado = formatarTelefone(telLimpo);
        handleFieldChange(field, telFormatado);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setErrosCampos({});
        setError(null);
        setSuccessMessage(null);
        // Recarrega os dados originais
        const fetchClienteData = async () => {
            const data = await getClienteById(cliente.id);
            setDadosCliente({
                id: data.id,
                tipo_pessoa: data.tipo_pessoa,
                nome_completo: data.nome_completo || '',
                cpf: data.cpf || '',
                rg: data.rg || '',
                data_nascimento: data.data_nascimento || '',
                estado_civil: data.estado_civil || '',
                regime_comunhao: data.regime_comunhao || '',
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
                valor_honorarios: data.valor_honorarios || ''
            });
        };
        fetchClienteData();
    };

    const validarFormulario = () => {
        const novosErros = {};

        if (!dadosCliente.nome_completo?.trim()) {
            novosErros.nome_completo = 'Nome completo é obrigatório';
        }

        if (!dadosCliente.cpf) {
            novosErros.cpf = 'CPF é obrigatório';
        } else if (!validarCPF(dadosCliente.cpf.replace(/\D/g, ''))) {
            novosErros.cpf = 'CPF inválido';
        }

        if (dadosCliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dadosCliente.email)) {
            novosErros.email = 'Email inválido';
        }

        setErrosCampos(novosErros);
        return Object.keys(novosErros).length === 0;
    };

    const handleSave = async () => {
        if (!validarFormulario()) {
            setError('Por favor, corrija os erros no formulário');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Prepara dados para envio (remove formatação)
            const dadosParaEnvio = {
                ...dadosCliente,
                cpf: dadosCliente.cpf.replace(/\D/g, ''),
                cep: dadosCliente.cep.replace(/\D/g, ''),
                telefone1: dadosCliente.telefone1.replace(/\D/g, ''),
                telefone2: dadosCliente.telefone2.replace(/\D/g, ''),
                valor_honorarios: dadosCliente.valor_honorarios ? parseFloat(dadosCliente.valor_honorarios) : null
            };

            await updateCliente(cliente.id, dadosParaEnvio);
            setIsEditing(false);
            setSuccessMessage('Cliente atualizado com sucesso!');
            
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setError(err.response?.data?.erro || 'Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmacao = window.confirm(
            `Tem certeza que deseja excluir o cliente "${dadosCliente.nome_completo}"?\n\nEsta ação pode ser revertida através da lixeira.`
        );

        if (!confirmacao) return;

        setDeleting(true);
        try {
            await deleteCliente(cliente.id);
            onClienteDeleted?.();
            onClose();
        } catch (err) {
            console.error('Erro ao deletar cliente:', err);
            setError(err.response?.data?.erro || 'Erro ao excluir cliente');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (!dadosCliente) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
                {/* Cabeçalho */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-lg z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {dadosCliente.nome_completo || 'Cliente PF'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    CPF: {dadosCliente.cpf || 'Não informado'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Barra de Ações */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-2">
                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Edit className="h-4 w-4" />
                                    <span>Editar</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleDelete}
                            disabled={deleting || isEditing}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>{deleting ? 'Excluindo...' : 'Excluir'}</span>
                        </button>
                    </div>
                </div>

                {/* Mensagens */}
                <div className="px-6 py-4">
                    {successMessage && (
                        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}
                </div>

                {/* Conteúdo */}
                <div className="px-6 pb-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {/* Dados Pessoais */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                            <User className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Dados Pessoais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <InputField
                                    label="Nome Completo"
                                    value={dadosCliente.nome_completo}
                                    field="nome_completo"
                                    onChange={handleFieldChange}
                                    disabled={!isEditing}
                                    error={errosCampos.nome_completo}
                                    icon={User}
                                />
                            </div>
                            <InputField
                                label="CPF"
                                value={dadosCliente.cpf}
                                field="cpf"
                                onChange={handleCpfChange}
                                disabled={!isEditing}
                                error={errosCampos.cpf}
                                icon={CreditCard}
                            />
                            <InputField
                                label="RG"
                                value={dadosCliente.rg}
                                field="rg"
                                onChange={handleFieldChange}
                                disabled={!isEditing}
                                icon={CreditCard}
                            />
                            <InputField
                                label="Data de Nascimento"
                                value={dadosCliente.data_nascimento}
                                field="data_nascimento"
                                type="date"
                                onChange={handleFieldChange}
                                disabled={!isEditing}
                                icon={Calendar}
                            />
                            <SelectField
                                label="Estado Civil"
                                value={dadosCliente.estado_civil}
                                field="estado_civil"
                                options={[
                                    { value: '', label: 'Selecione...' },
                                    { value: 'solteiro', label: 'Solteiro(a)' },
                                    { value: 'casado', label: 'Casado(a)' },
                                    { value: 'divorciado', label: 'Divorciado(a)' },
                                    { value: 'viuvo', label: 'Viúvo(a)' }
                                ]}
                                onChange={(field, value) => {
                                    handleFieldChange(field, value);
                                    // Limpa o regime de comunhão se não for casado
                                    if (value !== 'casado') {
                                        handleFieldChange('regime_comunhao', '');
                                    }
                                }}
                                disabled={!isEditing}
                                icon={User}
                            />
                            {dadosCliente.estado_civil === 'casado' && (
                                <SelectField
                                    label="Regime de Comunhão"
                                    value={dadosCliente.regime_comunhao}
                                    field="regime_comunhao"
                                    options={[
                                        { value: '', label: 'Selecione...' },
                                        { value: 'comunhao_parcial', label: 'Comunhão Parcial de Bens' },
                                        { value: 'comunhao_universal', label: 'Comunhão Universal de Bens' },
                                        { value: 'separacao_total', label: 'Separação Total de Bens' },
                                        { value: 'separacao_obrigatoria', label: 'Separação Obrigatória de Bens' },
                                        { value: 'participacao_final', label: 'Participação Final nos Aquestos' }
                                    ]}
                                    onChange={handleFieldChange}
                                    disabled={!isEditing}
                                    icon={User}
                                />
                            )}
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                            <MapPin className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Endereço
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2 relative">
                                <InputField
                                    label="CEP"
                                    value={dadosCliente.cep}
                                    field="cep"
                                    onChange={handleCepChange}
                                    disabled={!isEditing}
                                    error={errosCampos.cep}
                                />
                                {buscandoCep && (
                                    <div className="absolute right-3 top-9">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                    </div>
                                )}
                            </div>
                            <div className="lg:col-span-4">
                                <InputField
                                    label="Logradouro"
                                    value={dadosCliente.logradouro}
                                    field="logradouro"
                                    onChange={handleFieldChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <InputField
                                label="Número"
                                value={dadosCliente.numero}
                                field="numero"
                                onChange={handleFieldChange}
                                disabled={!isEditing}
                            />
                            <div className="lg:col-span-3">
                                <InputField
                                    label="Complemento"
                                    value={dadosCliente.complemento}
                                    field="complemento"
                                    onChange={handleFieldChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <InputField
                                    label="Bairro"
                                    value={dadosCliente.bairro}
                                    field="bairro"
                                    onChange={handleFieldChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <InputField
                                    label="Município"
                                    value={dadosCliente.municipio}
                                    field="municipio"
                                    onChange={handleFieldChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <InputField
                                label="UF"
                                value={dadosCliente.uf}
                                field="uf"
                                onChange={handleFieldChange}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    {/* Contato */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                            <Phone className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Contato
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Telefone Principal"
                                value={dadosCliente.telefone1}
                                field="telefone1"
                                onChange={handleTelefoneChange}
                                disabled={!isEditing}
                                icon={Phone}
                            />
                            <InputField
                                label="Telefone Secundário"
                                value={dadosCliente.telefone2}
                                field="telefone2"
                                onChange={handleTelefoneChange}
                                disabled={!isEditing}
                                icon={Phone}
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label="Email"
                                    value={dadosCliente.email}
                                    field="email"
                                    type="email"
                                    onChange={handleFieldChange}
                                    disabled={!isEditing}
                                    error={errosCampos.email}
                                    icon={Mail}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Honorários */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                            <DollarSign className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Honorários
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Valor Mensal (R$)"
                                value={dadosCliente.valor_honorarios}
                                field="valor_honorarios"
                                type="number"
                                onChange={handleFieldChange}
                                disabled={!isEditing}
                                icon={DollarSign}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientePFModal;

