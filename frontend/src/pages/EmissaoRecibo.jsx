import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Printer } from 'lucide-react';
import clienteApi from '../services/clienteApi';
import contadorApi from '../services/contadorApi';
import reciboApi from '../services/reciboApi';
import ReciboVisualizacao from '../components/ReciboVisualizacao';

function EmissaoRecibo() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [contadores, setContadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reciboGerado, setReciboGerado] = useState(null);
    
    const [formData, setFormData] = useState({
        cliente_id: '',
        contador_id: '',
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        valor: '',
        tipo_servico: 'honorarios',
        descricao_servico: ''
    });
    const [clienteSelecionado, setClienteSelecionado] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [clientesData, contadoresData] = await Promise.all([
                clienteApi.listar(),
                contadorApi.listar()
            ]);

            setClientes(clientesData);
            setContadores(contadoresData);

            // Seleciona o primeiro contador automaticamente se houver apenas um
            if (contadoresData.length === 1) {
                setFormData(prev => ({ ...prev, contador_id: contadoresData[0].id }));
            }
        } catch (err) {
            setError('Erro ao carregar dados: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Se mudou o cliente, busca os dados dele
        if (name === 'cliente_id' && value) {
            const cliente = clientes.find(c => c.id === parseInt(value));
            setClienteSelecionado(cliente);
            
            // Se tipo de serviço é honorários, preenche automaticamente com o valor do cliente ou padrão
            if (formData.tipo_servico === 'honorarios') {
                const valorHonorarios = cliente?.valor_honorarios || 500.00;
                setFormData(prev => ({
                    ...prev,
                    [name]: value,
                    valor: parseFloat(valorHonorarios).toFixed(2)
                }));
                return;
            }
        }
        
        // Se mudou o tipo de serviço para honorários, preenche com o valor do cliente ou padrão
        if (name === 'tipo_servico' && value === 'honorarios' && clienteSelecionado) {
            const valorHonorarios = clienteSelecionado?.valor_honorarios || 500.00;
            setFormData(prev => ({
                ...prev,
                [name]: value,
                valor: parseFloat(valorHonorarios).toFixed(2)
            }));
            return;
        }
        
        // Se mudou de honorários para outros, limpa o valor
        if (name === 'tipo_servico' && value === 'outros') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                valor: ''
            }));
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validações
        if (!formData.cliente_id) {
            setError('Selecione um cliente');
            return;
        }

        if (!formData.contador_id) {
            setError('Selecione um contador');
            return;
        }

        if (contadores.length === 0) {
            setError('É necessário cadastrar um contador antes de emitir recibos');
            return;
        }

        if (!formData.valor || parseFloat(formData.valor) <= 0) {
            setError('Informe um valor válido');
            return;
        }

        if (formData.tipo_servico === 'outros' && !formData.descricao_servico) {
            setError('Informe a descrição do serviço');
            return;
        }

        try {
            const dados = {
                ...formData,
                cliente_id: parseInt(formData.cliente_id),
                contador_id: parseInt(formData.contador_id),
                mes: parseInt(formData.mes),
                ano: parseInt(formData.ano),
                valor: parseFloat(formData.valor)
            };

            const response = await reciboApi.criar(dados);
            
            // Busca o recibo completo com todos os dados
            const reciboCompleto = await reciboApi.buscar(response.recibo.id);
            setReciboGerado(reciboCompleto);
        } catch (err) {
            setError(err.response?.data?.erro || 'Erro ao gerar recibo: ' + err.message);
        }
    };

    const handleNovoRecibo = () => {
        setReciboGerado(null);
        setFormData({
            cliente_id: '',
            contador_id: contadores.length === 1 ? contadores[0].id : '',
            mes: new Date().getMonth() + 1,
            ano: new Date().getFullYear(),
            valor: '',
            tipo_servico: 'honorarios',
            descricao_servico: ''
        });
        setError('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Carregando...</div>
            </div>
        );
    }

    // Se um recibo foi gerado, mostrar a visualização
    if (reciboGerado) {
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

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6" />
                        <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Recibo Gerado</h1>
                    </div>
                    <button
                        onClick={handleNovoRecibo}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Novo Recibo
                    </button>
                </div>

                <ReciboVisualizacao recibo={reciboGerado} onClose={handleNovoRecibo} />
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
            <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Emissão de Recibo</h1>
            </div>

            {/* Aviso se não houver contador */}
            {contadores.length === 0 && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p className="font-semibold">Atenção!</p>
                    <p>É necessário cadastrar um contador antes de emitir recibos.</p>
                    <button
                        onClick={() => navigate('/gerenciar-contador')}
                        className="mt-2 text-blue-600 hover:text-blue-800 underline"
                    >
                        Cadastrar Contador
                    </button>
                </div>
            )}

            {/* Mensagem de erro */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            {/* Formulário */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seleção de Cliente */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Cliente *
                        </label>
                        <select
                            name="cliente_id"
                            value={formData.cliente_id}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        >
                            <option value="">Selecione um cliente</option>
                            {clientes.map(cliente => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.razao_social} - {cliente.cnpj}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Seleção de Contador */}
                    {contadores.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Contador *
                            </label>
                            <select
                                name="contador_id"
                                value={formData.contador_id}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            >
                                <option value="">Selecione um contador</option>
                                {contadores.map(contador => (
                                    <option key={contador.id} value={contador.id}>
                                        {contador.nome} - CRC: {contador.crc}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Competência */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Mês *
                            </label>
                            <select
                                name="mes"
                                value={formData.mes}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                                    <option key={mes} value={mes}>
                                        {new Date(2000, mes - 1).toLocaleString('pt-BR', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Ano *
                            </label>
                            <select
                                name="ano"
                                value={formData.ano}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(ano => (
                                    <option key={ano} value={ano}>{ano}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Valor (R$) *
                        </label>
                        <input
                            type="number"
                            name="valor"
                            value={formData.valor}
                            onChange={handleInputChange}
                            onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                    setFormData(prev => ({ ...prev, valor: value.toFixed(2) }));
                                }
                            }}
                            required
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            disabled={formData.tipo_servico === 'honorarios'}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                        />
                        {formData.tipo_servico === 'honorarios' && clienteSelecionado?.valor_honorarios && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Valor fixado no cadastro do cliente
                            </p>
                        )}
                        {formData.tipo_servico === 'honorarios' && !clienteSelecionado?.valor_honorarios && formData.cliente_id && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                ℹ️ Cliente sem valor personalizado. Usando valor padrão de R$ 500,00
                            </p>
                        )}
                    </div>

                    {/* Tipo de Serviço */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Tipo de Serviço *
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="tipo_servico"
                                    value="honorarios"
                                    checked={formData.tipo_servico === 'honorarios'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4"
                                />
                                <span>Honorários</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="tipo_servico"
                                    value="outros"
                                    checked={formData.tipo_servico === 'outros'}
                                    onChange={handleInputChange}
                                    className="w-4 h-4"
                                />
                                <span>Outros</span>
                            </label>
                        </div>
                    </div>

                    {/* Descrição do Serviço (se tipo = outros) */}
                    {formData.tipo_servico === 'outros' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Descrição do Serviço *
                            </label>
                            <input
                                type="text"
                                name="descricao_servico"
                                value={formData.descricao_servico}
                                onChange={handleInputChange}
                                required={formData.tipo_servico === 'outros'}
                                placeholder="Ex: Consultoria Tributária Especial - Outubro/2025"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            />
                        </div>
                    )}

                    {/* Botão Gerar */}
                    <div className="flex justify-end pt-4 border-t dark:border-gray-600">
                        <button
                            type="submit"
                            disabled={contadores.length === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Printer className="w-5 h-5" />
                            Gerar Recibo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EmissaoRecibo;

