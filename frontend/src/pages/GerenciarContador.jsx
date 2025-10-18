import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserPlus, Edit2, Upload, ArrowLeft, Save, X } from 'lucide-react';
import contadorApi from '../services/contadorApi';

function GerenciarContador() {
    const navigate = useNavigate();
    const [contador, setContador] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        crc: '',
        pix: '',
        banco: '',
        agencia: '',
        conta_corrente: '',
        imagem_assinatura: null,
        imagem_logo: null
    });

    useEffect(() => {
        carregarContador();
    }, []);

    const carregarContador = async () => {
        try {
            const contadores = await contadorApi.listar();
            if (contadores && contadores.length > 0) {
                const cont = contadores[0];
                setContador(cont);
                setFormData({
                    nome: cont.nome || '',
                    cpf: cont.cpf || '',
                    crc: cont.crc || '',
                    pix: cont.pix || '',
                    banco: cont.banco || '',
                    agencia: cont.agencia || '',
                    conta_corrente: cont.conta_corrente || '',
                    imagem_assinatura: cont.imagem_assinatura || null,
                    imagem_logo: cont.imagem_logo || null
                });
                setEditMode(false);
            } else {
                // Não existe contador, entrar em modo de criação
                setEditMode(true);
            }
        } catch (err) {
            setError('Erro ao carregar contador: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Aplicar máscaras
        let valorFormatado = value;
        
        if (name === 'cpf') {
            // Máscara CPF: 000.000.000-00
            valorFormatado = value.replace(/\D/g, '');
            if (valorFormatado.length <= 11) {
                valorFormatado = valorFormatado
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d)/, '$1.$2')
                    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            } else {
                valorFormatado = valorFormatado.slice(0, 11);
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: valorFormatado
        }));
    };
    
    const validarCPF = (cpf) => {
        const cpfLimpo = cpf.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) return false;
        
        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpfLimpo)) return false;
        
        // Validação dos dígitos verificadores
        let soma = 0;
        let resto;
        
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
        
        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
        
        return true;
    };

    const handleImageUpload = (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        // Limitar tamanho da imagem (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                [fieldName]: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validações
        if (!validarCPF(formData.cpf)) {
            setError('CPF inválido');
            return;
        }

        if (formData.nome.trim().length < 3) {
            setError('Nome deve ter pelo menos 3 caracteres');
            return;
        }

        if (formData.crc.trim().length < 5) {
            setError('CRC inválido');
            return;
        }

        if (formData.pix.trim().length < 5) {
            setError('Chave PIX inválida');
            return;
        }

        if (formData.banco.trim().length < 3) {
            setError('Nome do banco inválido');
            return;
        }

        if (formData.agencia.trim().length < 1) {
            setError('Agência inválida');
            return;
        }

        if (formData.conta_corrente.trim().length < 1) {
            setError('Conta corrente inválida');
            return;
        }

        try {
            if (contador) {
                // Atualizar contador existente
                await contadorApi.atualizar(contador.id, formData);
                setSuccess('Contador atualizado com sucesso!');
            } else {
                // Criar novo contador
                await contadorApi.criar(formData);
                setSuccess('Contador criado com sucesso!');
            }
            await carregarContador();
            setEditMode(false);
        } catch (err) {
            setError(err.response?.data?.erro || 'Erro ao salvar contador: ' + err.message);
        }
    };

    const handleCancel = () => {
        if (contador) {
            // Restaurar dados originais
            setFormData({
                nome: contador.nome || '',
                cpf: contador.cpf || '',
                crc: contador.crc || '',
                pix: contador.pix || '',
                banco: contador.banco || '',
                agencia: contador.agencia || '',
                conta_corrente: contador.conta_corrente || '',
                imagem_assinatura: contador.imagem_assinatura || null,
                imagem_logo: contador.imagem_logo || null
            });
            setEditMode(false);
        } else {
            navigate('/dashboard');
        }
        setError('');
        setSuccess('');
    };

    const formatarCPF = (cpf) => {
        if (!cpf) return '';
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Botão Voltar */}
            <button
                onClick={() => navigate('/app/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground dark:text-dark-foreground bg-card dark:bg-dark-card hover:bg-primary/10 dark:hover:bg-primary/20 border border-border-default dark:border-dark-border-default rounded-lg transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Dashboard
            </button>

            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <User className="w-6 h-6" />
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">
                        {contador ? 'Gerenciar Contador' : 'Cadastrar Contador'}
                    </h1>
                </div>
                
                {contador && !editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Edit2 className="w-5 h-5" />
                        Editar
                    </button>
                )}
            </div>

            {/* Mensagens */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                    {success}
                </div>
            )}

            {/* Formulário */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados Pessoais */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Dados Pessoais</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    CPF *
                                </label>
                                <input
                                    type="text"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    required
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                                />
                                {editMode && formData.cpf && !validarCPF(formData.cpf) && (
                                    <p className="text-red-500 text-sm mt-1">CPF inválido</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    CRC *
                                </label>
                                <input
                                    type="text"
                                    name="crc"
                                    value={formData.crc}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    required
                                    placeholder="RJ-125443/O-4"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dados Bancários */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Dados Bancários</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    PIX *
                                </label>
                                <input
                                    type="text"
                                    name="pix"
                                    value={formData.pix}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    required
                                    placeholder="Chave PIX"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Banco *
                                </label>
                                <input
                                    type="text"
                                    name="banco"
                                    value={formData.banco}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    required
                                    placeholder="041 - Banco Itaú"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Agência *
                                </label>
                                <input
                                    type="text"
                                    name="agencia"
                                    value={formData.agencia}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    required
                                    placeholder="0000"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Conta Corrente *
                                </label>
                                <input
                                    type="text"
                                    name="conta_corrente"
                                    value={formData.conta_corrente}
                                    onChange={handleInputChange}
                                    disabled={!editMode}
                                    required
                                    placeholder="00000-0"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Imagens */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Imagens</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Assinatura */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Assinatura
                                </label>
                                {formData.imagem_assinatura && (
                                    <div className="mb-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <img
                                            src={formData.imagem_assinatura}
                                            alt="Assinatura"
                                            className="max-h-32 mx-auto"
                                        />
                                    </div>
                                )}
                                {editMode && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'imagem_assinatura')}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Logo Empresarial
                                </label>
                                {formData.imagem_logo && (
                                    <div className="mb-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <img
                                            src={formData.imagem_logo}
                                            alt="Logo"
                                            className="max-h-32 mx-auto"
                                        />
                                    </div>
                                )}
                                {editMode && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'imagem_logo')}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Botões */}
                    {editMode && (
                        <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-600">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 border border-border-default dark:border-dark-border-default rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Save className="w-5 h-5" />
                                Salvar
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default GerenciarContador;

